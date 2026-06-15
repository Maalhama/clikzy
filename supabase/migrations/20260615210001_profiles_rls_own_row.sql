-- P1.1 (fuite PII) — étape C, RESTRICTIVE.
-- ⚠️ À APPLIQUER UNIQUEMENT APRÈS le déploiement du code qui route les lectures
-- cross-user via get_public_profile / get_public_profiles (migration 20260615200001).
-- Sinon /joueur/[username], la landing et le realtime des gagnants cassent pour les
-- utilisateurs CONNECTÉS (ils ne pourraient plus lire la ligne des autres).
--
-- Avant : une seule policy SELECT « Profiles are viewable by everyone » USING(true)
-- pour {anon, authenticated} + GRANT SELECT table entière à authenticated => tout
-- compte connecté lisait shipping_*, vip_subscription_id, is_admin, referred_by,
-- credits de TOUS les autres. Fuite RGPD.
--
-- Après : authenticated ne lit que sa propre ligne ; anon garde l'accès public
-- déjà borné aux colonnes whitelistées par les GRANT colonne (username, avatar_url,
-- level, xp, total_wins, total_clicks, created_at, is_vip, cosmetic_*, fair_*).

drop policy if exists "Profiles are viewable by everyone" on public.profiles;

-- anon : lecture publique, limitée aux colonnes accordées par GRANT colonne.
create policy "Profiles: anon public columns"
  on public.profiles for select to anon
  using (true);

-- authenticated : uniquement sa propre ligne.
create policy "Profiles: authenticated own row"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
