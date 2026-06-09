-- ============================================================
-- Ferme le self-mint : add_mini_game_credits n'est plus appelable par
-- `authenticated` (un joueur pouvait minter via supabase.rpc directement avec
-- un p_amount arbitraire). Désormais service_role uniquement -> seul le code
-- serveur de confiance (Server Actions mini-jeux, qui recalculent le gain) l'appelle.
-- À APPLIQUER APRÈS le déploiement du code mini-jeux basculé sur service_role.
-- ============================================================

REVOKE EXECUTE ON FUNCTION add_mini_game_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION add_mini_game_credits(uuid, integer) TO service_role;
