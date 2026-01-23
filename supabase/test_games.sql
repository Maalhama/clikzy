-- 2 jeux de test pour tester l'intégration Stripe
-- Exécuter dans Supabase SQL Editor

-- Créer les items de test (ignore si déjà existants)
INSERT INTO items (id, name, description, image_url, retail_value, is_active) VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'MacBook Pro M3 14"',
    'Le laptop pro ultime avec puce M3 Pro',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
    2499,
    true
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'DJI Mavic 3 Pro',
    'Drone professionnel avec caméra Hasselblad triple',
    'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=800&fit=crop',
    2199,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Supprimer les anciens jeux de test si existants
DELETE FROM games WHERE id IN (
  'eeee0001-eeee-eeee-eeee-eeeeeeeeeeee',
  'ffff0001-ffff-ffff-ffff-ffffffffffff'
);

-- Créer 2 jeux de test actifs
-- Game 1: MacBook Pro - actif, 45 minutes restantes
INSERT INTO games (id, item_id, status, start_time, end_time, initial_duration, final_phase_duration, total_clicks) VALUES
  (
    'eeee0001-eeee-eeee-eeee-eeeeeeeeeeee',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'active',
    NOW() - INTERVAL '15 minutes',
    (EXTRACT(EPOCH FROM NOW()) * 1000 + 45 * 60 * 1000)::BIGINT,
    3600000,
    60000,
    12
  );

-- Game 2: DJI Drone - phase finale, 30 secondes restantes (pour tester l'urgence)
INSERT INTO games (id, item_id, status, start_time, end_time, initial_duration, final_phase_duration, total_clicks, battle_start_time) VALUES
  (
    'ffff0001-ffff-ffff-ffff-ffffffffffff',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'final_phase',
    NOW() - INTERVAL '59 minutes',
    (EXTRACT(EPOCH FROM NOW()) * 1000 + 30 * 1000)::BIGINT,
    3600000,
    60000,
    89,
    NOW() - INTERVAL '1 minute'
  );

-- Vérifier les jeux créés
SELECT
  g.id,
  i.name,
  g.status,
  g.total_clicks,
  TO_TIMESTAMP(g.end_time / 1000) as end_time_readable,
  ROUND((g.end_time - EXTRACT(EPOCH FROM NOW()) * 1000) / 1000) as seconds_remaining
FROM games g
JOIN items i ON g.item_id = i.id
WHERE g.id IN (
  'eeee0001-eeee-eeee-eeee-eeeeeeeeeeee',
  'ffff0001-ffff-ffff-ffff-ffffffffffff'
);
