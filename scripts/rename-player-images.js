import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const playersDir = path.join(__dirname, '..', 'public', 'players');

// Read all files in the players directory
fs.readdir(playersDir, (err, files) => {
  if (err) {
    console.error('Error reading players directory:', err);
    return;
  }

  // Filter for image files
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  });

  console.log('Found', imageFiles.length, 'image files');
  console.log('Renaming files...\n');

  // Process each file
  imageFiles.forEach(oldFileName => {
    // Skip if already in correct format
    if (oldFileName === 'stefan-anselm.jpg') {
      console.log(`Skipping (already correct): ${oldFileName}`);
      return;
    }

    // Remove file extension and convert to lowercase
    const baseName = path.basename(oldFileName, path.extname(oldFileName));
    
    // Convert to firstname-lastname format
    let newBaseName = baseName
      .toLowerCase()
      // Remove jersey number prefixes like "11_PC_"
      .replace(/^\d+_pc_/i, '')
      // Replace spaces and dots with hyphens
      .replace(/[\s.]+/g, '-')
      // Remove any remaining non-alphanumeric characters except hyphens
      .replace(/[^a-z0-9-]/g, '')
      // Replace multiple hyphens with a single one
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '');

    // Add .jpg extension
    const newFileName = `${newBaseName}.jpg`;
    
    // Skip if filename wouldn't change
    if (oldFileName.toLowerCase() === newFileName.toLowerCase()) {
      console.log(`No change needed: ${oldFileName}`);
      return;
    }

    const oldPath = path.join(playersDir, oldFileName);
    const newPath = path.join(playersDir, newFileName);

    // Rename the file
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        console.error(`Error renaming ${oldFileName} to ${newFileName}:`, err);
      } else {
        console.log(`Renamed: ${oldFileName} -> ${newFileName}`);
      }
    });
  });
});
