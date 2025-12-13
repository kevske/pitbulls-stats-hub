-- Comprehensive script to check and restore missing video entries
-- Based on the provided game data with YouTube links

-- Step 1: Create a temporary table with the provided game data
CREATE TEMPORARY TABLE provided_game_data (
    Spieltag INTEGER,
    Datum VARCHAR(50),
    Heim VARCHAR(100),
    Gast VARCHAR(100),
    Endstand VARCHAR(20),
    erstes_Viertel VARCHAR(20),
    Halbzeit VARCHAR(20),
    drittes_Viertel VARCHAR(20),
    Vorlaenger VARCHAR(20),
    Youtube_Link TEXT
);

-- Insert the provided data
INSERT INTO provided_game_data VALUES
(1, '28.09.2025 16:15', 'TSV Neuenstadt', 'Mamo Baskets Freiberg', '41 : 49', '14 : 14', '27 : 28', '39 : 39', '', 'https://www.youtube.com/embed/videoseries?si=eu68_74l4tNpMo5C&list=PLo9Gj2rLRK5zn_KBrt8299Fle0EVXBOaG'),
(2, '04.10.2025 14:00', 'HAKRO Merlins Crailsheim 3', 'TSV Neuenstadt', '73 : 62', '14 : 14', '38 : 32', '60 : 51', '', NULL),
(3, '12.10.2025 16:15', 'TSV Neuenstadt', 'SV Möhringen 2', '49 : 65', '16 : 15', '27 : 34', '34 : 54', '', 'https://www.youtube.com/embed/videoseries?si=yV-ubstdCCUPmekk&list=PLo9Gj2rLRK5xZB-MKl2i8T1gEyCti4Y71'),
(4, '19.10.2025 16:45', 'PKF Titans Stuttgart 2', 'TSV Neuenstadt', '81 : 75', '17 : 7', '37 : 23', '61 : 41', '', NULL),
(5, '09.11.2025 16:15', 'TSV Neuenstadt', 'TSV Ingelfingen', '78 : 70', '19 : 22', '30 : 35', '62 : 51', '', NULL),
(6, '23.11.2025 14:15', 'TSV Neuenstadt', 'TSV Ellwangen', '66 : 70', '22 : 13', '32 : 28', '48 : 47', '', 'https://youtube.com/playlist?list=PLo9Gj2rLRK5y7Tc7zTMv_GyyvGP7yXjaY&si=UGb79w2XXAbRNlW2'),
(7, '30.11.2025 15:00', 'TSV Essingen', 'TSV Neuenstadt', '55 : 69', '13 : 24', '31 : 50', '40 : 61', '', NULL),
(8, '07.12.2025 16:00', 'TSV Neuenstadt', 'TSV Kupferzell 2', '62 : 56', '5 : 16', '18 : 31', '35 : 47', '', 'https://www.youtube.com/playlist?list=PLo9Gj2rLRK5yEGrBKsGcjmaxTvZaXIp8-');

-- Step 2: Check current video_projects entries
SELECT 'Current video_projects entries:' as info;
SELECT 
    TSV_game_number,
    video_id,
    playlist_id,
    video_index,
    created_at
FROM video_projects 
WHERE TSV_game_number IN (1, 2, 3, 4, 5, 6, 7, 8)
ORDER BY TSV_game_number, video_index;

-- Step 3: Identify games with YouTube links but no video entries
SELECT 'Games with YouTube links but missing video entries:' as info;
SELECT 
    pg.Spieltag,
    pg.Heim,
    pg.Gast,
    pg.Youtube_Link,
    CASE 
        WHEN vp.TSV_game_number IS NULL THEN 'MISSING in video_projects'
        ELSE 'EXISTS in video_projects'
    END as status
FROM provided_game_data pg
LEFT JOIN video_projects vp ON pg.Spieltag = vp.TSV_game_number
WHERE pg.Youtube_Link IS NOT NULL 
  AND pg.Youtube_Link != ''
  AND vp.TSV_game_number IS NULL;

