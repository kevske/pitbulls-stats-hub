import { promises as fs } from 'fs';
import path from 'path';

// List of actual player folders to keep
const ACTUAL_PLAYERS = [
  'abdullah-ari',
  'alexander-rib',
  'christoph-mrsch',
  'danny-seitz',
  'david-scheja',
  'gregor-arapidis',
  'jan-crocoll',
  'jan-strobel',
  'kevin-rassner',
  'marcus-hayes',
  'marius-scholl',
  'nino-de-bortoli',
  'stefan-anselm',
  'sven-bader',
  'tim-krause',
  'tobi-thury'
];

async function cleanDummyPlayers() {
  const playersDir = path.join(process.cwd(), 'public', 'players');
  
  try {
    const items = await fs.readdir(playersDir, { withFileTypes: true });
    let removedCount = 0;
    
    for (const item of items) {
      const itemPath = path.join(playersDir, item.name);
      
      // Skip non-directory items and actual player folders
      if (!item.isDirectory() || ACTUAL_PLAYERS.includes(item.name)) {
        continue;
      }
      
      try {
        // Remove the directory and its contents
        await fs.rm(itemPath, { recursive: true, force: true });
        console.log(`✅ Removed dummy folder: ${item.name}`);
        removedCount++;
      } catch (error) {
        console.error(`❌ Error removing ${item.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Cleanup complete. Removed ${removedCount} dummy player folders.`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanDummyPlayers().catch(console.error);
