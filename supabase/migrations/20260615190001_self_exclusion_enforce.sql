-- ============================================================================
-- Jeu responsable : enforcement DB de l'auto-exclusion sur le CLIC.
-- La Server Action clickGame vérifie déjà la pause (message propre), mais la RPC
-- perform_click (GRANT authenticated) est appelable directement. Ce trigger
-- BEFORE INSERT sur `clicks` bloque tout clic d'un joueur RÉEL auto-exclu, quel
-- que soit le chemin -> barrière non-contournable. Les bots (user_id NULL,
-- is_bot=true) court-circuitent (aucune sous-requête pour eux).
-- ============================================================================

CREATE OR REPLACE FUNCTION block_self_excluded_clicks() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND COALESCE(NEW.is_bot, false) = false
     AND EXISTS (
       SELECT 1 FROM user_self_exclusion
       WHERE user_id = NEW.user_id AND excluded_until > now()
     ) THEN
    RAISE EXCEPTION 'self_excluded';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

DROP TRIGGER IF EXISTS trg_block_self_excluded ON clicks;
CREATE TRIGGER trg_block_self_excluded
  BEFORE INSERT ON clicks
  FOR EACH ROW EXECUTE FUNCTION block_self_excluded_clicks();
