import fs from 'fs/promises';
import path from 'path';

// Fetch all game data from JSONBin MasterBin
async function syncJsonBinToGitHub() {
  const masterBinId = '693897a8ae596e708f8ea7c2';
  const apiKey = process.env.VITE_JSONBIN_API_KEY;
  
  if (!apiKey) {
    console.error('JSONBIN_API_KEY environment variable is required');
    process.exit(1);
  }
  
  try {
    console.log('Starting sync from JSONBin to GitHub...');
    
    // Read MasterBin index
    const masterResponse = await fetch(`https://api.jsonbin.io/v3/b/${masterBinId}`, {
      headers: { 'X-Master-Key': apiKey }
    });
    
    if (!masterResponse.ok) {
      throw new Error(`Failed to fetch MasterBin: ${masterResponse.status}`);
    }
    
    const masterData = await masterResponse.json();
    console.log('Fetched MasterBin data');
    
    // Create data directory structure
    await fs.mkdir('data', { recursive: true });
    await fs.mkdir('data/games', { recursive: true });
    await fs.mkdir('data/players', { recursive: true });
    
    // Sync each game
    const gamesSynced = [];
    for (const [gameNumber, videos] of Object.entries(masterData.record.games)) {
      const gameDir = `data/games/${gameNumber}`;
      await fs.mkdir(gameDir, { recursive: true });
      
      // Save game metadata
      const metadata = {
        gameNumber,
        totalVideos: Object.keys(videos).length,
        videos: videos,
        lastSync: new Date().toISOString()
      };
      
      await fs.writeFile(
        `${gameDir}/metadata.json`,
        JSON.stringify(metadata, null, 2)
      );
      
      // Sync each video (quarter)
      for (const [videoNumber, binId] of Object.entries(videos)) {
        try {
          const videoResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            headers: { 'X-Master-Key': apiKey }
          });
          
          if (!videoResponse.ok) {
            console.warn(`Failed to fetch video ${gameNumber}-${videoNumber}: ${videoResponse.status}`);
            continue;
          }
          
          const videoData = await videoResponse.json();
          
          await fs.writeFile(
            `${gameDir}/quarter-${videoNumber}.json`,
            JSON.stringify(videoData.record, null, 2)
          );
          
          console.log(`Synced game ${gameNumber}, quarter ${videoNumber}`);
        } catch (error) {
          console.error(`Error syncing video ${gameNumber}-${videoNumber}:`, error.message);
        }
      }
      
      gamesSynced.push(gameNumber);
    }
    
    // Create index file for easy access
    const indexData = {
      lastSync: new Date().toISOString(),
      totalGames: gamesSynced.length,
      games: gamesSynced,
      masterBinId
    };
    
    await fs.writeFile(
      'data/index.json',
      JSON.stringify(indexData, null, 2)
    );
    
    console.log(`Successfully synced ${gamesSynced.length} games from JSONBin to GitHub`);
    console.log('Games synced:', gamesSynced.join(', '));
    
  } catch (error) {
    console.error('Sync failed:', error.message);
    process.exit(1);
  }
}

syncJsonBinToGitHub();
