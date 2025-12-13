// Simple test script to check video-only games loading
// This can be run in the browser console or as a Node script

async function testVideoOnlyGames() {
  try {
    console.log('Testing video-only games loading...');
    
    // Import the SupabaseStatsService (this would need to be adapted for browser vs Node)
    const { SupabaseStatsService } = await import('./src/lib/supabaseStatsService.ts');
    
    // Fetch all games using the updated method
    const { games, gameNumberMap } = await SupabaseStatsService.fetchAllGames();
    
    console.log(`Total games loaded: ${games.length}`);
    console.log(`Game number map entries: ${gameNumberMap.size}`);
    
    // Filter games that have video links but no score (likely video-only)
    const videoOnlyGames = games.filter(game => 
      game.youtubeLink && 
      (!game.finalScore || game.finalScore === '-')
    );
    
    console.log(`Video-only games found: ${videoOnlyGames.length}`);
    
    if (videoOnlyGames.length > 0) {
      console.log('Video-only games:');
      videoOnlyGames.forEach(game => {
        console.log(`- Game ${game.gameNumber}: ${game.homeTeam} vs ${game.awayTeam}`);
        console.log(`  Video: ${game.youtubeLink}`);
        console.log(`  Date: ${game.date}`);
      });
    }
    
    // Also check games with both logs and videos
    const gamesWithBoth = games.filter(game => 
      game.youtubeLink && 
      game.finalScore && 
      game.finalScore !== '-'
    );
    
    console.log(`Games with both logs and videos: ${gamesWithBoth.length}`);
    
    return { totalGames: games.length, videoOnlyGames: videoOnlyGames.length, gamesWithBoth: gamesWithBoth.length };
    
  } catch (error) {
    console.error('Error testing video-only games:', error);
    throw error;
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testVideoOnlyGames = testVideoOnlyGames;
  console.log('testVideoOnlyGames function available in window.testVideoOnlyGames()');
} else {
  // Node.js environment
  testVideoOnlyGames().then(result => {
    console.log('Test completed:', result);
  }).catch(error => {
    console.error('Test failed:', error);
  });
}
