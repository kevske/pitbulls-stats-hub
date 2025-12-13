-- Migration to import minutes played data using "Spieltag" (Game Number)
-- 
-- LOGIC:
-- This script matches "Spieltag 1" to the earliest game of the CURRENT SEASON
-- (assumed to start after 2024-08-01) for Neuenstadt.
-- Filtering by date ensures we don't accidentally count games from previous seasons.

-- 1. Create a temporary table for the raw import data
CREATE TEMP TABLE minutes_import_raw (
    spieltag_number INTEGER,
    player_identifier TEXT, -- Name or Slug
    minutes_input TEXT     -- stored as text to handle "12,5" vs "12.5"
);

-- 2. === PASTE YOUR DATA BELOW ===
INSERT INTO minutes_import_raw (spieltag_number, player_identifier, minutes_input) VALUES
(2, 'Stefan Anselm', '13,87'),
(2, 'Gregor Arapidis', '5,65'),
(2, 'Abdullah Ari', '22,13'),
(2, 'Sven Bader', '5,50'),
(2, 'Jan Crocoll', '30,60'),
(2, 'Nino de Bortoli', '25,82'),
(2, 'Tim Krause', '18,05'),
(2, 'Christoph Mörsch', '12,37'),
(2, 'Alexander Rib', '35,57'),
(2, 'David Scheja', '7,80'),
(2, 'Marius Scholl', '22,62'),
(3, 'Stefan Anselm', '23,07'),
(3, 'Gregor Arapidis', '3,65'),
(3, 'Abdullah Ari', '17,18'),
(3, 'Sven Bader', '7,08'),
(3, 'Nino de Bortoli', '13,97'),
(3, 'Marcus Hayes', '8,53'),
(3, 'Tim Krause', '23,98'),
(3, 'Christoph Mörsch', '15,73'),
(3, 'Alexander Rib', '37,55'),
(3, 'David Scheja', '22,22'),
(3, 'Marius Scholl', '26,98'),
(1, 'Stefan Anselm', '18,40'),
(1, 'Gregor Arapidis', '6,38'),
(1, 'Abdullah Ari', '22,07'),
(1, 'Sven Bader', '7,48'),
(1, 'Jan Crocoll', '31,58'),
(1, 'Nino de Bortoli', '20,22'),
(1, 'Marcus Hayes', '5,77'),
(1, 'Tim Krause', '30,13'),
(1, 'Alexander Rib', '28,95'),
(1, 'David Scheja', '8,17'),
(1, 'Marius Scholl', '20,85'),
(4, 'Stefan Anselm', '29,13'),
(4, 'Abdullah Ari', '31,38'),
(4, 'Jan Crocoll', '16,50'),
(4, 'Tim Krause', '35,08'),
(4, 'Christoph Mörsch', '27,43'),
(4, 'Alexander Rib', '40,00'),
(4, 'Marius Scholl', '20,47'),
(5, 'Gregor Arapidis', '4,90'),
(5, 'Abdullah Ari', '20,90'),
(5, 'Sven Bader', '1,10'),
(5, 'Jan Crocoll', '22,60'),
(5, 'Nino de Bortoli', '9,20'),
(5, 'Marcus Hayes', '2,90'),
(5, 'Tim Krause', '29,10'),
(5, 'Christoph Mörsch', '26,50'),
(5, 'Kevin Rassner', '15,90'),
(5, 'Alexander Rib', '31,70'),
(5, 'Marius Scholl', '25,80'),
(5, 'Jan Strobel', '9,20'),
(6, 'Gregor Arapidis', '0,00'),
(6, 'Abdullah Ari', '31,50'),
(6, 'Jan Crocoll', '31,80'),
(6, 'Nino de Bortoli', '13,00'),
(6, 'Marcus Hayes', '4,50'),
(6, 'Tim Krause', '30,50'),
(6, 'Christoph Mörsch', '13,50'),
(6, 'Alexander Rib', '30,50'),
(6, 'David Scheja', '0,00'),
(6, 'Marius Scholl', '28,60'),
(6, 'Jan Strobel', '15,70'),
(8, 'Stefan Anselm', '29,50'),
(8, 'Gregor Arapidis', '0,70'),
(8, 'Abdullah Ari', '16,00'),
(8, 'Jan Crocoll', '25,20'),
(8, 'Nino de Bortoli', '8,75'),
(8, 'Tim Krause', '33,50'),
(8, 'Christoph Mörsch', '12,75'),
(8, 'Kevin Rassner', '23,10'),
(8, 'Alexander Rib', '33,75'),
(8, 'David Scheja', '6,20'),
(8, 'Jan Strobel', '10,50');

