-- Check if player_slugs are missing for Neuenstadt players
SELECT 
    g.game_date,
    bs.player_first_name,
    bs.player_last_name,
    bs.player_slug,
    bs.minutes_played
FROM box_scores bs
JOIN games g ON bs.game_id = g.game_id
WHERE (g.home_team_name ILIKE '%neuenstadt%' OR g.away_team_name ILIKE '%neuenstadt%')
  AND g.game_date >= '2024-08-01'
  AND (bs.player_slug IS NULL OR bs.player_slug = '')
ORDER BY g.game_date DESC, bs.player_last_name;
