-- ============================================================
-- C3 (correctif) — le trigger doit être SECURITY INVOKER, pas DEFINER
-- ------------------------------------------------------------
-- Bug : protect_profile_sensitive_columns() était SECURITY DEFINER. Dans une
-- fonction TRIGGER en DEFINER, current_user = le PROPRIÉTAIRE de la fonction
-- (postgres), jamais le rôle qui exécute l'UPDATE. La condition
-- `current_user NOT IN ('authenticated','anon')` était donc TOUJOURS vraie =>
-- aucune écriture n'était bloquée (test E2E : credits/is_admin/earned_credits
-- passaient depuis un client authentifié).
--
-- Correctif : SECURITY INVOKER (défaut). Le trigger voit alors le rôle effectif :
--   - client PostgREST direct      -> current_user = 'authenticated' (BLOQUÉ)
--   - à l'intérieur d'une RPC DEFINER (perform_click, deduct_credits, badges...)
--     -> current_user = 'postgres'  (AUTORISÉ)
--   - cron service_role            -> current_user = 'service_role' (AUTORISÉ)
-- ============================================================

CREATE OR REPLACE FUNCTION protect_profile_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF NEW.is_admin                IS DISTINCT FROM OLD.is_admin
     OR NEW.credits              IS DISTINCT FROM OLD.credits
     OR NEW.earned_credits       IS DISTINCT FROM OLD.earned_credits
     OR NEW.total_wins           IS DISTINCT FROM OLD.total_wins
     OR NEW.total_clicks         IS DISTINCT FROM OLD.total_clicks
     OR NEW.has_purchased_credits IS DISTINCT FROM OLD.has_purchased_credits
     OR NEW.is_vip               IS DISTINCT FROM OLD.is_vip
     OR NEW.vip_expires_at       IS DISTINCT FROM OLD.vip_expires_at
     OR NEW.referral_count       IS DISTINCT FROM OLD.referral_count
     OR NEW.referral_credits_earned IS DISTINCT FROM OLD.referral_credits_earned
     OR NEW.referred_by          IS DISTINCT FROM OLD.referred_by
     OR NEW.referral_code        IS DISTINCT FROM OLD.referral_code
     OR NEW.last_credits_reset   IS DISTINCT FROM OLD.last_credits_reset
     OR NEW.last_vip_bonus_at    IS DISTINCT FROM OLD.last_vip_bonus_at
  THEN
    RAISE EXCEPTION 'Modification non autorisée de colonnes protégées du profil';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
