import { supabase } from '@/lib/supabase';
import { Player, TaggedEvent } from '@/types/basketball';
import { SaveData } from '@/types/video';

// Re-export SaveData for backward compatibility with imports from this file
export type { SaveData };

export interface VideoProjectData {
    items: {
        events: TaggedEvent[];
        players: Player[];
        metadata?: unknown;
    }
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
    static async saveProject(data: SaveData, adminPassword?: string): Promise<string | null> {
        try {
            // Use Edge Function if password is provided (secure way)
            if (adminPassword) {
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                const response = await fetch(`${supabaseUrl}/functions/v1/admin-manage-videos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseAnonKey}`
                    },
                    body: JSON.stringify({
                        action: 'save_project',
                        payload: data,
                        adminPassword
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    console.error('Edge function error:', result);
                    throw new Error(result.message || result.error || 'Failed to save video project');
                }

                return result.id;
            }

            // Fallback for public access (will fail if RLS is locked down and public write is disabled)
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
                game_number: gameNumber.toString(), // Add game_number for NOT NULL constraint
                tsv_game_number: gameNumber, // Use TSV_game_number directly
                video_index: videoIndex,
                video_id: videoId,
                playlist_id: playlistId || null,
                data: projectData,
                updated_at: new Date().toISOString()
            };

            // Upsert: Try to update if exists, otherwise insert
            // We rely on the UNIQUE constraint on (tsv_game_number, video_index)
            const { data: savedProject, error } = await supabase
                .from('video_projects')
                .upsert(payload, {
                    onConflict: 'tsv_game_number,video_index',
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
    static async loadProject(gameNumber: number, videoIndex: number): Promise<SaveData | null> {
        try {
            const { data: project, error } = await supabase
                .from('video_projects')
                .select('*')
                .eq('tsv_game_number', gameNumber)
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
                gameNumber: project.tsv_game_number,
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
    static async getProjectMeta(gameNumber: number, videoIndex: number): Promise<{ lastModified: string, id: string } | null> {
        try {
            const { data, error } = await supabase
                .from('video_projects')
                .select('id, updated_at')
                .eq('tsv_game_number', gameNumber)
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
    static async getProjectsForGame(gameNumber: number): Promise<VideoProject[]> {
        const { data, error } = await supabase
            .from('video_projects')
            .select('*')
            .eq('tsv_game_number', gameNumber) // Use TSV_game_number
            .order('video_index', { ascending: true });

        if (error) {
            console.error('Error fetching projects for game:', error);
            return [];
        }

        // Transform the data to match VideoProject interface
        return data.map(project => ({
            id: project.id,
            game_number: project.tsv_game_number?.toString() || '',
            video_index: project.video_index,
            video_id: project.video_id,
            playlist_id: project.playlist_id,
            data: project.data,
            created_at: project.created_at,
            updated_at: project.updated_at
        }));
    }

    /**
     * Add a simple video entry (no events/players data initially) to link a video to a game
     */
    static async addVideoToGame(gameNumber: number, videoId: string, playlistId?: string, adminPassword?: string): Promise<string | null> {
        // First, get existing videos for this game to determine the next index
        const existingProjects = await this.getProjectsForGame(gameNumber);
        const nextIndex = existingProjects.length; // Use the length as the next index

        return this.saveProject({
            gameNumber, // This should now be the TSV_game_number
            videoIndex: nextIndex,
            videoId,
            playlistId,
            events: [],
            players: [],
            timestamp: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            version: '1.0.0',
            metadata: {
                source: 'StatsHub Admin',
                addedAt: new Date().toISOString(),
                note: 'Using TSV_game_number for consistent numbering'
            }
        }, adminPassword);
    }
}
