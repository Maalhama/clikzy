-- ============================================================================
-- Audit 2026-06-19 (P1 RGPD) : la FK profiles.referred_by -> profiles(referral_code)
-- a ete creee SANS clause ON DELETE (migration 20260123000004:5). Quand un PARRAIN
-- supprime son compte (deleteMyAccount -> auth.admin.deleteUser -> cascade profiles),
-- la suppression de sa ligne profiles est REFUSEE car des filleuls pointent encore
-- vers son referral_code => droit a l'effacement (art. 17 RGPD) bloque.
--
-- Correctif : ON DELETE SET NULL. Supprimer un parrain met simplement filleul.referred_by
-- a NULL (le filleul garde son propre referral_count, jamais reset cf. CLAUDE.md).
-- Idempotent / rejouable. Aucune perte de donnees (referred_by est juste un pointeur).
-- ============================================================================

DO $$
DECLARE
  v_constraint text;
BEGIN
  -- Retrouve la FK existante sur la colonne referred_by, quel que soit son nom.
  SELECT con.conname INTO v_constraint
  FROM pg_constraint con
  JOIN pg_attribute att
    ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
  WHERE con.conrelid = 'public.profiles'::regclass
    AND con.contype = 'f'
    AND att.attname = 'referred_by'
  LIMIT 1;

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_referred_by_fkey
  FOREIGN KEY (referred_by)
  REFERENCES public.profiles(referral_code)
  ON DELETE SET NULL;
