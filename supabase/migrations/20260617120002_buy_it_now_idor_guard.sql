-- #310 — IDOR sur get_buy_it_now_offers / quote_buy_it_now.
--
-- Les deux fonctions sont SECURITY DEFINER, exposées à `authenticated`, et prennent
-- `p_user_id` SANS vérifier qu'il s'agit bien de l'appelant. Un joueur connecté pouvait
-- donc passer l'UUID d'un autre et lire ses offres « rachat malin » (parties cliquées,
-- crédits dépensés, prix personnalisé) = divulgation de comportement d'achat.
--
-- Correctif : garde self dans le WHERE (compatible LANGUAGE sql). Si auth.uid() est non
-- nul (vrai utilisateur), on exige p_user_id = auth.uid() ; si null (service_role, webhook),
-- on laisse passer. quote_buy_it_now délègue à get_buy_it_now_offers → couverte par transitivité.

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
    -- Anti-IDOR : un client ne lit que SES offres ; service_role (auth.uid() NULL) passe.
    AND ((SELECT auth.uid()) IS NULL OR p_user_id = (SELECT auth.uid()))
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
