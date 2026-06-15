-- Anti-fraude : reprise des crédits permanents (earned_credits) accordés pour un
-- pack, quand le paiement est remboursé (admin) ou contesté (chargeback). Sans ça :
-- acheter -> dépenser/cliquer -> se faire rembourser = crédits gardés + argent rendu.
-- Idempotent (clawed_back_at + FOR UPDATE) : un 2e event (ex. refund puis dispute sur
-- le même paiement) ne reprend pas deux fois. Borné à 0 (jamais de solde négatif).

alter table public.credit_grant_sessions
  add column if not exists clawed_back_at timestamptz;

create or replace function public.clawback_pack_credits(p_session text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user   uuid;
  v_amount integer;
  v_already timestamptz;
begin
  select user_id, credits_granted, clawed_back_at
    into v_user, v_amount, v_already
  from public.credit_grant_sessions
  where stripe_session = p_session
  for update;

  if v_user is null then
    return jsonb_build_object('ok', false, 'reason', 'session_not_found');
  end if;
  if v_already is not null then
    return jsonb_build_object('ok', true, 'already', true, 'amount', 0);
  end if;

  update public.profiles
    set earned_credits = greatest(0, earned_credits - greatest(coalesce(v_amount, 0), 0))
    where id = v_user;

  update public.credit_grant_sessions
    set clawed_back_at = now()
    where stripe_session = p_session;

  return jsonb_build_object('ok', true, 'user_id', v_user, 'amount', greatest(coalesce(v_amount, 0), 0));
end;
$$;

revoke all on function public.clawback_pack_credits(text) from public;
grant execute on function public.clawback_pack_credits(text) to service_role;
