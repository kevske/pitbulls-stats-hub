import { supabase } from '@/lib/supabase';
import { GameStats, PlayerStats, PlayerGameLog } from '@/types/stats';
import { getPlayerImageUrl } from '@/utils/playerUtils';

export class SupabaseStatsService {
    /**
     * Fetch all stats data from Supabase including games, player stats, and game logs
     */
    static async fetchAllStatsData(): Promise<{
        games: GameStats[];
        playerStats: PlayerStats[];
        gameLogs: PlayerGameLog[];
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
                // youtubeLink/videoData would need separate fetching or column if they exist
            }));

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
                foulsPer40: Number(p.fouls_per_40)
            }));

            // 3. Fetch Game Logs
            const { data: logsData, error: logsError } = await supabase
                .from('player_game_logs')
                .select('*');

            if (logsError) {
                console.warn('Error fetching player_game_logs', logsError);
            }

            // We need to determine game type (Heim/Auswärts) which might be missing in view or needs join
            // For now we map what we have
            const gameLogs: PlayerGameLog[] = (logsData || []).map((log: any) => {
                // Try to find the game to determine home/away
                const game = gamesData?.find(g => g.game_id === log.game_id);
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

            return {
                games,
                playerStats,
                gameLogs
            };

        } catch (error) {
            console.error('Error in fetchAllStatsData:', error);
            throw error;
        }
    }
}
