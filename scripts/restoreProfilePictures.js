import { promises as fs } from 'fs';
import path from 'path';

// List of actual players with their image filenames
const PLAYERS = [
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

async function restoreProfilePictures() {
  const playersDir = path.join(process.cwd(), 'public', 'players');
  let restoredCount = 0;
  
  try {
    for (const player of PLAYERS) {
      const playerDir = path.join(playersDir, player);
      
      // Check if player directory exists
      try {
        await fs.access(playerDir);
      } catch {
        console.log(`ℹ️  No directory found for ${player}, skipping...`);
        continue;
      }
      
      // Look for profile.jpg or profile.png in the player's directory
      let sourceFile;
      let extension;
      
      try {
        await fs.access(path.join(playerDir, 'profile.jpg'));
        sourceFile = path.join(playerDir, 'profile.jpg');
        extension = '.jpg';
      } catch {
        try {
          await fs.access(path.join(playerDir, 'profile.png'));
          sourceFile = path.join(playerDir, 'profile.png');
          extension = '.png';
        } catch {
          console.log(`ℹ️  No profile image found for ${player}, skipping...`);
          continue;
        }
      }
      
      // Define the destination path (original location)
      const destFile = path.join(playersDir, `${player}${extension}`);
      
      try {
        // Copy the file back to the original location
        await fs.copyFile(sourceFile, destFile);
        console.log(`✅ Restored ${player}'s profile picture`);
        restoredCount++;
      } catch (error) {
        console.error(`❌ Error restoring ${player}'s profile picture:`, error.message);
      }
    }
    
    console.log(`\n🎉 Restored ${restoredCount} profile pictures to their original locations.`);
    console.log('Note: The player folders and their contents have been preserved.');
  } catch (error) {
    console.error('❌ Error during restoration:', error.message);
    process.exit(1);
  }
}

// Run the restoration
restoreProfilePictures().catch(console.error);
