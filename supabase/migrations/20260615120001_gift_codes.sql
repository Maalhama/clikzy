-- ============================================================================
-- GIFTING : offrir des crédits ou le VIP à un ami via un code cadeau
-- ----------------------------------------------------------------------------
-- L'acheteur paie (Stripe, one-shot) -> un code est généré (idempotent par
-- session). Le destinataire le réclame -> crédits permanents (earned_credits)
-- ou jours de VIP. Réclamation atomique, anti-double, non-réclamable par soi-même.
-- Écritures réservées au service_role / RPC DEFINER (RLS default-deny).
-- ============================================================================

CREATE TABLE IF NOT EXISTS gift_codes (
  code             TEXT PRIMARY KEY,
  gifter_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  gifter_username  TEXT,
  kind             TEXT NOT NULL CHECK (kind IN ('credits', 'vip')),
  credits          INTEGER NOT NULL DEFAULT 0,
  vip_days         INTEGER NOT NULL DEFAULT 0,
  pack_id          TEXT,
  amount_paid      INTEGER NOT NULL DEFAULT 0,           -- centimes (archive)
  stripe_session   TEXT UNIQUE,                          -- idempotence
  redeemed_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  redeemed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days')
);

CREATE INDEX IF NOT EXISTS idx_gift_codes_gifter ON gift_codes(gifter_id);
CREATE INDEX IF NOT EXISTS idx_gift_codes_redeemer ON gift_codes(redeemed_by);

ALTER TABLE gift_codes ENABLE ROW LEVEL SECURITY;
-- Aucune policy => default-deny pour authenticated/anon. Tout passe par les RPC
-- DEFINER ci-dessous (lecture sûre + réclamation) et le service_role (création).

-- ---------- Lecture publique SÛRE d'un code (détails non-PII) ----------
-- Sert la page de réclamation (afficher « X crédits offerts par Y », statut).
CREATE OR REPLACE FUNCTION get_gift_code(p_code TEXT)
RETURNS JSONB AS $$
DECLARE g gift_codes%ROWTYPE;
BEGIN
  SELECT * INTO g FROM gift_codes WHERE code = upper(trim(p_code));
  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  RETURN jsonb_build_object(
    'found', true,
    'kind', g.kind,
    'credits', g.credits,
    'vip_days', g.vip_days,
    'gifter_username', g.gifter_username,
    'redeemed', g.redeemed_by IS NOT NULL,
    'expired', g.expires_at < now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- ---------- Réclamation atomique d'un code ----------
CREATE OR REPLACE FUNCTION redeem_gift_code(p_code TEXT, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE g gift_codes%ROWTYPE;
BEGIN
  -- Anti-IDOR : un client ne peut réclamer que pour lui-même.
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO g FROM gift_codes WHERE code = upper(trim(p_code)) FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid'); END IF;
  IF g.redeemed_by IS NOT NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'already_redeemed'); END IF;
  IF g.expires_at < now() THEN RETURN jsonb_build_object('ok', false, 'error', 'expired'); END IF;
  IF g.gifter_id IS NOT NULL AND g.gifter_id = p_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'own_gift');
  END IF;

  UPDATE gift_codes SET redeemed_by = p_user_id, redeemed_at = now() WHERE code = g.code;

  IF g.kind = 'credits' THEN
    UPDATE profiles SET earned_credits = earned_credits + g.credits WHERE id = p_user_id;
    RETURN jsonb_build_object('ok', true, 'kind', 'credits', 'credits', g.credits);
  ELSE
    -- VIP offert : pass non-récurrent, prolonge vip_expires_at (sans subscription_id).
    UPDATE profiles
       SET is_vip = true,
           vip_expires_at = GREATEST(COALESCE(vip_expires_at, now()), now()) + make_interval(days => g.vip_days)
     WHERE id = p_user_id;
    RETURN jsonb_build_object('ok', true, 'kind', 'vip', 'vip_days', g.vip_days);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

REVOKE ALL ON FUNCTION get_gift_code(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION redeem_gift_code(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_gift_code(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION redeem_gift_code(TEXT, UUID) TO authenticated;
