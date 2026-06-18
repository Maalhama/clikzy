-- ============================================================================
-- Durcissement issu de l'audit maître 2026-06-18 (docs/AUDIT-2026-06-18.md)
-- ----------------------------------------------------------------------------
--   P0-4  Forge de clics : REVOKE INSERT ON clicks (tous les clics légitimes
--         passent par perform_click / cron service_role — vérifié : aucun INSERT
--         direct authenticated dans le code app).
--   P0-5  Clawback : geler les gauge_wins physiques non expédiés au remboursement
--         d'un pack (item gratuit + argent rendu sinon).
--   P0-6  Clawback : annuler un achat « Rachat malin » (buy-it-now) au remboursement.
--   P1    Clawback : annuler une Passe d'Arène remboursée (stoppe les futurs claims).
--   P1    Cadeau VIP remboursé : reprendre réellement les jours VIP (au lieu du manuel).
--   P1    Défense en profondeur DB : CHECK >= 0 sur les colonnes monétaires (NOT VALID
--         pour ne PAS échouer à l'application sur d'éventuelles lignes héritées).
--   P3    get_gift_code expose l'état `voided` (cohérence d'affichage).
-- Idempotent / rejouable. Toutes les RPC sont DEFINER service_role-only.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- P0-4 — Forge de clics : retirer le privilège d'INSERT direct sur `clicks`.
-- perform_click (DEFINER) et le cron bot-clicks (service_role) ne sont pas
-- affectés (ils tournent avec les droits du propriétaire / service_role).
-- ---------------------------------------------------------------------------
REVOKE INSERT ON public.clicks FROM authenticated, anon;
DROP POLICY IF EXISTS "Authenticated users can insert own clicks" ON public.clicks;
DROP POLICY IF EXISTS "Authenticated users can insert clicks" ON public.clicks;

-- ---------------------------------------------------------------------------
-- P0-6 — Clawback d'un achat « Rachat malin » (buy-it-now) par sa session Stripe.
-- Renvoie not_a_bin si la session n'est pas un buy-it-now (le webhook enchaîne).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clawback_buy_it_now(p_session text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id     uuid;
  v_user   uuid;
  v_status text;
BEGIN
  SELECT id, user_id, shipping_status
    INTO v_id, v_user, v_status
  FROM public.buy_it_now_purchases
  WHERE stripe_session = p_session
  FOR UPDATE;

  IF v_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_a_bin');
  END IF;
  -- Déjà annulé : idempotent.
  IF v_status IN ('cancelled', 'clawed_back') THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;
  -- Déjà expédié : on ne peut pas reprendre l'objet -> revue manuelle.
  IF v_status IN ('shipped', 'delivered') THEN
    RETURN jsonb_build_object('ok', true, 'manual', true, 'reason', 'already_shipped', 'user_id', v_user);
  END IF;

  UPDATE public.buy_it_now_purchases
     SET shipping_status = 'clawed_back'
   WHERE id = v_id;

  RETURN jsonb_build_object('ok', true, 'cancelled', true, 'user_id', v_user);
