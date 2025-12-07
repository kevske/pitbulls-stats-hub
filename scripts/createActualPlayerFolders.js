import { promises as fs } from 'fs';
import path from 'path';

// Supported image extensions
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Extract player name from filename (removes any numbers, dates, and extensions)
function extractPlayerName(filename) {
  // Remove file extension
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  
  // Remove any numbers and special characters, keep only letters and hyphens
  const cleanName = nameWithoutExt
    .replace(/\d+/g, '')  // Remove numbers
    .replace(/[^a-zA-Z-]/g, '')  // Keep only letters and hyphens
    .replace(/-+/g, '-')  // Replace multiple hyphens with single one
    .replace(/^-|-$/g, '');  // Remove leading/trailing hyphens
    
  return cleanName.toLowerCase();
}

// Convert slugs to proper names
function formatPlayerName(slug) {
  return slug
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .map(part => part.replace('Mrsch', 'Mörsch'))
    .join(' ')
    .replace('De Bortoli', 'de Bortoli');
}

// Create player folders and organize images
async function createPlayerFolders() {
  const playersDir = path.join(process.cwd(), 'public', 'players');
  
  try {
    // Ensure the players directory exists
    await fs.mkdir(playersDir, { recursive: true });
    
    // Read all files in the directory
    const files = await fs.readdir(playersDir);
    
    // Group files by player name
    const playerFiles = new Map();
    
    for (const file of files) {
      const filePath = path.join(playersDir, file);
      const stats = await fs.stat(filePath);
      
      // Skip directories and non-image files
      if (!stats.isFile() || !IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
        continue;
      }
      
      // Extract player name from filename
      const playerSlug = extractPlayerName(file);
      if (!playerSlug) continue;
      
      if (!playerFiles.has(playerSlug)) {
        playerFiles.set(playerSlug, []);
      }
      playerFiles.get(playerSlug).push(file);
    }
    
    // Process each player's files
    for (const [slug, files] of playerFiles.entries()) {
      const playerDir = path.join(playersDir, slug);
      const playerName = formatPlayerName(slug);
      
      try {
        // Create player directory if it doesn't exist
        await fs.mkdir(playerDir, { recursive: true });
        
        // Move each file to the player's folder
        for (const file of files) {
          const sourceFile = path.join(playersDir, file);
          const ext = path.extname(file);
          const destFile = path.join(playerDir, `profile${ext}`);
          
          try {
            await fs.rename(sourceFile, destFile);
            console.log(`✅ Moved ${file} to ${slug}/profile${ext}`);
          } catch (e) {
            console.error(`❌ Error moving ${file}:`, e.message);
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
