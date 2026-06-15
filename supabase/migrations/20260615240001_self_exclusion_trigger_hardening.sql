-- Durcissement : le trigger anti-self-exclusion court-circuitait sur is_bot=true.
-- Un joueur réel auto-exclu pouvait donc insérer un clic brut (PostgREST) avec
-- is_bot=true et franchir la barrière. On ne se base plus que sur user_id IS NOT NULL
-- (les bots ont user_id NULL -> non concernés ; un humain a toujours user_id non NULL,
-- quel que soit is_bot).
create or replace function block_self_excluded_clicks() returns trigger as $$
begin
  if new.user_id is not null
     and exists (
       select 1 from user_self_exclusion
       where user_id = new.user_id and excluded_until > now()
     ) then
    raise exception 'self_excluded';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = pg_catalog, public;