-- Step 4: Extract playlist IDs from YouTube links for missing entries
SELECT 'Extracted playlist IDs for missing entries:' as info;
SELECT 
    Spieltag,
    Heim,
    Gast,
    Youtube_Link,
    CASE 
        WHEN Youtube_Link LIKE '%list=%' THEN 
            SUBSTRING(Youtube_Link, POSITION('list=' IN Youtube_Link) + 5, 
                CASE 
                    WHEN Youtube_Link LIKE '%&%' THEN 
                        POSITION('&' IN SUBSTRING(Youtube_Link, POSITION('list=' IN Youtube_Link) + 6)) - 1
                    ELSE LENGTH(Youtube_Link)
                END - POSITION('list=' IN Youtube_Link) - 4)
        ELSE NULL
    END as extracted_playlist_id
FROM provided_game_data
WHERE Youtube_Link IS NOT NULL 
  AND Youtube_Link != ''
  AND NOT EXISTS (
    SELECT 1 FROM video_projects vp 
    WHERE vp.TSV_game_number = provided_game_data.Spieltag
  );

-- Step 5: Insert missing video entries
-- Game 1: PLo9Gj2rLRK5zn_KBrt8299Fle0EVXBOaG
-- Game 3: PLo9Gj2rLRK5xZB-MKl2i8T1gEyCti4Y71  
-- Game 6: PLo9Gj2rLRK5y7Tc7zTMv_GyyvGP7yXjaY
-- Game 8: PLo9Gj2rLRK5yEGrBKsGcjmaxTvZaXIp8-

INSERT INTO video_projects (game_number, TSV_game_number, playlist_id, video_index, data, created_at, updated_at)
SELECT 
    '1', 
    1,
    'PLo9Gj2rLRK5zn_KBrt8299Fle0EVXBOaG',
    0,
    '{"events": [], "players": []}',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM video_projects 
    WHERE TSV_game_number = 1 
    AND playlist_id = 'PLo9Gj2rLRK5zn_KBrt8299Fle0EVXBOaG'
);

INSERT INTO video_projects (game_number, TSV_game_number, playlist_id, video_index, data, created_at, updated_at)
SELECT 
    '3', 
    3,
    'PLo9Gj2rLRK5xZB-MKl2i8T1gEyCti4Y71',
    0,
    '{"events": [], "players": []}',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM video_projects 
    WHERE TSV_game_number = 3 
    AND playlist_id = 'PLo9Gj2rLRK5xZB-MKl2i8T1gEyCti4Y71'
);

INSERT INTO video_projects (game_number, TSV_game_number, playlist_id, video_index, data, created_at, updated_at)
SELECT 
    '6', 
    6,
    'PLo9Gj2rLRK5y7Tc7zTMv_GyyvGP7yXjaY',
    0,
    '{"events": [], "players": []}',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM video_projects 
    WHERE TSV_game_number = 6 
    AND playlist_id = 'PLo9Gj2rLRK5y7Tc7zTMv_GyyvGP7yXjaY'
);

INSERT INTO video_projects (game_number, TSV_game_number, playlist_id, video_index, data, created_at, updated_at)
SELECT 
    '8', 
    8,
    'PLo9Gj2rLRK5yEGrBKsGcjmaxTvZaXIp8-',
    0,
    '{"events": [], "players": []}',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM video_projects 
    WHERE TSV_game_number = 8 
    AND playlist_id = 'PLo9Gj2rLRK5yEGrBKsGcjmaxTvZaXIp8-'
);

-- Step 6: Final verification
SELECT 'Final verification - all video entries:' as info;
SELECT 
    vp.TSV_game_number,
    pg.Heim,
    pg.Gast,
    vp.playlist_id,
    vp.video_id,
    pg.Youtube_Link as provided_link,
    CASE 
        WHEN pg.Youtube_Link IS NOT NULL AND pg.Youtube_Link != '' THEN 'HAS PROVIDED LINK'
        ELSE 'NO PROVIDED LINK'
    END as link_status
FROM video_projects vp
LEFT JOIN provided_game_data pg ON vp.TSV_game_number = pg.Spieltag
WHERE vp.TSV_game_number IN (1, 2, 3, 4, 5, 6, 7, 8)
ORDER BY vp.TSV_game_number;

-- Clean up
DROP TABLE provided_game_data;
