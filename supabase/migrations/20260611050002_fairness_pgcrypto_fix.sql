-- Fix : pgcrypto (gen_random_bytes, digest) vit dans le schéma `extensions`
-- sur Supabase. On préfixe explicitement pour qu'il soit résolu en DEFINER.

CREATE OR REPLACE FUNCTION ensure_fairness(p_user UUID) RETURNS void AS $$
DECLARE v_seed TEXT;
BEGIN
  IF (SELECT fair_server_seed FROM profiles WHERE id = p_user) IS NULL THEN
    v_seed := encode(extensions.gen_random_bytes(32), 'hex');
    UPDATE profiles SET
      fair_server_seed = v_seed,
      fair_server_seed_hash = encode(extensions.digest(v_seed, 'sha256'), 'hex'),
      fair_client_seed = COALESCE(fair_client_seed, encode(extensions.gen_random_bytes(8), 'hex')),
      fair_nonce = 0
    WHERE id = p_user;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, extensions;

CREATE OR REPLACE FUNCTION rotate_fairness(p_client_seed TEXT)
RETURNS TABLE(old_server_seed TEXT, old_hash TEXT, new_hash TEXT) AS $$
DECLARE
  v_user UUID := auth.uid();
  v_old_seed TEXT; v_old_hash TEXT; v_new_seed TEXT; v_new_hash TEXT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM ensure_fairness(v_user);
  SELECT fair_server_seed, fair_server_seed_hash INTO v_old_seed, v_old_hash FROM profiles WHERE id = v_user;
  v_new_seed := encode(extensions.gen_random_bytes(32), 'hex');
  v_new_hash := encode(extensions.digest(v_new_seed, 'sha256'), 'hex');
  UPDATE profiles SET
    fair_server_seed = v_new_seed,
    fair_server_seed_hash = v_new_hash,
    fair_client_seed = COALESCE(NULLIF(trim(p_client_seed), ''), fair_client_seed),
    fair_nonce = 0
  WHERE id = v_user;
  RETURN QUERY SELECT v_old_seed, v_old_hash, v_new_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, extensions;
REVOKE EXECUTE ON FUNCTION rotate_fairness(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rotate_fairness(text) TO authenticated;