-- 3. Perform the Update
DO $$
DECLARE
    r RECORD;
    v_game_id TEXT;
    v_player_slug TEXT;
    v_minutes NUMERIC;
    v_updated_count INTEGER := 0;
    v_skipped_count INTEGER := 0;
    v_mapped_game_date DATE;
    v_matchup TEXT;
BEGIN
    -- Loop through each row of imported data
    FOR r IN SELECT * FROM minutes_import_raw WHERE spieltag_number > 0 LOOP
        
        -- A. Resolve Spieltag Number -> game_id
        -- Added filter: game_date > '2024-08-01' to ensure we only look at the current season
        SELECT game_id, game_date, (home_team_name || ' vs ' || away_team_name)
        INTO v_game_id, v_mapped_game_date, v_matchup
        FROM (
            SELECT 
                game_id,
                game_date,
                home_team_name,
                away_team_name,
                ROW_NUMBER() OVER (ORDER BY game_date ASC) as rn
            FROM games 
            WHERE (home_team_name ILIKE '%neuenstadt%' OR away_team_name ILIKE '%neuenstadt%')
              AND game_date >= '2024-08-01' -- SEASON FILTER
        ) ranked
        WHERE rn = r.spieltag_number;

        IF v_game_id IS NULL THEN
            -- Only log ONCE per spieltag to avoid spamming notices
            -- (Actually, we can't easily dedup locally without logic, so let's just log)
            -- RAISE NOTICE 'Skipping: Could not find Game #% (Spieltag) for Neuenstadt (Season starting Aug 2024).', r.spieltag_number;
            v_skipped_count := v_skipped_count + 1;
            CONTINUE;
        END IF;

        -- B. Resolve Player Name -> player_slug
        SELECT player_slug INTO v_player_slug
        FROM box_scores
        WHERE game_id = v_game_id
          AND (
            player_slug = r.player_identifier
            OR (player_first_name || ' ' || player_last_name) ILIKE r.player_identifier
            OR (player_first_name || ' ' || split_part(player_last_name, ' ', 1)) ILIKE r.player_identifier
            OR (player_first_name || ' ' || player_last_name) ILIKE TRIM(r.player_identifier)
          )
        LIMIT 1;

        -- C. Clean and Convert Minutes
        BEGIN
            v_minutes := CAST(REPLACE(r.minutes_input, ',', '.') AS NUMERIC);
        EXCEPTION WHEN OTHERS THEN
            v_skipped_count := v_skipped_count + 1;
            CONTINUE;
        END;

        -- D. Update the Database
        IF v_player_slug IS NOT NULL THEN
            UPDATE box_scores
            SET minutes_played = v_minutes
            WHERE game_id = v_game_id 
              AND player_slug = v_player_slug;
            
            IF FOUND THEN
                v_updated_count := v_updated_count + 1;
                -- Debug: Print successful mapping for the first few to verify
                IF v_updated_count <= 3 THEN
                   RAISE NOTICE 'Mapped Spieltag % to % (%) - Player % updated.', r.spieltag_number, v_mapped_game_date, v_matchup, r.player_identifier;
                END IF;
            ELSE
                 v_skipped_count := v_skipped_count + 1;
            END IF;
        ELSE
            -- RAISE NOTICE 'Player not found in box_scores: Spieltag %, Name: %', r.spieltag_number, r.player_identifier;
            v_skipped_count := v_skipped_count + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'Import Complete. Updated: %. Skipped/Error: %', v_updated_count, v_skipped_count;
END $$;

-- Cleanup
DROP TABLE minutes_import_raw;
