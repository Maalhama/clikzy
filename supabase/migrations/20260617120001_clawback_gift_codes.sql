-- #102 — Reprise / invalidation des CODES CADEAU sur remboursement / chargeback.
--
-- Faille fermée : un cadeau (gift_codes, paiement one-shot Stripe) remboursé ne
-- déclenchait NI invalidation du code NON réclamé, NI reprise des crédits déjà
-- réclamés. Donc : offrir -> se faire rembourser -> le code reste valide / les
-- crédits restent chez le destinataire = double-dépense (argent rendu + valeur gardée).
--
-- Correctif :
--   * code NON réclamé        -> voided_at : le code devient inutilisable (redeem refuse).
--   * code DÉJÀ réclamé (credits) -> reprise des earned_credits du destinataire (borné 0).
--   * code DÉJÀ réclamé (vip)  -> jours VIP déjà accordés : reprise ambiguë -> clawed_back_at
--                                 + signalement (le webhook alerte l'admin pour traitement manuel).
-- Idempotent via clawed_back_at + FOR UPDATE.

alter table public.gift_codes
  add column if not exists voided_at      timestamptz,
  add column if not exists clawed_back_at timestamptz;

-- redeem_gift_code : refuse un code invalidé (voided). Identique au reste sinon.
create or replace function redeem_gift_code(p_code text, p_user_id uuid)
returns jsonb as $$
declare g gift_codes%rowtype;
begin
  -- Anti-IDOR : un client ne peut réclamer que pour lui-même.
  if auth.uid() is not null and p_user_id is distinct from auth.uid() then
    raise exception 'forbidden';
  end if;

  select * into g from gift_codes where code = upper(trim(p_code)) for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'invalid'); end if;
  if g.redeemed_by is not null then return jsonb_build_object('ok', false, 'error', 'already_redeemed'); end if;
  if g.voided_at is not null then return jsonb_build_object('ok', false, 'error', 'voided'); end if;
  if g.expires_at < now() then return jsonb_build_object('ok', false, 'error', 'expired'); end if;
  if g.gifter_id is not null and g.gifter_id = p_user_id then
    return jsonb_build_object('ok', false, 'error', 'own_gift');
  end if;

  update gift_codes set redeemed_by = p_user_id, redeemed_at = now() where code = g.code;

  if g.kind = 'credits' then
    update profiles set earned_credits = earned_credits + g.credits where id = p_user_id;
    return jsonb_build_object('ok', true, 'kind', 'credits', 'credits', g.credits);
  else
    -- VIP offert : pass non-récurrent, prolonge vip_expires_at (sans subscription_id).
    update profiles
       set is_vip = true,
           vip_expires_at = greatest(coalesce(vip_expires_at, now()), now()) + make_interval(days => g.vip_days)
     where id = p_user_id;
    return jsonb_build_object('ok', true, 'kind', 'vip', 'vip_days', g.vip_days);
  end if;
end;
$$ language plpgsql security definer set search_path = pg_catalog, public;

revoke all on function redeem_gift_code(text, uuid) from public;
grant execute on function redeem_gift_code(text, uuid) to authenticated;

-- Reprise d'un code cadeau à partir de sa session Stripe (appelé par le webhook).
create or replace function public.clawback_gift_code(p_session text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare g gift_codes%rowtype;
begin
  select * into g from public.gift_codes where stripe_session = p_session for update;

  -- Pas un cadeau : le webhook enchaînera sur le clawback de pack.
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_a_gift');
  end if;
  if g.clawed_back_at is not null then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  -- Code jamais réclamé -> on l'invalide simplement.
  if g.redeemed_by is null then
    update public.gift_codes
       set voided_at = now(), clawed_back_at = now()
     where code = g.code;
    return jsonb_build_object('ok', true, 'voided', true, 'code', g.code);
  end if;

  -- Déjà réclamé : crédits -> reprise chez le destinataire (borné 0).
  if g.kind = 'credits' then
    update public.profiles
       set earned_credits = greatest(0, earned_credits - greatest(coalesce(g.credits, 0), 0))
     where id = g.redeemed_by;
    update public.gift_codes set clawed_back_at = now() where code = g.code;
    return jsonb_build_object('ok', true, 'clawed_credits', greatest(coalesce(g.credits, 0), 0), 'redeemer', g.redeemed_by);
  end if;

  -- Déjà réclamé : VIP -> jours déjà accordés, reprise ambiguë -> manuel.
  update public.gift_codes set clawed_back_at = now() where code = g.code;
  return jsonb_build_object('ok', true, 'vip_manual', true, 'redeemer', g.redeemed_by, 'vip_days', g.vip_days);
end;
$$;

revoke all on function public.clawback_gift_code(text) from public;
grant execute on function public.clawback_gift_code(text) to service_role;
