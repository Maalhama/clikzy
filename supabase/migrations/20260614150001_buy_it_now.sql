-- ============================================================
-- RACHAT MALIN (Buy It Now) — 2026-06-14
-- À la fin d'une enchère, un PERDANT qui a cliqué peut acheter l'objet à
-- prix réduit (retail − crédits dépensés × 0,10€), fenêtre 48h.
-- Profil « Équilibré » : CREDIT_VALUE = 0,10€ ; plancher = 40% du retail.
-- Aucune des valeurs ici n'augmente les chances de gagner une enchère.
-- ============================================================

CREATE TABLE IF NOT EXISTS buy_it_now_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  item_name TEXT NOT NULL,
  price_paid DECIMAL(10,2) NOT NULL,
  stripe_session TEXT,
  shipping_status TEXT NOT NULL DEFAULT 'pending',
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);
ALTER TABLE buy_it_now_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own buy-it-now readable" ON buy_it_now_purchases;
CREATE POLICY "Own buy-it-now readable" ON buy_it_now_purchases
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
-- aucune policy d'écriture : tout passe par record_buy_it_now (DEFINER, service_role)
CREATE INDEX IF NOT EXISTS idx_bin_user ON buy_it_now_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_bin_session ON buy_it_now_purchases(stripe_session);

-- ---------- Offres de rachat pour un joueur ----------
-- Enchères terminées (< 48h) où il a cliqué, n'a PAS gagné, et n'a pas déjà racheté.
CREATE OR REPLACE FUNCTION get_buy_it_now_offers(p_user_id UUID)
RETURNS TABLE(
  game_id UUID, item_id UUID, item_name TEXT, item_image TEXT,
  retail_value NUMERIC, credits_spent INTEGER, price NUMERIC, expires_at TIMESTAMPTZ
) AS $$
  SELECT
    g.id, i.id, i.name, i.image_url,
    i.retail_value,
    cs.spent::int,
    GREATEST(
      round((i.retail_value * 0.40)::numeric, 2),
      round((i.retail_value - cs.spent * 0.10)::numeric, 2)
    ) AS price,
    to_timestamp((g.end_time + 48 * 3600 * 1000) / 1000.0) AS expires_at
  FROM games g
  JOIN items i ON i.id = g.item_id
  JOIN LATERAL (
    SELECT COALESCE(SUM(c.credits_spent), 0) AS spent
    FROM clicks c WHERE c.game_id = g.id AND c.user_id = p_user_id
  ) cs ON true
  WHERE g.status = 'ended'
    AND g.end_time IS NOT NULL
    AND g.end_time > (extract(epoch FROM now()) * 1000) - 48 * 3600 * 1000
    AND g.winner_id IS DISTINCT FROM p_user_id
    AND cs.spent > 0
    AND i.retail_value IS NOT NULL AND i.retail_value > 0
    AND NOT EXISTS (
      SELECT 1 FROM buy_it_now_purchases b WHERE b.game_id = g.id AND b.user_id = p_user_id
    )
  ORDER BY g.end_time DESC;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION get_buy_it_now_offers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_buy_it_now_offers(uuid) TO authenticated, service_role;

-- ---------- Quote server-side (anti-tampering du prix au checkout) ----------
CREATE OR REPLACE FUNCTION quote_buy_it_now(p_user_id UUID, p_game_id UUID)
RETURNS TABLE(item_id UUID, item_name TEXT, price NUMERIC) AS $$
  SELECT o.item_id, o.item_name, o.price
  FROM get_buy_it_now_offers(p_user_id) o
  WHERE o.game_id = p_game_id
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION quote_buy_it_now(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION quote_buy_it_now(uuid, uuid) TO authenticated, service_role;

-- ---------- Enregistrement de l'achat (webhook, idempotent par session) ----------
CREATE OR REPLACE FUNCTION record_buy_it_now(
  p_user_id UUID, p_game_id UUID, p_price NUMERIC, p_session TEXT
) RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_rows INTEGER;
BEGIN
  IF p_session IS NOT NULL AND EXISTS (
    SELECT 1 FROM buy_it_now_purchases WHERE stripe_session = p_session
  ) THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  SELECT i.id AS item_id, i.name AS item_name
    INTO v_item
  FROM games g JOIN items i ON i.id = g.item_id WHERE g.id = p_game_id;
  IF v_item.item_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'game_not_found');
  END IF;

  INSERT INTO buy_it_now_purchases(user_id, game_id, item_id, item_name, price_paid, stripe_session)
  VALUES (p_user_id, p_game_id, v_item.item_id, v_item.item_name, p_price, p_session)
  ON CONFLICT (user_id, game_id) DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  RETURN jsonb_build_object('ok', true, 'recorded', v_rows > 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION record_buy_it_now(uuid, uuid, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_buy_it_now(uuid, uuid, numeric, text) TO service_role;
