import { supabase } from './lib/supabase';

// Debug script to check your email in the database
async function debugEmail() {
  const email = 'your-email@example.com'; // Replace with your actual email
  
  console.log(`Checking email: ${email}`);
  
  // Check if email exists at all
  const { data: allPlayers, error: allError } = await supabase
    .from('player_info')
    .select('*');
    
  if (allError) {
    console.error('Error fetching all players:', allError);
    return;
  }
  
  console.log('All players in database:');
  console.log(allPlayers);
  
  // Check specific email
  const { data: player, error: playerError } = await supabase
    .from('player_info')
    .select('*')
    .eq('email', email);
    
  if (playerError) {
    console.error('Error checking specific email:', playerError);
    return;
  }
  
  console.log(`Players with email ${email}:`, player);
  
  // Check with is_active condition
  const { data: activePlayer, error: activeError } = await supabase
    .from('player_info')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single();
    
  if (activeError) {
    console.error('Error checking active player:', activeError);
  } else {
    console.log('Active player found:', activePlayer);
  }
}

// Run this in your browser console or as a temporary script
