const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkGame7() {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('game_number, box_score_url, home_team_name, away_team_name')
      .eq('game_number', 7);
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Game 7 data:', JSON.stringify(data, null, 2));
    }

    // Also check all games to see box_score_url values
    const { data: allGames, error: allError } = await supabase
      .from('games')
      .select('game_number, box_score_url')
      .order('game_number');
    
    if (allError) {
      console.error('Error fetching all games:', allError);
    } else {
      console.log('\nAll games box_score_url:');
      allGames.forEach(game => {
        console.log(`Game ${game.game_number}: ${game.box_score_url}`);
      });
    }
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkGame7();
