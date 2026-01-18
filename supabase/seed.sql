-- Seed data for CLIKZY development
-- Run this in Supabase SQL Editor after the migration

-- Insert test items
INSERT INTO items (id, name, description, image_url, retail_value, is_active) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'iPhone 15 Pro Max',
    'Le dernier smartphone Apple avec puce A17 Pro et titanium design',
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-max-black-titanium-select?wid=800&hei=800',
    1479,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'PlayStation 5',
    'Console de jeu nouvelle génération avec SSD ultra-rapide',
    'https://gmedia.playstation.com/is/image/SIEPDC/ps5-product-thumbnail-01-en-14sep21?$1600px$',
    549,
    true
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'AirPods Pro 2',
    'Écouteurs sans fil avec réduction de bruit active et audio spatial',
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/MQD83?wid=800&hei=800',
    279,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Nintendo Switch OLED',
    'Console hybride avec écran OLED 7 pouces',
    'https://assets.nintendo.com/image/upload/c_fill,w_800/q_auto:best/f_auto/dpr_2.0/ncom/en_US/switch/site-design-update/hardware/switch-oled/nintendo-switch-oled-model-white-set',
    349,
    true
  );

-- Create active games for testing
-- Game 1: iPhone - starts now, ends in 24h
INSERT INTO games (id, item_id, status, start_time, end_time, initial_duration, final_phase_duration, total_clicks) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'active',
    NOW(),
    NOW() + INTERVAL '24 hours',
    86400000,
    60000,
    0
  );

-- Game 2: PS5 - starts now, ends in 12h (more urgent)
INSERT INTO games (id, item_id, status, start_time, end_time, initial_duration, final_phase_duration, total_clicks) VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'active',
    NOW() - INTERVAL '12 hours',
    NOW() + INTERVAL '12 hours',
    86400000,
    60000,
    5
  );

-- Game 3: AirPods - in final phase (less than 1 minute)
INSERT INTO games (id, item_id, status, start_time, end_time, initial_duration, final_phase_duration, total_clicks) VALUES
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '33333333-3333-3333-3333-333333333333',
    'final_phase',
    NOW() - INTERVAL '23 hours 59 minutes',
    NOW() + INTERVAL '45 seconds',
    86400000,
    60000,
    127
  );

-- Game 4: Switch - waiting to start
INSERT INTO games (id, item_id, status, start_time, end_time, initial_duration, final_phase_duration, total_clicks) VALUES
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '44444444-4444-4444-4444-444444444444',
    'waiting',
    NOW() + INTERVAL '1 hour',
    NOW() + INTERVAL '25 hours',
    86400000,
    60000,
    0
  );

-- Note: To test with a user, create an account through the app
-- The trigger will automatically create a profile with 10 credits
