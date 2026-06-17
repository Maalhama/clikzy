-- #100 — Reprise du COST-BASIS (purchased_value_cents) sur remboursement / chargeback.
--
-- Faille fermée : acheter un pack incrémente `purchased_value_cents` (le cash réel qui
-- finance la jauge « a payé 2× la valeur »). Le clawback existant reprenait les
-- `earned_credits` mais PAS ce cost-basis. Un joueur pouvait donc :
--   1. acheter 100€ -> purchased_value_cents += 10000 ; earned_credits += N
--   2. se faire rembourser -> earned_credits repris, MAIS purchased_value_cents = 10000 (orphelin)
--   3. gagner 1 crédit earned gratuit (badge / parrainage), cliquer une fois
--      -> increment_item_gauge draine v_cost = LEAST(10000, …) = 10000 d'un coup
--      -> jauge complétée = item garanti, alors que le cash a été rendu (item gratuit + argent récupéré).
--
-- Correctif : on enregistre le cash payé PAR SESSION (credit_grant_sessions.amount_cents)
-- puis le clawback le reprend aussi (borné à 0, jamais négatif). Idempotent via clawed_back_at.

alter table public.credit_grant_sessions
  add column if not exists amount_cents bigint not null default 0;

-- add_purchased_value passe de 2 -> 3 args (ajout p_session pour stamper la session).
-- Seul appelant : le webhook feat/shop-redesign (prod main ne l'appelle pas, cf. 120003).
-- On DROP l'ancienne signature pour éviter l'ambiguïté d'overload.
drop function if exists public.add_purchased_value(uuid, integer);

create function public.add_purchased_value(
  p_user_id uuid, p_amount_cents integer, p_session text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_amount_cents is null or p_amount_cents <= 0 then return; end if;

  update public.profiles
    set purchased_value_cents = purchased_value_cents + p_amount_cents
    where id = p_user_id;

  -- Stampe le cash sur la session de grant pour permettre la reprise au clawback.
  if p_session is not null and p_session <> '' then
    update public.credit_grant_sessions
      set amount_cents = p_amount_cents
      where stripe_session = p_session;
  end if;
end;
$$;

revoke execute on function public.add_purchased_value(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.add_purchased_value(uuid, integer, text) to service_role;

-- Clawback étendu : reprend les earned_credits ET le cost-basis (purchased_value_cents).
create or replace function public.clawback_pack_credits(p_session text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user    uuid;
  v_amount  integer;
  v_cash    bigint;
  v_already timestamptz;
begin
  select user_id, credits_granted, amount_cents, clawed_back_at
    into v_user, v_amount, v_cash, v_already
  from public.credit_grant_sessions
  where stripe_session = p_session
  for update;

  if v_user is null then
    return jsonb_build_object('ok', false, 'reason', 'session_not_found');
  end if;
  if v_already is not null then
    return jsonb_build_object('ok', true, 'already', true, 'amount', 0, 'cash_cents', 0);
  end if;

  update public.profiles
    set earned_credits          = greatest(0, earned_credits - greatest(coalesce(v_amount, 0), 0)),
        purchased_value_cents   = greatest(0, purchased_value_cents - greatest(coalesce(v_cash, 0), 0))
    where id = v_user;

  update public.credit_grant_sessions
    set clawed_back_at = now()
    where stripe_session = p_session;

  return jsonb_build_object(
    'ok', true,
    'user_id', v_user,
    'amount', greatest(coalesce(v_amount, 0), 0),
    'cash_cents', greatest(coalesce(v_cash, 0), 0)
  );
end;
$$;

revoke all on function public.clawback_pack_credits(text) from public;
grant execute on function public.clawback_pack_credits(text) to service_role;
