-- ============================================================================
-- Lot G (confiance / jeu responsable) : limites de gains « équité ». Plafonnent
-- les gains d'un même joueur pour laisser leur chance aux autres ET réduire le
-- risque légal (anti-whale). C'est un BLOCAGE DE PARTICIPATION : au-delà du
-- plafond, le joueur ne peut plus cliquer sur de nouvelles enchères jusqu'au
-- reset — on ne touche PAS à end_game (chemin critique de désignation du gagnant).
--
-- Plafonds (alignés avec WIN_LIMIT_* côté app) :
--   - 8 gains sur 7 jours glissants (tous produits confondus),
--   - 12 gains sur un même produit / 365 jours.
-- ============================================================================

-- Index pour compter efficacement (idx_winners_user existe déjà sur user_id seul).
CREATE INDEX IF NOT EXISTS idx_winners_user_won_at      ON public.winners(user_id, won_at);
CREATE INDEX IF NOT EXISTS idx_winners_user_item_won_at ON public.winners(user_id, item_id, won_at);

-- Renvoie la RAISON de blocage pour le joueur courant sur ce produit, ou NULL si OK.
-- 'week' = plafond hebdo atteint ; 'item' = plafond annuel sur ce produit atteint.
-- SECURITY DEFINER (bypass RLS pour le COUNT) + auth.uid() interne -> un joueur ne
-- peut interroger QUE ses propres compteurs (pas de paramètre user_id spoofable).
CREATE OR REPLACE FUNCTION win_limit_block(p_item_id UUID)
RETURNS TEXT
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_week INTEGER;
  v_item INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL; -- non authentifié : géré en amont par l'action
  END IF;

  SELECT COUNT(*) INTO v_week
  FROM winners
  WHERE user_id = v_uid
    AND won_at > now() - interval '7 days';
  IF v_week >= 8 THEN
    RETURN 'week';
  END IF;

  IF p_item_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_item
    FROM winners
    WHERE user_id = v_uid
      AND item_id = p_item_id
      AND won_at > now() - interval '365 days';
    IF v_item >= 12 THEN
      RETURN 'item';
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION win_limit_block(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION win_limit_block(UUID) TO authenticated, service_role;
