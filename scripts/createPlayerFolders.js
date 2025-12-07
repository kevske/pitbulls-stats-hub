import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to generate a URL-friendly slug from a player name
function generatePlayerSlug(firstName, lastName) {
  return `${firstName.toLowerCase()}-${lastName.toLowerCase()}`
    .replace(/[^a-z0-9-]/g, '-') // Replace special characters with hyphens
    .replace(/-+/g, '-')         // Replace multiple hyphens with a single one
    .replace(/^-|-$/g, '');      // Remove leading/trailing hyphens
}

// Function to create player folders
async function createPlayerFolders(players) {
  const playersDir = path.join(process.cwd(), 'public', 'players');
  
  try {
    // Ensure the players directory exists
    await fs.mkdir(playersDir, { recursive: true });
    
    // Create a folder for each player
    for (const player of players) {
      const playerSlug = generatePlayerSlug(player.firstName, player.lastName);
      const playerDir = path.join(playersDir, playerSlug);
      
      try {
        try {
          // Try to access the directory
          await fs.access(playerDir);
          console.log(`ℹ️  Folder already exists for ${player.firstName} ${player.lastName}: ${playerDir}`);
        } catch (accessError) {
          // If directory doesn't exist, create it
          if (accessError.code === 'ENOENT') {
            await fs.mkdir(playerDir, { recursive: true });
            console.log(`✅ Created folder for ${player.firstName} ${player.lastName}: ${playerDir}`);
          } else {
            throw accessError;
          }
        }
      } catch (error) {
        console.error(`❌ Error creating folder for ${player.firstName} ${player.lastName}:`, error);
      }
    }
    
    console.log('\n🎉 Player folders created successfully!');
  } catch (error) {
    console.error('❌ Error creating player folders:', error);
    process.exit(1);
  }
}

// Sample player data - in a real scenario, you would fetch this from your database
const samplePlayers = [
  { firstName: 'Max', lastName: 'Mustermann' },
  { firstName: 'Anna', lastName: 'Schmidt' },
  { firstName: 'Tom', lastName: 'Müller' },
  { firstName: 'Lena', lastName: 'Fischer' },
  { firstName: 'Paul', lastName: 'Weber' },
  { firstName: 'Laura', lastName: 'Wagner' },
  { firstName: 'Felix', lastName: 'Becker' },
  { firstName: 'Sophie', lastName: 'Hoffmann' },
  { firstName: 'Jonas', lastName: 'Schulz' },
  { firstName: 'Emma', lastName: 'Koch' },
  { firstName: 'Ben', lastName: 'Richter' },
  { firstName: 'Hannah', lastName: 'Schröder' }
];

// Create folders for the sample players
createPlayerFolders(samplePlayers).catch(console.error);
