-- Restore missing video entries for games that have YouTube links but no video_projects entries
-- Based on the provided data table

-- Game 1: TSV Neuenstadt vs Mamo Baskets Freiberg (already has video)
-- Game 2: HAKRO Merlins Crailsheim 3 vs TSV Neuenstadt (no YouTube link provided)
-- Game 3: TSV Neuenstadt vs SV Möhringen 2 (already has video)
-- Game 4: PKF Titans Stuttgart 2 vs TSV Neuenstadt (no YouTube link provided)
-- Game 5: TSV Neuenstadt vs TSV Ingelfingen (no YouTube link provided)
-- Game 6: TSV Neuenstadt vs TSV Ellwangen (already has video)
-- Game 7: TSV Essingen vs TSV Neuenstadt (no YouTube link provided)
-- Game 8: TSV Neuenstadt vs TSV Kupferzell 2 (already has video)

-- First, let's check what video entries currently exist
SELECT 
    TSV_game_number,
    video_id,
    playlist_id,
    COUNT(*) as entry_count
FROM video_projects 
WHERE TSV_game_number IN (1, 3, 6, 8)
GROUP BY TSV_game_number, video_id, playlist_id
ORDER BY TSV_game_number;

-- Check if games 2, 4, 5, 7 have any video entries
SELECT 
    TSV_game_number,
    video_id,
    playlist_id,
    COUNT(*) as entry_count
FROM video_projects 
WHERE TSV_game_number IN (2, 4, 5, 7)
GROUP BY TSV_game_number, video_id, playlist_id
ORDER BY TSV_game_number;

-- For games that have YouTube links, extract the playlist/video IDs and create entries
-- Game 1: https://www.youtube.com/embed/videoseries?si=eu68_74l4tNpMo5C&list=PLo9Gj2rLRK5zn_KBrt8299Fle0EVXBOaG
-- Playlist ID: PLo9Gj2rLRK5zn_KBrt8299Fle0EVXBOaG

-- Game 3: https://www.youtube.com/embed/videoseries?si=yV-ubstdCCUPmekk&list=PLo9Gj2rLRK5xZB-MKl2i8T1gEyCti4Y71
-- Playlist ID: PLo9Gj2rLRK5xZB-MKl2i8T1gEyCti4Y71

-- Game 6: https://youtube.com/playlist?list=PLo9Gj2rLRK5y7Tc7zTMv_GyyvGP7yXjaY&si=UGb79w2XXAbRNlW2
-- Playlist ID: PLo9Gj2rLRK5y7Tc7zTMv_GyyvGP7yXjaY

-- Game 8: https://www.youtube.com/playlist?list=PLo9Gj2rLRK5yEGrBKsGcjmaxTvZaXIp8-
-- Playlist ID: PLo9Gj2rLRK5yEGrBKsGcjmaxTvZaXIp8-

-- Insert missing video entries for games that have YouTube links but no database entries
-- Only insert if they don't already exist

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
    WHERE TSV_game_number = 1 AND playlist_id = 'PLo9Gj2rLRK5zn_KBrt8299Fle0EVXBOaG'
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
    WHERE TSV_game_number = 3 AND playlist_id = 'PLo9Gj2rLRK5xZB-MKl2i8T1gEyCti4Y71'
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
    WHERE TSV_game_number = 6 AND playlist_id = 'PLo9Gj2rLRK5y7Tc7zTMv_GyyvGP7yXjaY'
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
    WHERE TSV_game_number = 8 AND playlist_id = 'PLo9Gj2rLRK5yEGrBKsGcjmaxTvZaXIp8-'
);

-- Verify the inserted entries
SELECT 
    TSV_game_number,
    playlist_id,
    video_id,
    created_at
FROM video_projects 
WHERE TSV_game_number IN (1, 3, 6, 8)
ORDER BY TSV_game_number;
