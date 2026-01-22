-- ============================================
-- BOT CLICKS via pg_cron - Clikzy
-- ============================================
--
-- Ce script crée une fonction PostgreSQL qui simule
-- les clics de bots et tourne toutes les 15 secondes.
--
-- Exécuter dans Supabase SQL Editor

-- 1. Activer pg_cron si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Créer la fonction de génération de username
CREATE OR REPLACE FUNCTION generate_bot_username(seed TEXT)
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY['Swift', 'Lucky', 'Crazy', 'Super', 'Mega', 'Ultra', 'Epic', 'Pro', 'Elite', 'Alpha', 'Beta', 'Turbo', 'Hyper', 'Ninja', 'Pixel', 'Cyber', 'Neo', 'Dark', 'Bright', 'Golden'];
  nouns TEXT[] := ARRAY['Wolf', 'Tiger', 'Dragon', 'Phoenix', 'Falcon', 'Bear', 'Lion', 'Eagle', 'Shark', 'Panther', 'Viper', 'Cobra', 'Storm', 'Thunder', 'Shadow', 'Flame', 'Frost', 'Knight', 'Warrior', 'Hunter'];
  hash_val BIGINT;
  adj TEXT;
  noun TEXT;
  num INT;
BEGIN
  -- Simple hash from seed
  hash_val := abs(hashtext(seed));

  adj := adjectives[1 + (hash_val % array_length(adjectives, 1))];
  noun := nouns[1 + ((hash_val / 20) % array_length(nouns, 1))];
  num := (hash_val % 999) + 1;

  RETURN adj || noun || num::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 3. Créer la fonction principale de simulation de clics
CREATE OR REPLACE FUNCTION simulate_bot_clicks()
RETURNS void AS $$
DECLARE
  game_record RECORD;
  current_time BIGINT := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
  time_left BIGINT;
  click_probability FLOAT;
  should_click BOOLEAN;
  new_username TEXT;
  new_end_time BIGINT;
  item_name TEXT;
BEGIN
  -- Parcourir les jeux actifs
  FOR game_record IN
    SELECT g.*, i.name as item_name
    FROM games g
    JOIN items i ON g.item_id = i.id
    WHERE g.status IN ('active', 'final_phase')
  LOOP
    time_left := game_record.end_time - current_time;

    -- Skip si le jeu est terminé
    IF time_left <= 0 THEN
      -- Terminer le jeu
      UPDATE games
      SET status = 'ended', ended_at = NOW()
      WHERE id = game_record.id AND status IN ('active', 'final_phase');

      -- Créer le record gagnant
      IF game_record.last_click_username IS NOT NULL THEN
        INSERT INTO winners (game_id, user_id, username, item_id, item_name, total_clicks_in_game, is_bot)
        VALUES (
          game_record.id,
          game_record.last_click_user_id,
          COALESCE(game_record.last_click_username, 'Bot'),
          game_record.item_id,
          game_record.item_name,
          game_record.total_clicks,
          game_record.last_click_user_id IS NULL
        );
      END IF;

      CONTINUE;
    END IF;

    -- Calculer la probabilité de clic (sur 15 secondes)
    -- Phase finale (< 60s): ~40% chance par tick
    -- Active (< 15min): ~20% chance par tick
    -- Building (< 30min): ~10% chance par tick
    -- Positioning: ~5% chance par tick

    IF time_left <= 60000 THEN
      click_probability := 0.40;
    ELSIF time_left <= 900000 THEN  -- 15 min
      click_probability := 0.20;
    ELSIF time_left <= 1800000 THEN -- 30 min
      click_probability := 0.10;
    ELSE
      click_probability := 0.05;
    END IF;

    -- Décision aléatoire
    should_click := random() < click_probability;

    IF should_click THEN
      -- Générer username
      new_username := generate_bot_username(game_record.id || '-' || current_time::TEXT);
      item_name := game_record.item_name;

      -- Calculer nouveau end_time (reset seulement si < 60s)
      IF time_left <= 60000 THEN
        new_end_time := current_time + 60000;
      ELSE
        new_end_time := game_record.end_time;
      END IF;

      -- Insérer le clic
      INSERT INTO clicks (game_id, username, is_bot, item_name)
      VALUES (game_record.id, new_username, true, item_name);

      -- Mettre à jour le jeu
      UPDATE games
      SET
        total_clicks = total_clicks + 1,
        last_click_username = new_username,
        last_click_user_id = NULL,
        end_time = new_end_time,
        status = CASE WHEN new_end_time - current_time <= 60000 THEN 'final_phase' ELSE status END
      WHERE id = game_record.id;

      RAISE NOTICE 'Bot click: % on game %', new_username, game_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer le cron job qui tourne toutes les 15 secondes
-- Note: pg_cron utilise la syntaxe cron standard, le minimum est 1 minute
-- Pour 15 secondes, on crée 4 jobs décalés

-- Supprimer les anciens jobs s'ils existent
SELECT cron.unschedule('bot_clicks_0') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'bot_clicks_0');
SELECT cron.unschedule('bot_clicks_15') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'bot_clicks_15');
SELECT cron.unschedule('bot_clicks_30') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'bot_clicks_30');
SELECT cron.unschedule('bot_clicks_45') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'bot_clicks_45');

-- Job qui tourne à :00 de chaque minute
SELECT cron.schedule('bot_clicks_0', '* * * * *', 'SELECT simulate_bot_clicks()');

-- Les autres jobs pour simuler 15s/30s/45s ne sont pas possibles avec pg_cron standard
-- pg_cron ne supporte que la granularité minute

-- Alternative: utiliser pg_sleep dans une boucle (non recommandé en prod)

-- 5. Vérification
SELECT * FROM cron.job WHERE jobname LIKE 'bot_clicks%';

-- Pour tester manuellement:
-- SELECT simulate_bot_clicks();
