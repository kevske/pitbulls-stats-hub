import { promises as fs } from 'fs';
import path from 'path';

// List of player folders
const PLAYER_FOLDERS = [
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

async function renamePlayerImages() {
  const playersDir = path.join(process.cwd(), 'public', 'players');
  let renamedCount = 0;
  let skippedCount = 0;
  
  try {
    for (const player of PLAYER_FOLDERS) {
      const playerDir = path.join(playersDir, player);
      
      try {
        // Check if player directory exists
        await fs.access(playerDir);
      } catch {
        console.log(`ℹ️  No directory found for ${player}, skipping...`);
        continue;
      }
      
      // Get all files in the player's directory
      let files;
      try {
        files = await fs.readdir(playerDir);
      } catch (error) {
        console.error(`❌ Error reading directory ${player}:`, error.message);
        continue;
      }
      
      // Filter out directories and profile.* files
      const imageFiles = [];
      for (const file of files) {
        const filePath = path.join(playerDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile() && !file.toLowerCase().startsWith('profile.')) {
          imageFiles.push(file);
        }
      }
      
      // Sort files to ensure consistent numbering
      imageFiles.sort();
      
      // Rename files
      for (let i = 0; i < imageFiles.length; i++) {
        const oldName = imageFiles[i];
        const extension = path.extname(oldName).toLowerCase();
        const oldPath = path.join(playerDir, oldName);
        
        // Determine the date based on filename
        const isBlaufelden = oldName.toLowerCase().includes('blaufelden');
        const dateStr = isBlaufelden ? '2025-04-06' : '2024-09-30';
        
        // Create new filename
        const newName = `${dateStr}-${player}-${String(i + 1).padStart(2, '0')}${extension}`;
        const newPath = path.join(playerDir, newName);
        
        try {
          // Skip if the file is already correctly named
          if (oldName === newName) {
            console.log(`ℹ️  Skipping already renamed file: ${player}/${oldName}`);
            skippedCount++;
            continue;
          }
          
          // Rename the file
          await fs.rename(oldPath, newPath);
          console.log(`✅ Renamed: ${player}/${oldName} → ${newName}`);
          renamedCount++;
        } catch (error) {
          console.error(`❌ Error renaming ${player}/${oldName}:`, error.message);
        }
      }
    }
    
    console.log(`\n🎉 Renaming complete.`);
    console.log(`- Renamed ${renamedCount} files`);
    console.log(`- Skipped ${skippedCount} files (already correctly named)`);
    console.log('\nNote: Profile pictures in the root directory were not modified.');
  } catch (error) {
    console.error('❌ Error during renaming:', error.message);
    process.exit(1);
  }
}

// Run the renaming
renamePlayerImages().catch(console.error);
