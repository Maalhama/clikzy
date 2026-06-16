-- ============================================================
-- Feature JAUGE (gauge) — paiement progressif par user × MODÈLE d'item.
-- Chaque clic remplit la jauge perso ; quand elle atteint la cible
-- (= valeur de l'item × multiplicateur), l'user obtient l'item (lot de consolation).
--
-- ⚠️ EN EXPLORATION — NON validé juridiquement. Le multiplicateur (défaut 2) est le
-- LEVIER : ×2 = l'user paie le double de la valeur (PAS safe juridiquement) ; le passer
-- à 1 = plafond au prix réel (la version défendable). Le code app qui appelle
-- increment_item_gauge vit sur la branche feat/shop-redesign et N'EST PAS mergé sur
-- main → la prod ne déclenche jamais ces écritures (objets dormants côté prod).
--
-- Clé = (user_id, item_id) : item_id est réutilisé entre parties pour un même modèle
-- (create-rotation pioche dans items), donc la jauge persiste « sur l'iPhone 17 ».
-- ============================================================

-- 1) Progression de la jauge, par user et par modèle d'item
CREATE TABLE IF NOT EXISTS public.user_item_gauges (
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id         UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  progress        INTEGER NOT NULL DEFAULT 0,        -- crédits accumulés vers cet item
  target          INTEGER NOT NULL DEFAULT 0,        -- cible = valeur item × multiplicateur (resync à chaque clic)
  completed_count INTEGER NOT NULL DEFAULT 0,        -- nb d'items déjà obtenus via la jauge
  last_click_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

ALTER TABLE public.user_item_gauges ENABLE ROW LEVEL SECURITY;
-- L'user lit SA propre progression (affichage). Écriture = RPC SECURITY DEFINER only.
DROP POLICY IF EXISTS "gauge_owner_read" ON public.user_item_gauges;
CREATE POLICY "gauge_owner_read" ON public.user_item_gauges
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_user_item_gauges_stale ON public.user_item_gauges(last_click_at);

-- 2) Items obtenus via la jauge (à honorer / expédier)
CREATE TABLE IF NOT EXISTS public.gauge_wins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id      UUID NOT NULL REFERENCES public.items(id),
  paid_credits INTEGER NOT NULL,                     -- crédits payés (= target à l'obtention)
  won_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gauge_wins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gauge_wins_owner_read" ON public.gauge_wins;
CREATE POLICY "gauge_wins_owner_read" ON public.gauge_wins
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_gauge_wins_user ON public.gauge_wins(user_id);

-- 3) Incrément atomique de la jauge — RÉSERVÉ service_role.
--    Le serveur l'appelle APRÈS un perform_click réussi (1 clic = 1 crédit réellement
--    dépensé). Réservé service_role => un user ne peut PAS l'appeler en direct pour
--    gonfler sa jauge gratuitement. Complétion => gauge_win + report du surplus.
CREATE OR REPLACE FUNCTION public.increment_item_gauge(
  p_user_id UUID, p_item_id UUID, p_credits INTEGER DEFAULT 1
)
RETURNS TABLE(out_progress INTEGER, out_target INTEGER, out_completed BOOLEAN, out_completed_count INTEGER) AS $$
DECLARE
  v_multiplier NUMERIC := 2;    -- ⚠️ LEVIER JURIDIQUE : 2 = double la valeur ; 1 = plafond prix réel
  v_credits    INTEGER := COALESCE(NULLIF(p_credits, 0), 1);
  v_retail     NUMERIC;
  v_target     INTEGER;
  v_progress   INTEGER;
  v_completed  BOOLEAN := false;
  v_count      INTEGER;
BEGIN
  IF v_credits < 0 THEN v_credits := 1; END IF;

  SELECT retail_value INTO v_retail FROM public.items WHERE id = p_item_id;
  IF v_retail IS NULL THEN
    RETURN QUERY SELECT 0, 0, false, 0; RETURN;
  END IF;
  v_target := GREATEST(1, ROUND(v_retail * v_multiplier))::INTEGER;

  INSERT INTO public.user_item_gauges (user_id, item_id, progress, target, last_click_at, updated_at)
    VALUES (p_user_id, p_item_id, v_credits, v_target, now(), now())
  ON CONFLICT (user_id, item_id) DO UPDATE
    SET progress      = public.user_item_gauges.progress + EXCLUDED.progress,
        target        = v_target,
        last_click_at = now(),
        updated_at    = now()
  RETURNING public.user_item_gauges.progress, public.user_item_gauges.completed_count
    INTO v_progress, v_count;

  -- Jauge pleine : l'user obtient l'item, on remet la jauge au surplus éventuel
  IF v_progress >= v_target THEN
    v_completed := true;
    INSERT INTO public.gauge_wins (user_id, item_id, paid_credits)
      VALUES (p_user_id, p_item_id, v_target);
    UPDATE public.user_item_gauges
      SET progress         = public.user_item_gauges.progress - v_target,
          completed_count  = public.user_item_gauges.completed_count + 1,
          updated_at       = now()
      WHERE user_id = p_user_id AND item_id = p_item_id
      RETURNING public.user_item_gauges.progress, public.user_item_gauges.completed_count
        INTO v_progress, v_count;
  END IF;

  RETURN QUERY SELECT v_progress, v_target, v_completed, v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION public.increment_item_gauge(UUID, UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_item_gauge(UUID, UUID, INTEGER) TO service_role;
