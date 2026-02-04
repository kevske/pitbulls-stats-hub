import { supabase } from '@/lib/supabase';
import { Game } from '@/types/supabase';
import { addDays, isAfter, subDays } from 'date-fns';
import { getPlayerImageUrl } from '@/utils/playerUtils';

export interface LeagueNewsItem {
    id: string;
    type: 'upset' | 'streak' | 'high_score';
    date: string;
    title: string;
    description: string;
    gameId: string;
    teamId: string;
    relevanceScore: number;
}

export interface PlayerNewsItem {
    id: string;
    type: 'points' | 'three_pointers' | 'free_throws' | 'double_double';
    date: string;
    playerName: string;
    playerSlug: string;
    description: string;
    statValue: number;
    seasonAverage: number;
    gameId: string;
    relevanceScore: number;
    teamId: string;
    teamName: string;
    playerImage?: string;
}

export class NewsService {
    /**
     * Get unexpected league results from the last 14 days
     */
    static async getLeagueNews(): Promise<LeagueNewsItem[]> {
        try {
            // 1. Fetch all games to calculate standings/win-rates
            const { data: allGames, error: gamesError } = await supabase
                .from('games')
                .select('*')
                .not('home_score', 'is', null)
                .order('game_date', { ascending: false });

            if (gamesError) throw gamesError;

            if (!allGames || allGames.length === 0) return [];

            // Calculate win rates for all teams
            const teamStats = new Map<string, { wins: number; games: number; winRate: number; name: string }>();

            allGames.forEach(game => {
                if (game.home_score === null || game.away_score === null) return;

                // Init home team
                if (!teamStats.has(game.home_team_id)) {
                    teamStats.set(game.home_team_id, { wins: 0, games: 0, winRate: 0, name: game.home_team_name });
                }
                const homeStats = teamStats.get(game.home_team_id)!;
                homeStats.games++;
                if (game.home_score > game.away_score) homeStats.wins++;

                // Init away team
                if (!teamStats.has(game.away_team_id)) {
                    teamStats.set(game.away_team_id, { wins: 0, games: 0, winRate: 0, name: game.away_team_name });
                }
                const awayStats = teamStats.get(game.away_team_id)!;
                awayStats.games++;
                if (game.away_score > game.home_score) awayStats.wins++;
            });

            // Calculate final win rates
            teamStats.forEach(stat => {
                stat.winRate = stat.games > 0 ? stat.wins / stat.games : 0;
            });

            // 2. Identify upsets in the last 90 days (previously 14)
            const lookbackDate = subDays(new Date(), 90);
            const recentGames = allGames.filter(game => isAfter(new Date(game.game_date), lookbackDate));

            const newsItems: LeagueNewsItem[] = [];

            recentGames.forEach(game => {
                if (game.home_score === null || game.away_score === null) return;

                const homeTeam = teamStats.get(game.home_team_id);
                const awayTeam = teamStats.get(game.away_team_id);

                if (!homeTeam || !awayTeam) return;

                // Skip if teams have played too few games for reliable stats
                if (homeTeam.games < 3 || awayTeam.games < 3) return;

                const winner = game.home_score > game.away_score ? homeTeam : awayTeam;
                const loser = game.home_score > game.away_score ? awayTeam : homeTeam;
                const scoreString = `${game.home_score}:${game.away_score}`;

                // Definition of "Unexpected": Winner has significantly lower win rate (>= 20% difference)
                const winRateDiff = loser.winRate - winner.winRate;

                if (winRateDiff >= 0.20) {
                    newsItems.push({
                        id: `upset-${game.game_id}`,
                        type: 'upset',
                        date: game.game_date,
                        gameId: game.game_id,
                        teamId: winner === homeTeam ? game.home_team_id : game.away_team_id,
                        title: `Überraschungssieg: ${winner.name} besiegt ${loser.name}`,
                        description: `${winner.name} (Siegquote ${(winner.winRate * 100).toFixed(0)}%) gewinnt überraschend gegen ${loser.name} (Siegquote ${(loser.winRate * 100).toFixed(0)}%) mit ${scoreString}.`,
                        relevanceScore: winRateDiff * 100 // Higher difference = more relevant
                    });
                }
            });

            return newsItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } catch (error) {
            console.error('Error fetching league news:', error);
            return [];
        }
    }

