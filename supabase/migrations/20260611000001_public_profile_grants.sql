-- ============================================================
-- Profil public /joueur/[username] : expose level/xp aux visiteurs
-- anonymes (non-PII, déjà visibles indirectement via le classement).
-- La liste blanche anon reste par colonnes (PII toujours protégée).
-- ============================================================
GRANT SELECT (level, xp) ON public.profiles TO anon;
