-- ============================================================
-- GAMIFICATION — Succès cachés + XP sur les badges
-- Réutilise le système de badges existant (requirement_type clicks/wins/games/
-- referrals). is_hidden = masqué tant que non débloqué. claim_eligible_badges
-- octroie désormais aussi de l'XP (xp_reward).
-- ============================================================

-- XP de récompense sur les badges existants (selon rareté)
UPDATE badges SET xp_reward = CASE rarity
  WHEN 'common' THEN 50 WHEN 'rare' THEN 150 WHEN 'epic' THEN 400 WHEN 'legendary' THEN 1000 ELSE 50 END
WHERE xp_reward = 0;

-- Succès CACHÉS (seuils élevés, révélés une fois débloqués)
INSERT INTO badges (id, name, description, icon, category, requirement_type, requirement_value, rarity, credits_reward, is_hidden, xp_reward) VALUES
  ('hidden_clicks_5k','Forcené','5 000 clics au total','zap','clics','clicks',5000,'legendary',100,true,1500),
  ('hidden_wins_10','Collectionneur','Remporter 10 lots','trophy','victoires','wins',10,'legendary',150,true,2000),
  ('hidden_games_50','Vétéran','Participer à 50 tirages','target','parties','games',50,'epic',75,true,800),
  ('hidden_referrals_10','Ambassadeur','Parrainer 10 amis','users','social','referrals',10,'legendary',200,true,2500),
  ('hidden_clicks_10k','Légende du clic','10 000 clics au total','zap','clics','clicks',10000,'legendary',250,true,3000)
ON CONFLICT (id) DO NOTHING;

-- claim_eligible_badges : octroie crédits + XP (TEXT badge_id, search_path)
DROP FUNCTION IF EXISTS claim_eligible_badges();
CREATE OR REPLACE FUNCTION claim_eligible_badges()
RETURNS TABLE(badge_id TEXT, credits_reward INTEGER) AS $$
DECLARE
  v_user UUID := auth.uid();
  v_clicks INTEGER; v_wins INTEGER; v_referrals INTEGER; v_games INTEGER;
  v_total_credits INTEGER := 0; v_total_xp INTEGER := 0;
  b RECORD; v_stat INTEGER;
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  SELECT total_clicks, total_wins, referral_count INTO v_clicks, v_wins, v_referrals FROM profiles WHERE id = v_user;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT COUNT(DISTINCT game_id) INTO v_games FROM clicks WHERE user_id = v_user;

  FOR b IN
    SELECT bd.id, bd.requirement_type, bd.requirement_value, bd.credits_reward, bd.xp_reward
    FROM badges bd
    WHERE NOT EXISTS (SELECT 1 FROM user_badges ub WHERE ub.user_id = v_user AND ub.badge_id = bd.id)
  LOOP
    v_stat := CASE b.requirement_type
      WHEN 'clicks' THEN COALESCE(v_clicks,0) WHEN 'wins' THEN COALESCE(v_wins,0)
      WHEN 'games' THEN COALESCE(v_games,0) WHEN 'referrals' THEN COALESCE(v_referrals,0) ELSE 0 END;
    IF v_stat >= b.requirement_value THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (v_user, b.id) ON CONFLICT DO NOTHING;
      v_total_credits := v_total_credits + COALESCE(b.credits_reward, 0);
      v_total_xp := v_total_xp + COALESCE(b.xp_reward, 0);
      badge_id := b.id; credits_reward := COALESCE(b.credits_reward, 0);
      RETURN NEXT;
    END IF;
  END LOOP;

  IF v_total_credits > 0 OR v_total_xp > 0 THEN
    UPDATE profiles SET
      earned_credits = earned_credits + v_total_credits,
      xp = xp + v_total_xp,
      level = xp_to_level(xp + v_total_xp)
    WHERE id = v_user;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION claim_eligible_badges() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION claim_eligible_badges() TO authenticated, service_role;