    /**
     * Get extraordinary player stats from the last 14 days
     */
    static async getPlayerNews(): Promise<PlayerNewsItem[]> {
        try {
            // 1. Fetch season stats (averages) from view or calculation
            const { data: seasonStats, error: seasonError } = await supabase
                .from('player_season_totals')
                .select('*');

            if (seasonError) throw seasonError;

            const playerAverages = new Map<string, any>();
            seasonStats?.forEach(stat => {
                playerAverages.set(stat.player_slug, stat);
            });

            // 2. Fetch recent box scores (last 90 days)
            const lookbackDate = subDays(new Date(), 90);
            const { data: recentBoxScores, error: boxScoreError } = await supabase
                .from('box_scores')
                .select('*, games!inner(*)') // Join with games to get date
                .gte('games.game_date', lookbackDate.toISOString())
                .order('scraped_at', { ascending: false });

            if (boxScoreError) throw boxScoreError;

            const newsItems: PlayerNewsItem[] = [];

            recentBoxScores?.forEach(score => {
                const avg = playerAverages.get(score.player_slug);
                const isPitbull = !!avg; // Assuming we only have averages for our own players

                // Effective Team ID for filtering
                // If it's our player, force the ID to 'tsv-neuenstadt' to match the filter
                // Otherwise keep original or use 'opponent'
                const effectiveTeamId = isPitbull ? 'tsv-neuenstadt' : (score.team_id || 'opponent');

                const gameDate = score.games?.game_date || score.scraped_at;
                const playerName = `${score.player_first_name} ${score.player_last_name}`;

                // Determine Team Name
                let teamName = 'Unbekanntes Team';
                if (score.games) {
                    if (score.team_id === score.games.home_team_id) {
                        teamName = score.games.home_team_name;
                    } else if (score.team_id === score.games.away_team_id) {
                        teamName = score.games.away_team_name;
                    }
                }
                // Override for Pitbulls
                if (isPitbull) {
                    teamName = 'Pitbulls Neuenstadt';
                }

                // Get player image for Pitbulls
                let playerImage: string | undefined;
                if (isPitbull) {
                    playerImage = getPlayerImageUrl(score.player_first_name, score.player_last_name);
                }

                // --- LOGIC FOR PITBULLS (Relative + Absolute) ---
                if (isPitbull) {
                    // Criteria 1: Points explosion (>20 pts AND >1.5x average)
                    if (score.points >= 20 && score.points >= (avg.points_per_game * 1.5)) {
                        newsItems.push({
                            id: `pts-${score.id}`,
                            type: 'points',
                            date: gameDate,
                            playerName: playerName,
                            playerSlug: score.player_slug,
                            gameId: score.game_id,
                            description: `${playerName} erzielt ${score.points} Punkte`,
                            statValue: score.points,
                            seasonAverage: Number(avg.points_per_game),
                            relevanceScore: score.points,
                            teamId: effectiveTeamId,
                            teamName: teamName,
                            playerImage: playerImage
                        });
                    }

                    // Criteria 2: 3-Point Rain (>= 4 made AND > 30% above average)
                    const threePointThreshold = avg.three_pointers_per_game ? (avg.three_pointers_per_game * 1.3) : 0;
                    if (score.three_pointers >= 4 && score.three_pointers > threePointThreshold) {
                        newsItems.push({
                            id: `3pt-${score.id}`,
                            type: 'three_pointers',
                            date: gameDate,
                            playerName: playerName,
                            playerSlug: score.player_slug,
                            gameId: score.game_id,
                            description: `${playerName} trifft ${score.three_pointers} Dreier`,
                            statValue: score.three_pointers,
                            seasonAverage: Number(avg.three_pointers_per_game),
                            relevanceScore: score.three_pointers * 3,
                            teamId: effectiveTeamId,
                            teamName: teamName,
                            playerImage: playerImage
                        });
                    }

                    // Criteria 3: Free Throw Machine (>= 8 made, high %)
                    if (score.free_throws_made >= 8 && (score.free_throws_made / score.free_throw_attempts >= 0.8)) {
                        newsItems.push({
                            id: `ft-${score.id}`,
                            type: 'free_throws',
                            date: gameDate,
                            playerName: playerName,
                            playerSlug: score.player_slug,
                            gameId: score.game_id,
                            description: `${playerName} verwandelt ${score.free_throws_made}/${score.free_throw_attempts} Freiwürfe`,
                            statValue: score.free_throws_made,
                            seasonAverage: Number(avg.free_throws_made_per_game),
                            relevanceScore: score.free_throws_made * 1.5,
                            teamId: effectiveTeamId,
                            teamName: teamName,
                            playerImage: playerImage
                        });
                    }
                }
                // --- LOGIC FOR OPPONENTS (Absolute Only) ---
                else {
                    // Criteria 1: High Scoring (>= 25 pts)
                    if (score.points >= 25) {
                        newsItems.push({
                            id: `pts-${score.id}`,
                            type: 'points',
                            date: gameDate,
                            playerName: playerName,
                            playerSlug: score.player_slug,
                            gameId: score.game_id,
                            description: `${playerName} erzielt ${score.points} Punkte`,
                            statValue: score.points,
                            seasonAverage: 0, // No average available
                            relevanceScore: score.points * 0.9, // Slightly lower relevance for opponents
                            teamId: effectiveTeamId,
                            teamName: teamName
                        });
                    }

                    // Criteria 2: 3-Point Rain (>= 5 made) - Higher threshold for opponents
                    if (score.three_pointers >= 5) {
                        newsItems.push({
                            id: `3pt-${score.id}`,
                            type: 'three_pointers',
                            date: gameDate,
                            playerName: playerName,
                            playerSlug: score.player_slug,
                            gameId: score.game_id,
                            description: `${playerName} trifft ${score.three_pointers} Dreier`,
                            statValue: score.three_pointers,
                            seasonAverage: 0,
                            relevanceScore: score.three_pointers * 3,
                            teamId: effectiveTeamId,
                            teamName: teamName
                        });
                    }

                    // Criteria 3: Free Throws (>= 10 made)
                    if (score.free_throws_made >= 10) {
                        newsItems.push({
                            id: `ft-${score.id}`,
                            type: 'free_throws',
                            date: gameDate,
                            playerName: playerName,
                            playerSlug: score.player_slug,
                            gameId: score.game_id,
                            description: `${playerName} verwandelt ${score.free_throws_made}/${score.free_throw_attempts} Freiwürfe`,
                            statValue: score.free_throws_made,
                            seasonAverage: 0,
                            relevanceScore: score.free_throws_made * 1.5,
                            teamId: effectiveTeamId,
                            teamName: teamName
                        });
                    }
                }
            });

            // Filter duplicates (e.g. if a player had points AND 3 pointers, maybe just show the most impressive one? 
            // For now, let's just show all distinct achievements but maybe sort primarily by date)

            return newsItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        } catch (error) {
            console.error('Error fetching player news:', error);
            return [];
        }
    }
}
