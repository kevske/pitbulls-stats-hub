-- Deep Debug for Import Logic
-- Testing specifically for Spieltag 2, Player 'Stefan Anselm'

DO $$
DECLARE
    v_target_spieltag INTEGER := 2;
    v_target_player TEXT := 'Stefan Anselm';
    
    v_game_id TEXT;
    v_game_date DATE;
    v_found_slug TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
BEGIN
    RAISE NOTICE '--- Starting Debug for Spieltag % ---', v_target_spieltag;

    -- 1. Find the Game ID
    SELECT game_id, game_date 
    INTO v_game_id, v_game_date
    FROM (
        SELECT 
            game_id,
            game_date,
            ROW_NUMBER() OVER (ORDER BY game_date ASC) as rn
        FROM games 
        WHERE (home_team_name ILIKE '%neuenstadt%' OR away_team_name ILIKE '%neuenstadt%')
          AND game_date >= '2024-08-01'
    ) ranked
    WHERE rn = v_target_spieltag;

    IF v_game_id IS NULL THEN
        RAISE NOTICE 'CRITICAL: Could not find Game ID for Spieltag %', v_target_spieltag;
        RETURN;
    ELSE
        RAISE NOTICE 'Found Game ID: % (Date: %)', v_game_id, v_game_date;
    END IF;

    -- 2. Check ALL players in box_scores for this game
    RAISE NOTICE 'List of players found in box_scores for this game:';
    FOR v_first_name, v_last_name, v_found_slug IN 
        SELECT player_first_name, player_last_name, player_slug 
        FROM box_scores 
        WHERE game_id = v_game_id
    LOOP
        RAISE NOTICE ' - % % (Slug: %)', v_first_name, v_last_name, v_found_slug;
    END LOOP;

    -- 3. Try the Match Logic
    SELECT player_slug INTO v_found_slug
    FROM box_scores
    WHERE game_id = v_game_id
      AND (
        player_slug = v_target_player
        OR (player_first_name || ' ' || player_last_name) ILIKE v_target_player
        OR (player_first_name || ' ' || split_part(player_last_name, ' ', 1)) ILIKE v_target_player
        OR (player_first_name || ' ' || player_last_name) ILIKE TRIM(v_target_player)
      )
    LIMIT 1;

    IF v_found_slug IS NULL THEN
         RAISE NOTICE 'FAILURE: Could not match "%" to any player in this game.', v_target_player;
    ELSE
         RAISE NOTICE 'SUCCESS: matched "%" to slug "%"', v_target_player, v_found_slug;
    END IF;

END $$;
