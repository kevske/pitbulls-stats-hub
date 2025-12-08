
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Disable cache to prevent file locking issues on Windows
sharp.cache(false);

const MAX_SIZE_BYTES = 250 * 1024; // 250 KB
const MAX_WIDTH = 1920;
const TARGET_DIRS = [
    path.join(__dirname, '../public/photos'),
    path.join(__dirname, '../public/players')
];

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

async function optimizeImage(filePath) {
    const filename = path.basename(filePath);
    const stats = fs.statSync(filePath);

    if (stats.size <= MAX_SIZE_BYTES) {
        // console.log(`Skipping ${filename} (Size: ${formatBytes(stats.size)} is within limit)`);
        return;
    }

    console.log(`Optimizing ${filename} (Original: ${formatBytes(stats.size)})...`);

    try {
        // Read file to buffer first to avoid file locking on the source file
        const inputBuffer = fs.readFileSync(filePath);

        // Create sharp instance from buffer
        const image = sharp(inputBuffer);
        const metadata = await image.metadata();

        let pipeline = image;

        // Resize if too wide
        if (metadata.width > MAX_WIDTH) {
            pipeline = pipeline.resize(MAX_WIDTH);
        }

        // Initial attempt with high quality
        let quality = 80;
        let buffer = await pipeline
            .jpeg({ quality, mozjpeg: true })
            .toBuffer();

        // If still too big, reduce quality iteratively
        while (buffer.length > MAX_SIZE_BYTES && quality > 10) {
            quality -= 10;
            buffer = await pipeline
                .jpeg({ quality, mozjpeg: true })
                .toBuffer();
        }

        if (buffer.length > MAX_SIZE_BYTES) {
            console.warn(`⚠️  Warning: Could not compress ${filename} below target size. Current: ${formatBytes(buffer.length)}`);
        }

        // Direct overwrite should work now as we hold no handle on filePath
        try {
            fs.writeFileSync(filePath, buffer);
            console.log(`✅ ${filename} optimized to ${formatBytes(buffer.length)} (Quality: ${quality})`);
        } catch (writeError) {
            console.error(`❌ Error writing file ${filename}:`, writeError);
        }

    } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error);
    }
}

async function scanDirectory(dir) {
    if (!fs.existsSync(dir)) {
        console.warn(`Directory not found: ${dir}`);
        return;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            await scanDirectory(fullPath);
        } else if (file.match(/\.(jpg|jpeg|png)$/i)) {
            await optimizeImage(fullPath);
        }
    }
}

async function main() {
    console.log('Starting image optimization...');
    console.log(`Target: Max ${formatBytes(MAX_SIZE_BYTES)}, Max Width ${MAX_WIDTH}px`);

    for (const dir of TARGET_DIRS) {
        console.log(`Scanning ${dir}...`);
        await scanDirectory(dir);
    }

    console.log('Optimization complete.');
}

main();
