import { supabase } from '@/lib/supabase';
import { Player, TaggedEvent } from '@/types/basketball';

export interface VideoProjectData {
    items: {
        events: TaggedEvent[];
        players: Player[];
        metadata?: any;
    }
}

export interface SaveData {
    gameNumber: number;
    videoIndex: number;
    events: TaggedEvent[];
    players: Player[];
    videoId: string;
    playlistId?: string;
    timestamp: string;
    lastModified: string;
    metadata?: any;
    version: string; // Required for compatibility with saveLoad.ts
}

export interface VideoProject {
    id: string;
    game_number: string;
    video_index: number;
    video_id: string;
    playlist_id?: string;
    data: VideoProjectData['items'];
    created_at: string;
    updated_at: string;
}

export class VideoProjectService {
    /**
     * Save a video project to Supabase
     */
    static async saveProject(data: SaveData): Promise<string | null> {
        try {
            const {
                gameNumber,
                videoIndex,
                videoId,
                playlistId,
                events,
                players,
                metadata
            } = data;

            const projectData = {
                events,
                players,
                metadata
            };

            const payload = {
                game_number: gameNumber.toString(),
                video_index: videoIndex,
                video_id: videoId,
                playlist_id: playlistId || null,
                data: projectData,
                updated_at: new Date().toISOString()
            };

            // Upsert: Try to update if exists, otherwise insert
            // We rely on the UNIQUE constraint on (game_number, video_index)
            const { data: savedProject, error } = await supabase
                .from('video_projects')
                .upsert(payload, {
                    onConflict: 'game_number,video_index',
                    ignoreDuplicates: false
                })
                .select()
                .single();

            if (error) {
                console.error('Error saving video project:', error);
                throw error;
            }

            return savedProject.id;
        } catch (error) {
            console.error('VideoProjectService.saveProject error:', error);
            return null;
        }
    }

    /**
     * Load a video project from Supabase
     */
    static async loadProject(gameNumber: string, videoIndex: number): Promise<SaveData | null> {
        try {
            const { data: project, error } = await supabase
                .from('video_projects')
                .select('*')
                .eq('game_number', gameNumber)
                .eq('video_index', videoIndex)
                .single();

            if (error) {
                // PERGRHAPS: Handle "PGRST116" (no rows found) gracefully
                if (error.code === 'PGRST116') {
                    return null;
                }
                console.error('Error loading video project:', error);
                throw error;
            }

            if (!project) return null;

            const projectData = project.data as VideoProjectData['items'];

            return {
                gameNumber: parseInt(project.game_number),
                videoIndex: project.video_index,
                videoId: project.video_id,
                playlistId: project.playlist_id,
                events: projectData.events || [],
                players: projectData.players || [],
                metadata: projectData.metadata,
                timestamp: project.created_at,
                lastModified: project.updated_at,
                version: '1.0.0' // Set default version
            };
        } catch (error) {
            console.error('VideoProjectService.loadProject error:', error);
            return null;
        }
    }

    /**
     * Get metadata info for a project (lightweight load)
     */
    static async getProjectMeta(gameNumber: string, videoIndex: number): Promise<{ lastModified: string, id: string } | null> {
        try {
            const { data, error } = await supabase
                .from('video_projects')
                .select('id, updated_at')
                .eq('game_number', gameNumber)
                .eq('video_index', videoIndex)
                .single();

            if (error || !data) return null;

            return {
                id: data.id,
                lastModified: data.updated_at
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Get all video projects for a specific game
     */
    static async getProjectsForGame(gameNumber: string): Promise<VideoProject[]> {
        try {
            const { data, error } = await supabase
                .from('video_projects')
                .select('*')
                .eq('game_number', gameNumber)
                .order('video_index', { ascending: true });

            if (error) throw error;

            return data.map(item => ({
                ...item,
                data: item.data
            })) as VideoProject[];
        } catch (error) {
            console.error('VideoProjectService.getProjectsForGame error:', error);
            return [];
        }
    }

    /**
     * Add a simple video entry (no events/players data initially) to link a video to a game
     */
    static async addVideoToGame(gameNumber: number, videoId: string, playlistId?: string): Promise<string | null> {
        return this.saveProject({
            gameNumber,
            videoIndex: 0, // Default to 0, assuming 1 video per game for this use case
            videoId,
            playlistId,
            events: [],
            players: [],
            timestamp: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            version: '1.0.0',
            metadata: {
                source: 'StatsHub Admin',
                addedAt: new Date().toISOString()
            }
        });
    }
}
