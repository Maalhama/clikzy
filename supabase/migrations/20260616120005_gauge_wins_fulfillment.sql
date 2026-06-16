-- ============================================================
-- FIX P0 (audit 2026-06-16) : un user qui complète une jauge (a payé 2× la valeur en
-- cash) reçoit un item « garanti », mais gauge_wins n'était JAMAIS lu → aucun flux de
-- livraison. On aligne gauge_wins sur le modèle buy_it_now_purchases (statut + tracking)
-- pour permettre le fulfillment admin. L'adresse de livraison vit dans profiles.shipping_*.
-- ============================================================
ALTER TABLE public.gauge_wins
  ADD COLUMN IF NOT EXISTS shipping_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_gauge_wins_status ON public.gauge_wins(shipping_status);
