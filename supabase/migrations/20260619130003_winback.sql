-- ============================================================================
-- Lot F (réactivation) #4 : win-back automatique. On suit la dernière activité
-- (last_active_at, maj 1×/jour via touch_last_active) et un flag win_back_sent_at
-- pour ne pas sur-relancer. Le cron crédite une offre DÉGRESSIVE selon l'inactivité
-- et notifie (push + email gaté opt-out). Idempotent.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS win_back_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active_at);

-- Marque l'activité du jour (au plus une écriture par jour Paris et par joueur).
CREATE OR REPLACE FUNCTION touch_last_active(p_user_id UUID)
RETURNS void AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN RETURN; END IF;
  UPDATE profiles SET last_active_at = now()
    WHERE id = p_user_id
      AND (last_active_at IS NULL OR last_active_at < (now() AT TIME ZONE 'Europe/Paris')::date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION touch_last_active(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION touch_last_active(uuid) TO authenticated;

-- Crédite l'offre de retour + pose le flag (appelé par le cron service_role).
CREATE OR REPLACE FUNCTION grant_winback(p_user_id UUID, p_credits INT)
RETURNS void AS $$
BEGIN
  UPDATE profiles
    SET earned_credits = earned_credits + GREATEST(0, p_credits),
        win_back_sent_at = now()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION grant_winback(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION grant_winback(uuid, integer) TO service_role;
