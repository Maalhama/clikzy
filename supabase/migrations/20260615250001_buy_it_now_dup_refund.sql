-- Fix double-paiement Buy-It-Now : 2 sessions Stripe distinctes sur le MÊME item
-- (user, game). La 2e tombait en conflit (user_id, game_id) et renvoyait
-- {ok:true, recorded:false} -> le webhook ne remboursait PAS (il ne rembourse que sur
-- ok:false). Le joueur payait 2x et recevait 1 lot. On renvoie désormais ok:false sur
-- ce doublon (session NEUVE, distincte du replay de même session géré plus haut) ->
-- le webhook déclenche son remboursement automatique existant (+ alerte admin).
create or replace function record_buy_it_now(
  p_user_id uuid, p_game_id uuid, p_price numeric, p_session text
) returns jsonb as $$
declare
  v_item record;
  v_rows integer;
begin
  -- Replay de la MÊME session (idempotent) : achat déjà honoré, surtout ne pas rembourser.
  if p_session is not null and exists (
    select 1 from buy_it_now_purchases where stripe_session = p_session
  ) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  select i.id as item_id, i.name as item_name into v_item
  from games g join items i on i.id = g.item_id where g.id = p_game_id;
  if v_item.item_id is null then
    return jsonb_build_object('ok', false, 'error', 'game_not_found');
  end if;

  insert into buy_it_now_purchases(user_id, game_id, item_id, item_name, price_paid, stripe_session)
  values (p_user_id, p_game_id, v_item.item_id, v_item.item_name, p_price, p_session)
  on conflict (user_id, game_id) do nothing;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    -- (user, game) déjà acheté via une AUTRE session : double paiement -> rembourser.
    return jsonb_build_object('ok', false, 'error', 'duplicate_purchase');
  end if;

  return jsonb_build_object('ok', true, 'recorded', true);
end;
$$ language plpgsql security definer set search_path = pg_catalog, public;
