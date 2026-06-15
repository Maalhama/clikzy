-- Régression du fix RLS own-row (20260615210001) : le roster de clan (getMyClan)
-- lisait username/level/xp des autres membres via un embed `profiles(...)` sur le
-- client session — qui renvoie désormais NULL (authenticated = own-row). Résultat :
-- tous les autres membres affichés « Joueur / niveau 1 / 0 XP ».
-- Fonction DEFINER bornée aux colonnes PUBLIQUES (mêmes que get_public_profile),
-- pour reconstruire le roster. L'appartenance à un clan est déjà publique (clans +
-- clan_members en USING(true)), donc pas d'autorisation supplémentaire requise.
create or replace function public.get_clan_members(p_clan_id uuid)
returns table (
  user_id uuid,
  username text,
  level integer,
  xp integer,
  role text,
  joined_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    cm.user_id,
    p.username::text,
    p.level::integer,
    p.xp::integer,
    cm.role::text,
    cm.joined_at
  from public.clan_members cm
  join public.profiles p on p.id = cm.user_id
  where cm.clan_id = p_clan_id
  order by cm.joined_at;
$$;

revoke all on function public.get_clan_members(uuid) from public;
grant execute on function public.get_clan_members(uuid) to authenticated;