END;
$$;
REVOKE ALL ON FUNCTION public.clawback_buy_it_now(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clawback_buy_it_now(text) TO service_role;

-- ---------------------------------------------------------------------------
-- P1 — Clawback d'une Passe d'Arène (battle pass) par sa session Stripe.
-- Supprime la passe (stoppe tout futur claim via get_pass_state) et purge les
-- claims de paliers du mois. Les récompenses déjà créditées (artefacts/crédits)
-- ne sont pas rétro-reprises ici -> alerte admin pour arbitrage.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clawback_battle_pass(p_session text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user   uuid;
  v_month  date;
  v_claims integer;
BEGIN
  SELECT user_id, month
    INTO v_user, v_month
  FROM public.battle_passes
  WHERE stripe_session = p_session
  FOR UPDATE;

  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_a_pass');
  END IF;

  SELECT count(*) INTO v_claims
  FROM public.pass_tier_claims
  WHERE user_id = v_user AND month = v_month;

  DELETE FROM public.pass_tier_claims WHERE user_id = v_user AND month = v_month;
  DELETE FROM public.battle_passes    WHERE stripe_session = p_session;

  RETURN jsonb_build_object(
    'ok', true, 'revoked', true, 'user_id', v_user,
    'month', v_month, 'tiers_claimed', coalesce(v_claims, 0),
    'manual', coalesce(v_claims, 0) > 0  -- récompenses déjà claim -> arbitrage admin
  );
END;
$$;
REVOKE ALL ON FUNCTION public.clawback_battle_pass(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clawback_battle_pass(text) TO service_role;

-- ---------------------------------------------------------------------------
-- P0-5 — clawback_pack_credits : en plus de la reprise earned_credits + cost-basis,
-- GELER les gauge_wins physiques non expédiés du joueur (item « payé 2× »). Faute
-- d'attribution session->win précise, on met en attente (clawback_hold) tous les
-- gains de jauge non encore expédiés -> sortis de la file d'expédition, arbitrage
-- admin. Idempotent (ne s'exécute qu'au 1er clawback de la session, via clawed_back_at).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clawback_pack_credits(p_session text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user        uuid;
  v_amount      integer;
  v_cash        bigint;
  v_already     timestamptz;
  v_gauge_held  integer := 0;
BEGIN
  SELECT user_id, credits_granted, amount_cents, clawed_back_at
    INTO v_user, v_amount, v_cash, v_already
  FROM public.credit_grant_sessions
  WHERE stripe_session = p_session
  FOR UPDATE;

  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'session_not_found');
  END IF;
  IF v_already IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'amount', 0, 'cash_cents', 0);
  END IF;

  UPDATE public.profiles
     SET earned_credits        = greatest(0, earned_credits - greatest(coalesce(v_amount, 0), 0)),
         purchased_value_cents = greatest(0, purchased_value_cents - greatest(coalesce(v_cash, 0), 0))
   WHERE id = v_user;

  -- Gel des lots de jauge physiques non expédiés (l'item est financé par le cash
  -- désormais remboursé). On retire de la file 'pending' -> 'clawback_hold'.
  UPDATE public.gauge_wins
     SET shipping_status = 'clawback_hold'
   WHERE user_id = v_user AND shipping_status = 'pending';
  GET DIAGNOSTICS v_gauge_held = ROW_COUNT;

  UPDATE public.credit_grant_sessions
     SET clawed_back_at = now()
   WHERE stripe_session = p_session;

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', v_user,
    'amount', greatest(coalesce(v_amount, 0), 0),
    'cash_cents', greatest(coalesce(v_cash, 0), 0),
    'gauge_wins_held', coalesce(v_gauge_held, 0)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.clawback_pack_credits(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clawback_pack_credits(text) TO service_role;

-- ---------------------------------------------------------------------------
-- P1 — Cadeau VIP déjà réclamé puis remboursé : reprendre RÉELLEMENT les jours VIP
-- (au lieu de tout déléguer au manuel). On réduit vip_expires_at du destinataire de
-- g.vip_days (borné à now()) et on repasse is_vip=false si l'expiration retombe dans
-- le passé. Le reste (code non réclamé, cadeau crédits) est inchangé.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clawback_gift_code(p_session text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  g           public.gift_codes%rowtype;
  v_new_exp   timestamptz;
BEGIN
  SELECT * INTO g FROM public.gift_codes WHERE stripe_session = p_session FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_a_gift');
  END IF;
  IF g.clawed_back_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  -- Code jamais réclamé -> on l'invalide simplement.
  IF g.redeemed_by IS NULL THEN
    UPDATE public.gift_codes
       SET voided_at = now(), clawed_back_at = now()
     WHERE code = g.code;
    RETURN jsonb_build_object('ok', true, 'voided', true, 'code', g.code);
  END IF;

  -- Déjà réclamé : crédits -> reprise chez le destinataire (borné 0).
  IF g.kind = 'credits' THEN
    UPDATE public.profiles
       SET earned_credits = greatest(0, earned_credits - greatest(coalesce(g.credits, 0), 0))
     WHERE id = g.redeemed_by;
    UPDATE public.gift_codes SET clawed_back_at = now() WHERE code = g.code;
    RETURN jsonb_build_object('ok', true, 'clawed_credits', greatest(coalesce(g.credits, 0), 0), 'redeemer', g.redeemed_by);
  END IF;

  -- Déjà réclamé : VIP -> on retranche les jours offerts (borné à now()).
  UPDATE public.profiles
     SET vip_expires_at = greatest(now(), coalesce(vip_expires_at, now()) - make_interval(days => coalesce(g.vip_days, 0))),
         is_vip = CASE
                    WHEN greatest(now(), coalesce(vip_expires_at, now()) - make_interval(days => coalesce(g.vip_days, 0))) <= now()
                         AND vip_subscription_id IS NULL
                    THEN false ELSE is_vip
                  END
   WHERE id = g.redeemed_by
   RETURNING vip_expires_at INTO v_new_exp;

  UPDATE public.gift_codes SET clawed_back_at = now() WHERE code = g.code;
  RETURN jsonb_build_object('ok', true, 'vip_clawed', true, 'redeemer', g.redeemed_by,
                            'vip_days', g.vip_days, 'new_expires_at', v_new_exp);
END;
$$;
REVOKE ALL ON FUNCTION public.clawback_gift_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clawback_gift_code(text) TO service_role;

-- ---------------------------------------------------------------------------
-- P3 — get_gift_code expose l'état `voided` (un code invalidé par clawback ne doit
-- plus s'afficher comme réclamable). Signature/forme inchangées par ailleurs.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_gift_code(p_code TEXT)
RETURNS JSONB AS $$
DECLARE g public.gift_codes%ROWTYPE;
BEGIN
  SELECT * INTO g FROM public.gift_codes WHERE code = upper(trim(p_code));
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
    'expired', g.expires_at < now(),
    'voided', g.voided_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE ALL ON FUNCTION public.get_gift_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_gift_code(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- P1 — Défense en profondeur : interdire les soldes/compteurs monétaires négatifs.
-- NOT VALID : la contrainte s'applique aux écritures FUTURES sans valider les lignes
-- existantes (apply sans risque même si des données héritées étaient hors borne).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_credits_nonneg') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_credits_nonneg CHECK (credits >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_earned_nonneg') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_earned_nonneg CHECK (earned_credits >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_purchased_value_nonneg') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_purchased_value_nonneg CHECK (purchased_value_cents >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_item_gauges_progress_nonneg') THEN
    ALTER TABLE public.user_item_gauges ADD CONSTRAINT chk_item_gauges_progress_nonneg CHECK (progress >= 0) NOT VALID;
  END IF;
END $$;
