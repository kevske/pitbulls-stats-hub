import { VideoProjectService, SaveData } from './videoProjectService';

const JSONBIN_API_KEY = import.meta.env.VITE_JSONBIN_API_KEY;
const MASTER_BIN_ID = '693897a8ae596e708f8ea7c2';
const BASE_URL = 'https://api.jsonbin.io/v3';

interface MasterBinData {
    games: Record<string, Record<string, { binId: string } | string>>;
}

export class MigrationService {
    private static getHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-Master-Key': JSONBIN_API_KEY
        };
    }

    static async migrateAllData(onProgress?: (message: string) => void) {
        if (!JSONBIN_API_KEY) {
            throw new Error('VITE_JSONBIN_API_KEY is missing');
        }

        try {
            onProgress?.('Fetching MasterBin...');
            const masterBinResponse = await fetch(`${BASE_URL}/b/${MASTER_BIN_ID}/latest`, {
                headers: this.getHeaders()
            });

            if (!masterBinResponse.ok) {
                throw new Error(`Failed to fetch MasterBin: ${masterBinResponse.statusText}`);
            }

            const masterJson = await masterBinResponse.json();
            const masterData = masterJson.record as MasterBinData;

            if (!masterData.games) {
                onProgress?.('No games found in MasterBin.');
                return;
            }

            let totalSuccess = 0;
            let totalFail = 0;

            for (const [gameNum, videos] of Object.entries(masterData.games)) {
                for (const [videoIdx, entry] of Object.entries(videos)) {
                    const binId = typeof entry === 'string' ? entry : entry.binId;

                    try {
                        onProgress?.(`Migrating Game ${gameNum} - Video ${videoIdx} (Bin: ${binId})...`);

                        // 1. Fetch individual bin data
                        const binResponse = await fetch(`${BASE_URL}/b/${binId}/latest`, {
                            headers: this.getHeaders()
                        });

                        if (!binResponse.ok) {
                            console.error(`Failed to fetch bin ${binId}`);
                            totalFail++;
                            continue;
                        }

                        const binJson = await binResponse.json();
                        const record = binJson.record;

                        // 2. Normalize data for SaveData interface
                        // JSONBin records might vary slightly, ensuring we have required fields
                        const saveData: SaveData = {
                            gameNumber: parseInt(gameNum),
                            videoIndex: parseInt(videoIdx),
                            events: record.events || [],
                            players: record.players || [],
                            videoId: record.videoId || '',
                            playlistId: record.playlistId,
                            timestamp: record.timestamp || new Date().toISOString(),
                            lastModified: record.lastModified || record.timestamp || new Date().toISOString(),
                            metadata: record.metadata
                        };

                        // 3. Save to Supabase using the new service
                        const savedId = await VideoProjectService.saveProject(saveData);

                        if (savedId) {
                            totalSuccess++;
                            onProgress?.(`✓ Success: Game ${gameNum} Video ${videoIdx}`);
                        } else {
                            totalFail++;
                            onProgress?.(`✗ Failed to save to Supabase: Game ${gameNum} Video ${videoIdx}`);
                        }

                    } catch (error) {
                        console.error(`Error migrating Game ${gameNum} Video ${videoIdx}:`, error);
                        totalFail++;
                        onProgress?.(`✗ Error: Game ${gameNum} Video ${videoIdx}`);
                    }
                }
            }

            onProgress?.(`Migration Complete. Success: ${totalSuccess}, Failed: ${totalFail}`);
            return { totalSuccess, totalFail };

        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    }
}
