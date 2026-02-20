import { supabase } from '@/lib/supabase';
import { GameStats, PlayerStats, PlayerGameLog, VideoStats } from '@/types/stats';
import { getPlayerImageUrl } from '@/utils/playerUtils';

export class SupabaseStatsService {
    /**
     * Fetch all stats data from Supabase including games, player stats, and game logs
     */
    static async fetchAllStatsData(): Promise<{
        games: GameStats[];
        playerStats: PlayerStats[];
        gameLogs: PlayerGameLog[];
        videoStats: VideoStats[];
    }> {
        try {
            // 1. Fetch Games
            const { data: gamesData, error: gamesError } = await supabase
                .from('games')
                .select('*')
                .order('game_date', { ascending: false });

            if (gamesError) throw gamesError;

            // Map games to generic GameStats type
            const games: GameStats[] = (gamesData || []).map((game) => ({
                gameNumber: game.tsv_game_number ? parseInt(game.tsv_game_number) : parseInt(game.game_id), // Use TSV Game Number (1-N) if available, else Match ID
                date: game.game_date ? new Date(game.game_date).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : '',
                homeTeam: game.home_team_name,
                awayTeam: game.away_team_name,
                finalScore: game.home_score !== null && game.away_score !== null
                    ? `${game.home_score}:${game.away_score}`
                    : '-:-',
                q1Score: game.quarter_scores?.first_quarter_home !== undefined
                    ? `${game.quarter_scores.first_quarter_home}:${game.quarter_scores.first_quarter_away}`
                    : '-',
                halfTimeScore: game.quarter_scores?.halftime_home !== undefined
                    ? `${game.quarter_scores.halftime_home}:${game.quarter_scores.halftime_away}`
                    : '-',
                q3Score: game.quarter_scores?.third_quarter_home !== undefined
                    ? `${game.quarter_scores.third_quarter_home}:${game.quarter_scores.third_quarter_away}`
                    : '-',
                boxScoreUrl: game.box_score_url,
                gameId: game.game_id,
            }));

            // 1.5 Fetch Video Projects to populate video fields
            const { data: videoProjects, error: videoError } = await supabase
                .from('video_projects')
                .select('*');

            if (videoError) {
                console.warn('Error fetching video_projects:', videoError);
            } else if (videoProjects) {
                // Pre-group videos by game number for O(1) lookup
                const videosByGame = new Map<number, any[]>();
                videoProjects.forEach((vp: any) => {
                    // Ensure tsv_game_number is treated as number to match game.gameNumber
                    const gameNum = typeof vp.tsv_game_number === 'string'
                        ? parseInt(vp.tsv_game_number)
                        : vp.tsv_game_number;

                    if (!isNaN(gameNum)) {
                        if (!videosByGame.has(gameNum)) {
                            videosByGame.set(gameNum, []);
                        }
                        videosByGame.get(gameNum)!.push(vp);
                    }
                });

                // Map videos to games using the map
                games.forEach(game => {
                    const gameVideos = videosByGame.get(game.gameNumber);

                    if (gameVideos && gameVideos.length > 0) {
                        // Sort by video_index
                        gameVideos.sort((a: any, b: any) => a.video_index - b.video_index);

                        // Populate youtubeLink (backwards compatibility - use first video)
                        const firstVideo = gameVideos[0];
                        const firstLink = firstVideo.playlist_id
                            ? `https://www.youtube.com/watch?v=${firstVideo.video_id}&list=${firstVideo.playlist_id}`
                            : `https://www.youtube.com/watch?v=${firstVideo.video_id}`;

                        game.youtubeLink = firstLink;

                        // Populate youtubeLinks
                        game.youtubeLinks = gameVideos.map((vp: any) =>
                            vp.playlist_id
                                ? `https://www.youtube.com/watch?v=${vp.video_id}&list=${vp.playlist_id}`
                                : `https://www.youtube.com/watch?v=${vp.video_id}`
                        );

                        // Populate videoData
                        game.videoData = gameVideos.map((vp: any) => ({
                            link: vp.playlist_id
                                ? `https://www.youtube.com/watch?v=${vp.video_id}&list=${vp.playlist_id}`
                                : `https://www.youtube.com/watch?v=${vp.video_id}`,
                            events: vp.data?.events || [],
                            players: vp.data?.players || [],
                            videoIndex: vp.video_index,
                            metadata: vp.data?.metadata // Map metadata
                        }));
                    }
                });
            }

            // 2. Fetch Player Stats (Season Totals)
            // Using the view created in migration
            const { data: playersData, error: playersError } = await supabase
                .from('player_season_totals')
                .select('*');

            if (playersError) {
                // Fallback for when views might not exist yet or error out
                console.warn('Error fetching player_season_totals, returning empty stats', playersError);
            }

            const playerStats: PlayerStats[] = (playersData || []).map((p: any) => ({
                id: p.player_slug,
                firstName: p.first_name,
                lastName: p.last_name,
                imageUrl: getPlayerImageUrl(p.first_name, p.last_name),
                jerseyNumber: p.jersey_number,
                position: p.position,
                height: p.height,
                bio: p.bio,
                gamesPlayed: p.games_played,
                minutesPerGame: Number(p.minutes_per_game),
                pointsPerGame: Number(p.points_per_game),
                threePointersPerGame: Number(p.three_pointers_per_game),
                foulsPerGame: Number(p.fouls_per_game),
                freeThrowsMadePerGame: Number(p.free_throws_made_per_game),
                freeThrowAttemptsPerGame: Number(p.free_throw_attempts_per_game),
                freeThrowPercentage: p.free_throw_percentage,
                pointsPer40: Number(p.points_per_40),
                threePointersPer40: Number(p.three_pointers_per_40),
                foulsPer40: Number(p.fouls_per_40),
                birthDate: p.birth_date // Added birthDate mapping
            }));

            // 3. Fetch Game Logs
            const { data: logsData, error: logsError } = await supabase
                .from('player_game_logs')
                .select('*');

            if (logsError) {
                console.warn('Error fetching player_game_logs', logsError);
            }

            // Create a map of games by game_id for O(1) lookup
            const gamesById = new Map<string, any>();
            if (gamesData) {
                gamesData.forEach(game => {
                    gamesById.set(game.game_id, game);
                });
            }

            // We need to determine game type (Heim/Auswärts) which might be missing in view or needs join
            // For now we map what we have
            const gameLogs: PlayerGameLog[] = (logsData || []).map((log: any) => {
                // Try to find the game to determine home/away using the map
                const game = gamesById.get(log.game_id);
                const isHome = game?.home_team_name?.toLowerCase().includes('neuenstadt') ||
                    game?.home_team_name?.toLowerCase().includes('pitbulls');

                return {
                    playerId: log.player_slug,
                    gameNumber: game?.tsv_game_number ? parseInt(game.tsv_game_number) : parseInt(log.game_id),
                    minutesPlayed: log.minutes_played || 0,
                    points: log.points || 0,
                    twoPointers: log.two_pointers || 0,
                    threePointers: log.three_pointers || 0,
                    freeThrowsMade: log.free_throws_made || 0,
                    freeThrowAttempts: log.free_throw_attempts || 0,
                    freeThrowPercentage: log.free_throw_percentage || '0%',
                    fouls: log.fouls || 0,
                    pointsPer40: Number(log.points_per_40) || 0,
                    freeThrowAttemptsPer40: Number(log.free_throw_attempts_per_40) || 0,
                    foulsPer40: Number(log.fouls_per_40) || 0,
                    threePointersPer40: Number(log.three_pointers_per_40) || 0,
                    gameType: isHome ? 'Heim' : 'Auswärts'
                };
            });

            // 4. Fetch Video Stats (New)
            const { data: videoData, error: videoStatsError } = await supabase
                .from('player_video_stats')
                .select('*');

            if (videoStatsError) {
                console.warn('Error fetching player_video_stats', videoStatsError);
            }

            const videoStats: VideoStats[] = (videoData || []).map((v: any) => ({
                id: v.id,
                playerId: v.player_id,
                gameNumber: v.game_number,
                twoPointersMade: v.two_pointers_made,
                twoPointersAttempted: v.two_pointers_attempted,
                threePointersMade: v.three_pointers_made,
                threePointersAttempted: v.three_pointers_attempted,
                steals: v.steals,
                blocks: v.blocks,
                assists: v.assists,
                rebounds: v.rebounds,
                turnovers: v.turnovers
            }));

            return {
                games,
                playerStats,
                gameLogs,
                videoStats
            };

        } catch (error) {
            console.error('Error in fetchAllStatsData:', error);
            throw error;
        }
    }

    /**
     * Save video stats to the database (Upsert)
     */
    static async saveVideoStats(stats: VideoStats[]): Promise<void> {
        try {
            // Transform to snake_case for Supabase
            const dbStats = stats.map(s => ({
                player_id: s.playerId,
                game_number: s.gameNumber,
                two_pointers_made: s.twoPointersMade,
                two_pointers_attempted: s.twoPointersAttempted,
                three_pointers_made: s.threePointersMade,
                three_pointers_attempted: s.threePointersAttempted,
                steals: s.steals,
                blocks: s.blocks,
                assists: s.assists,
                rebounds: s.rebounds,
                turnovers: s.turnovers
            }));

            const { error } = await supabase
                .from('player_video_stats')
                .upsert(dbStats, { onConflict: 'player_id, game_number' });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving video stats:', error);
            throw error;
        }
    }
}
