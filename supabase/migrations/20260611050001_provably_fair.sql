-- ============================================================
-- PROVABLY-FAIR (mini-jeux) — commit-reveal façon casino crypto.
-- Le serveur s'engage sur un hash de server_seed AVANT de jouer ; le joueur
-- ne voit le server_seed qu'à la rotation (révélation), et peut alors
-- recalculer chaque résultat = HMAC(server_seed, client_seed:nonce:cursor).
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fair_server_seed TEXT;       -- SECRET (jamais exposé avant rotation)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fair_server_seed_hash TEXT;  -- commit public
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fair_client_seed TEXT;       -- modifiable par le joueur
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fair_nonce INTEGER NOT NULL DEFAULT 0;

-- Le joueur lit le HASH + client_seed + nonce ; surtout PAS le server_seed.
GRANT SELECT (fair_server_seed_hash, fair_client_seed, fair_nonce) ON public.profiles TO authenticated;

-- Initialise l'état d'équité si absent
CREATE OR REPLACE FUNCTION ensure_fairness(p_user UUID) RETURNS void AS $$
DECLARE v_seed TEXT;
BEGIN
  IF (SELECT fair_server_seed FROM profiles WHERE id = p_user) IS NULL THEN
    v_seed := encode(gen_random_bytes(32), 'hex');
    UPDATE profiles SET
      fair_server_seed = v_seed,
      fair_server_seed_hash = encode(digest(v_seed, 'sha256'), 'hex'),
      fair_client_seed = COALESCE(fair_client_seed, encode(gen_random_bytes(8), 'hex')),
      fair_nonce = 0
    WHERE id = p_user;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- Consomme l'état pour UNE partie : renvoie les seeds + nonce courant puis
-- incrémente le nonce. RÉSERVÉ au service_role : le client ne doit jamais
-- obtenir le server_seed avant rotation (sinon il prédit le résultat).
CREATE OR REPLACE FUNCTION consume_fairness(p_user UUID)
RETURNS TABLE(server_seed TEXT, client_seed TEXT, nonce INTEGER) AS $$
BEGIN
  PERFORM ensure_fairness(p_user);
  RETURN QUERY
  UPDATE profiles SET fair_nonce = fair_nonce + 1
  WHERE id = p_user
  RETURNING fair_server_seed, fair_client_seed, fair_nonce - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION consume_fairness(uuid) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION consume_fairness(uuid) TO service_role;

-- Rotation : révèle l'ancien server_seed (vérifiable contre l'ancien hash),
-- en génère un nouveau (nouveau commit), reset le nonce, set le client_seed.
CREATE OR REPLACE FUNCTION rotate_fairness(p_client_seed TEXT)
RETURNS TABLE(old_server_seed TEXT, old_hash TEXT, new_hash TEXT) AS $$
DECLARE
  v_user UUID := auth.uid();
  v_old_seed TEXT;
  v_old_hash TEXT;
  v_new_seed TEXT;
  v_new_hash TEXT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM ensure_fairness(v_user);
  SELECT fair_server_seed, fair_server_seed_hash INTO v_old_seed, v_old_hash FROM profiles WHERE id = v_user;
  v_new_seed := encode(gen_random_bytes(32), 'hex');
  v_new_hash := encode(digest(v_new_seed, 'sha256'), 'hex');
  UPDATE profiles SET
    fair_server_seed = v_new_seed,
    fair_server_seed_hash = v_new_hash,
    fair_client_seed = COALESCE(NULLIF(trim(p_client_seed), ''), fair_client_seed),
    fair_nonce = 0
  WHERE id = v_user;
  RETURN QUERY SELECT v_old_seed, v_old_hash, v_new_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION rotate_fairness(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rotate_fairness(text) TO authenticated;

-- Historique vérifiable : on garde le nonce de chaque partie
ALTER TABLE mini_game_plays ADD COLUMN IF NOT EXISTS fair_nonce INTEGER;
