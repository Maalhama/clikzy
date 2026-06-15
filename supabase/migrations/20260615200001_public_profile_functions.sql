-- P1.1 (fuite PII) — étape A, ADDITIVE / non-breaking.
-- Fonctions DEFINER exposant UNIQUEMENT les colonnes publiques d'un profil, pour
-- les lectures cross-user (profil partageable, gagnants du lobby). Permet ensuite
-- (étape C) de restreindre la policy SELECT `authenticated` à sa propre ligne sans
-- casser ces lectures publiques. Aucune colonne PII (shipping_*, vip_subscription_id,
-- is_admin, referred_by, credits) n'est renvoyée.

-- Profil public par username (page /joueur/[username]) + nombre de badges.
create or replace function public.get_public_profile(p_username text)
returns table (
  id uuid,
  username text,
  avatar_url text,
  total_wins integer,
  total_clicks integer,
  created_at timestamptz,
  is_vip boolean,
  level integer,
  xp integer,
  badges bigint
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    p.id,
    p.username::text,
    p.avatar_url::text,
    p.total_wins::integer,
    p.total_clicks::integer,
    p.created_at::timestamptz,
    p.is_vip::boolean,
    p.level::integer,
    p.xp::integer,
    (select count(*) from public.user_badges b where b.user_id = p.id)::bigint
  from public.profiles p
  where p.username = p_username
  limit 1;
$$;

-- Profils publics par lot d'IDs (avatars des gagnants : landing + realtime).
create or replace function public.get_public_profiles(p_ids uuid[])
returns table (
  id uuid,
  username text,
  avatar_url text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select p.id, p.username::text, p.avatar_url::text
  from public.profiles p
  where p.id = any(p_ids);
$$;

revoke all on function public.get_public_profile(text) from public;
revoke all on function public.get_public_profiles(uuid[]) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;
grant execute on function public.get_public_profiles(uuid[]) to anon, authenticated;
