-- P3 (semi-PII) : winners.tracking_number était lisible par tout anon/authenticated
-- via PostgREST direct (USING(true) + grant table) -> on pouvait pister le colis d'un
-- autre gagnant. Même classe que la fuite profiles, fermée de la même façon :
--   * anon + authenticated : grant colonne sur TOUTES les colonnes SAUF tracking_number
--     (les murs de gagnants publics ne lisent jamais tracking_number -> intacts).
--   * le PROPRIÉTAIRE voit son propre tracking via la fonction DEFINER get_my_winners()
--     (le profil l'affiche : « N° de suivi »).
-- L'admin lit via service_role (bypass). Grant dynamique (DO) -> aucune colonne oubliée.

revoke select on public.winners from anon, authenticated;

do $$
declare cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'winners'
    and column_name <> 'tracking_number';
  execute 'grant select (' || cols || ') on public.winners to anon, authenticated';
end $$;

-- Gains du joueur courant, COMPLETS (avec tracking_number). auth.uid() en interne
-- (pas d'IDOR possible). DEFINER -> bypass le grant colonne ci-dessus pour le propriétaire.
create or replace function public.get_my_winners()
returns setof public.winners
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select * from public.winners
  where user_id = (select auth.uid())
  order by won_at desc;
$$;

revoke all on function public.get_my_winners() from public;
grant execute on function public.get_my_winners() to authenticated;
