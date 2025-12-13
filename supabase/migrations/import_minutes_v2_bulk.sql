-- Bulk Update Script (V2) - More Transparent
-- This approach uses standard SQL Joins instead of a loop, so you can see exactly what is happening.

-- 1. Create Staging Table
CREATE TEMP TABLE minutes_staging (
    spieltag INT,
    player_name TEXT,
    minutes_str TEXT
);

-- 2. Insert Data (Formatted as Spieltag, First Last, Minutes)
INSERT INTO minutes_staging (spieltag, player_name, minutes_str) VALUES
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

-- 3. Perform the Update using a JOIN (Bulk Update)
WITH seasonal_games AS (
    SELECT 
        game_id, 
        game_date,
        ROW_NUMBER() OVER (ORDER BY game_date ASC) as computed_spieltag
    FROM games 
    WHERE (home_team_name ILIKE '%neuenstadt%' OR away_team_name ILIKE '%neuenstadt%')
      AND game_date >= '2024-08-01'
),
matched_updates AS (
    SELECT 
        sg.game_id,
        bs.player_slug,
        CAST(REPLACE(ms.minutes_str, ',', '.') AS NUMERIC) as new_minutes
    FROM minutes_staging ms
    JOIN seasonal_games sg ON ms.spieltag = sg.computed_spieltag
    JOIN box_scores bs ON bs.game_id = sg.game_id 
    WHERE (bs.player_first_name || ' ' || bs.player_last_name) ILIKE TRIM(ms.player_name)
)
UPDATE box_scores bs
SET minutes_played = mu.new_minutes
FROM matched_updates mu
WHERE bs.game_id = mu.game_id AND bs.player_slug = mu.player_slug;

-- 4. Verify Results
SELECT 
    g.game_date,
    bs.player_first_name, 
    bs.player_last_name, 
    bs.minutes_played
FROM box_scores bs
JOIN games g ON bs.game_id = g.game_id
WHERE bs.minutes_played > 0 AND g.game_date >= '2024-08-01'
ORDER BY g.game_date DESC, bs.minutes_played DESC;

-- Cleanup
DROP TABLE minutes_staging;
