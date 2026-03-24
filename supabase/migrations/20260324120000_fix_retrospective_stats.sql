-- Fix inflated two_pointers_made and two_pointers_attempted in player_video_stats (freethrows were wrongly included)
UPDATE public.player_video_stats
SET 
  two_pointers_made = GREATEST(0, two_pointers_made - free_throws_made),
  two_pointers_attempted = GREATEST(0, two_pointers_attempted - free_throws_attempted)
WHERE free_throws_attempted > 0;

-- Fix inflated team_fg_percentage in video_game_stats
UPDATE public.video_game_stats vgs
SET team_fg_percentage = 
  CASE 
    WHEN (
      SELECT SUM(pvs.two_pointers_attempted + pvs.three_pointers_attempted) 
      FROM public.player_video_stats pvs 
      WHERE pvs.game_number = vgs.game_number
    ) > 0 
    THEN 
      ROUND((
        SELECT SUM(pvs.two_pointers_made + pvs.three_pointers_made)::numeric / 
               SUM(pvs.two_pointers_attempted + pvs.three_pointers_attempted)::numeric * 100
        FROM public.player_video_stats pvs 
        WHERE pvs.game_number = vgs.game_number
      ), 1)
    ELSE 0 
  END;
