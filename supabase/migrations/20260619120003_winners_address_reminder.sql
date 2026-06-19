-- ============================================================================
-- Audit 2026-06-19 (#6) : relance des gagnants qui n'ont pas renseigné leur adresse.
-- Flag anti-spam : le cron shipping-reminder ne relance qu'une fois (pose la date
-- après envoi du push+email). Idempotent.
-- ============================================================================

ALTER TABLE public.winners
  ADD COLUMN IF NOT EXISTS address_reminder_sent_at TIMESTAMPTZ;
