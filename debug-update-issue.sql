-- Debug and fix the update issue for box_scores table
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Check the exact data that exists
SELECT 
    game_id,
    team_id,
    player_slug,
    player_first_name,
    player_last_name,
    minutes_played,
    pg_typeof(game_id) as game_id_type,
    pg_typeof(team_id) as team_id_type,
    pg_typeof(player_slug) as player_slug_type
FROM box_scores 
WHERE game_id = '2786708' 
  AND team_id = '168416' 
  AND player_slug = 'nino-de-bortoli';

-- 2. Check all RLS policies on box_scores
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'box_scores';

-- 3. Test the exact update query that's failing
UPDATE box_scores 
SET minutes_played = 21.35 
WHERE game_id = '2786708' 
  AND team_id = '168416' 
  AND player_slug = 'nino-de-bortoli'
RETURNING *;

-- 4. If the above fails, try with explicit type casting
UPDATE box_scores 
SET minutes_played = 21.35 
WHERE game_id::text = '2786708' 
  AND team_id::text = '168416' 
  AND player_slug::text = 'nino-de-bortoli'
RETURNING *;

-- 5. Check if there are any triggers or constraints
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'box_scores';

-- 6. Create a more permissive RLS policy for testing
DROP POLICY IF EXISTS "Users can update box_scores" ON box_scores;
CREATE POLICY "Users can update box_scores" ON box_scores
FOR UPDATE USING (true);  -- Allow all updates for testing

-- 7. Try the update again with the permissive policy
UPDATE box_scores 
SET minutes_played = 21.35 
WHERE game_id = '2786708' 
  AND team_id = '168416' 
  AND player_slug = 'nino-de-bortoli'
RETURNING *;
