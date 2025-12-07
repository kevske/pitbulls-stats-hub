import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const playersDir = path.join(__dirname, '../public/players');
const outputFile = path.join(__dirname, '../src/data/playerImages.json');

// Image extensions to include
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Files to exclude (profile pictures)
const excludeFiles = ['profile.jpg', 'profile.jpeg', 'profile.png', 'profile.gif', 'profile.webp'];

function scanPlayerImages() {
  const playerImages = {};
  
  try {
    // Check if players directory exists
    if (!fs.existsSync(playersDir)) {
      console.error('Players directory not found:', playersDir);
      return;
    }
    
    // Get all player directories
    const playerDirs = fs.readdirSync(playersDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    console.log(`Found ${playerDirs.length} player directories`);
    
    // Scan each player directory for images
    playerDirs.forEach(playerSlug => {
      const playerPath = path.join(playersDir, playerSlug);
      const images = [];
      
      try {
        const files = fs.readdirSync(playerPath);
        
        files.forEach(file => {
          const ext = path.extname(file).toLowerCase();
          const fileName = file.toLowerCase();
          
          // Only include image files and exclude profile pictures
          if (imageExtensions.includes(ext) && !excludeFiles.includes(fileName)) {
            // Add the full path that will be used in the app
            const imagePath = `/pitbulls-stats-hub/players/${playerSlug}/${file}`;
            images.push({
              src: imagePath,
              alt: `${playerSlug.replace(/-/g, ' ')} - ${file}`,
              filename: file
            });
          }
        });
        
        // Sort images by filename for consistent ordering
        images.sort((a, b) => a.filename.localeCompare(b.filename));
        
        if (images.length > 0) {
          playerImages[playerSlug] = images;
          console.log(`Found ${images.length} images for ${playerSlug}`);
        } else {
          console.log(`No gallery images found for ${playerSlug}`);
        }
        
      } catch (error) {
        console.error(`Error scanning directory ${playerPath}:`, error);
      }
    });
    
    // Write the results to JSON file
    const jsonData = JSON.stringify(playerImages, null, 2);
    fs.writeFileSync(outputFile, jsonData);
    
    console.log(`\nGenerated image data for ${Object.keys(playerImages).length} players`);
    console.log(`Output written to: ${outputFile}`);
    
    // Print summary
    Object.entries(playerImages).forEach(([player, images]) => {
      console.log(`  ${player}: ${images.length} images`);
    });
    
  } catch (error) {
    console.error('Error scanning player images:', error);
  }
}

// Run the script
scanPlayerImages();
