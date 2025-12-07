import { promises as fs } from 'fs';
import path from 'path';

// Extract player names from filenames
const playerImages = [
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

// Convert slugs to proper names
function formatPlayerName(slug) {
  return slug
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .map(part => part.replace('Mrsch', 'Mörsch'))
    .join(' ')
    .replace('De Bortoli', 'de Bortoli');
}

// Create player folders
async function createPlayerFolders() {
  const playersDir = path.join(process.cwd(), 'public', 'players');
  
  try {
    // Ensure the players directory exists
    await fs.mkdir(playersDir, { recursive: true });
    
    // Create a folder for each player
    for (const slug of playerImages) {
      const playerDir = path.join(playersDir, slug);
      const playerName = formatPlayerName(slug);
      
      try {
        // Try to access the directory
        try {
          await fs.access(playerDir);
          console.log(`ℹ️  Folder already exists for ${playerName}: ${playerDir}`);
        } catch (accessError) {
          // If directory doesn't exist, create it
          if (accessError.code === 'ENOENT') {
            await fs.mkdir(playerDir, { recursive: true });
            console.log(`✅ Created folder for ${playerName}: ${playerDir}`);
            
            // Move the existing image to the player's folder
            const sourceFiles = await fs.readdir(playersDir);
            const playerFiles = sourceFiles.filter(file => {
              // Match files that start with the player's slug
              const baseName = path.basename(file, path.extname(file));
              return baseName.startsWith(slug);
            });

            for (const file of playerFiles) {
              try {
                const sourceFile = path.join(playersDir, file);
                const ext = path.extname(file);
                const destFile = path.join(playerDir, `profile${ext}`);
                
                // Check if source file exists and is a file (not a directory)
                const stats = await fs.stat(sourceFile);
                if (stats.isFile()) {
                  await fs.rename(sourceFile, destFile);
                  console.log(`   → Moved ${file} to player's folder as profile${ext}`);
                }
              } catch (e) {
                console.error(`   → Error moving file ${file}:`, e.message);
              }
            }
          } else {
            throw accessError;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing folder for ${playerName}:`, error);
      }
    }
    
    console.log('\n🎉 Player folders created and organized successfully!');
  } catch (error) {
    console.error('❌ Error creating player folders:', error);
    process.exit(1);
  }
}

// Run the script
createPlayerFolders().catch(console.error);
