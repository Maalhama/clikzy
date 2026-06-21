-- ============================================================================
-- Lot G (confiance) : garantie « 1er pack » (DealDash, conversion n°1) en
-- CRÉDIT-BACK (pas de remboursement cash → reste dans l'éco crédits, zéro
-- money-path réel, risque légal minimal). Promesse : « ton premier pack est
-- garanti ». Si le joueur n'a JAMAIS gagné, il peut récupérer une fois
-- l'équivalent en crédits de son 1er pack, dans les 60 jours suivant l'achat.
--
-- Défauts (ajustables — cf. mémoire cleekzy-market-features) :
--   - éligible si total_wins = 0 (jamais gagné),
--   - 1er achat de pack daté de <= 60 jours,
--   - a réellement joué (total_clicks > 0) — anti-abus « achète puis réclame »,
--   - 1×/compte (first_pack_guarantee_claimed_at).
-- Crédit-back = montant de crédits du 1er pack (pack_purchases.credits_granted),
-- ajouté aux earned_credits (permanents).
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_pack_guarantee_claimed_at TIMESTAMPTZ;

-- Statut pour l'UI (lecture seule). Renvoie une seule ligne.
-- reason : 'ok' (éligible) | 'claimed' | 'no_purchase' | 'not_played' | 'has_won' | 'expired'
CREATE OR REPLACE FUNCTION first_pack_guarantee_status()
RETURNS TABLE(eligible BOOLEAN, claimed BOOLEAN, amount INTEGER, reason TEXT, deadline TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  v_uid     UUID := auth.uid();
  v_prof    profiles%ROWTYPE;
  v_first   pack_purchases%ROWTYPE;
  v_deadline TIMESTAMPTZ;
BEGIN
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, false, 0, 'no_purchase'::TEXT, NULL::TIMESTAMPTZ; RETURN;
  END IF;

  SELECT * INTO v_prof FROM profiles WHERE id = v_uid;
  IF v_prof.first_pack_guarantee_claimed_at IS NOT NULL THEN
    RETURN QUERY SELECT false, true, 0, 'claimed'::TEXT, NULL::TIMESTAMPTZ; RETURN;
  END IF;

  SELECT * INTO v_first FROM pack_purchases
    WHERE user_id = v_uid ORDER BY created_at ASC LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 0, 'no_purchase'::TEXT, NULL::TIMESTAMPTZ; RETURN;
  END IF;

  v_deadline := v_first.created_at + interval '60 days';

  IF COALESCE(v_prof.total_clicks, 0) <= 0 THEN
    RETURN QUERY SELECT false, false, v_first.credits_granted, 'not_played'::TEXT, v_deadline; RETURN;
  END IF;
  IF COALESCE(v_prof.total_wins, 0) > 0 THEN
    RETURN QUERY SELECT false, false, v_first.credits_granted, 'has_won'::TEXT, v_deadline; RETURN;
  END IF;
  IF now() > v_deadline THEN
    RETURN QUERY SELECT false, false, v_first.credits_granted, 'expired'::TEXT, v_deadline; RETURN;
  END IF;

  RETURN QUERY SELECT true, false, v_first.credits_granted, 'ok'::TEXT, v_deadline;
END;
$$;

-- Réclamation idempotente (verrou ligne profil). Renvoie ok + raison + crédité.
CREATE OR REPLACE FUNCTION claim_first_pack_guarantee()
RETURNS TABLE(ok BOOLEAN, reason TEXT, credited INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_prof  profiles%ROWTYPE;
  v_first pack_purchases%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, 'unauthenticated'::TEXT, 0; RETURN;
  END IF;

  SELECT * INTO v_prof FROM profiles WHERE id = v_uid FOR UPDATE;
  IF v_prof.first_pack_guarantee_claimed_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 'already_claimed'::TEXT, 0; RETURN;
  END IF;

  SELECT * INTO v_first FROM pack_purchases
    WHERE user_id = v_uid ORDER BY created_at ASC LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'no_purchase'::TEXT, 0; RETURN;
  END IF;
  IF COALESCE(v_prof.total_clicks, 0) <= 0 THEN
    RETURN QUERY SELECT false, 'not_played'::TEXT, 0; RETURN;
  END IF;
  IF COALESCE(v_prof.total_wins, 0) > 0 THEN
    RETURN QUERY SELECT false, 'has_won'::TEXT, 0; RETURN;
  END IF;
  IF now() > v_first.created_at + interval '60 days' THEN
    RETURN QUERY SELECT false, 'expired'::TEXT, 0; RETURN;
  END IF;
  IF COALESCE(v_first.credits_granted, 0) <= 0 THEN
    RETURN QUERY SELECT false, 'no_credits'::TEXT, 0; RETURN;
  END IF;

  UPDATE profiles
    SET earned_credits = COALESCE(earned_credits, 0) + v_first.credits_granted,
        first_pack_guarantee_claimed_at = now()
    WHERE id = v_uid;

  RETURN QUERY SELECT true, 'ok'::TEXT, v_first.credits_granted;
END;
$$;

REVOKE ALL ON FUNCTION first_pack_guarantee_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION claim_first_pack_guarantee() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION first_pack_guarantee_status() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION claim_first_pack_guarantee() TO authenticated, service_role;
