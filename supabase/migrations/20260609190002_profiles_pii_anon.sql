-- ============================================================
-- Fuite PII (high) : la policy "Profiles are viewable by everyone" (SELECT TO anon,
-- authenticated USING true) exposait TOUTES les colonnes de profiles à n'importe
-- quel visiteur ANONYME via la clé anon publique : adresse de livraison, téléphone,
-- nom/prénom, vip_subscription_id (Stripe), is_admin (cartographie des admins).
--
-- Correctif (privilèges colonne pour le rôle anon) : anon ne peut plus lire QUE les
-- colonnes d'affichage public. Les colonnes sensibles deviennent inaccessibles à anon.
-- Les lectures du code (feed live, leaderboard) ne sélectionnent que username/avatar/
-- stats publiques -> aucun impact. Le rôle authenticated conserve son accès (ses
-- propres lectures de profil), le service_role bypasse la RLS.
-- ============================================================

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, username, avatar_url, total_wins, total_clicks, created_at, is_vip)
  ON public.profiles TO anon;

-- garantir que authenticated garde un accès SELECT complet (idempotent)
GRANT SELECT ON public.profiles TO authenticated;
