import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Game, DangerousPlayer, GameWithDangerousPlayers, BoxScore } from '@/types/supabase';
import { addDays } from 'date-fns';
import { selectTop3DangerousPlayers } from '@/utils/spielplanUtils';

export const useSpielplanData = () => {
    const [games, setGames] = useState<GameWithDangerousPlayers[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [leagueComparisons, setLeagueComparisons] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        fetchGamesAndDangerousPlayers();
    }, []);

    const getLeagueComparisonInfo = async (opponentTeamId: string, opponentTeamName: string) => {
        try {
            // Fetch all games with scores to calculate team statistics
            const { data: allGames, error: gamesError } = await supabase
                .from('games')
                .select('*')
                .not('home_score', 'is', null)
                .not('away_score', 'is', null)
                .order('game_date', { ascending: false });

            if (gamesError || !allGames || allGames.length === 0) {
                return null;
            }

            // Calculate team statistics from game data
            const teamStats = new Map<string, { pointsFor: number; pointsAgainst: number; games: number; wins: number; losses: number }>();

            allGames.forEach(game => {
                if (game.home_score && game.away_score) {
                    // Home team stats
                    const homeStats = teamStats.get(game.home_team_id) || { pointsFor: 0, pointsAgainst: 0, games: 0, wins: 0, losses: 0 };
                    homeStats.pointsFor += game.home_score;
                    homeStats.pointsAgainst += game.away_score;
                    homeStats.games += 1;
                    if (game.home_score > game.away_score) homeStats.wins += 1;
                    else homeStats.losses += 1;
                    teamStats.set(game.home_team_id, homeStats);

                    // Away team stats
                    const awayStats = teamStats.get(game.away_team_id) || { pointsFor: 0, pointsAgainst: 0, games: 0, wins: 0, losses: 0 };
                    awayStats.pointsFor += game.away_score;
                    awayStats.pointsAgainst += game.home_score;
                    awayStats.games += 1;
                    if (game.away_score > game.home_score) awayStats.wins += 1;
                    else awayStats.losses += 1;
                    teamStats.set(game.away_team_id, awayStats);
                }
            });

            // Find opponent team stats
            const opponentStats = teamStats.get(opponentTeamId);
            if (!opponentStats || opponentStats.games < 3) {
                return null;
            }

            // Calculate league averages (only include teams with 3+ games)
            const qualifiedTeams = Array.from(teamStats.values()).filter(stats => stats.games >= 3);
            if (qualifiedTeams.length < 2) {
                return null;
            }

            const avgPointsFor = qualifiedTeams.reduce((sum, stats) => sum + (stats.pointsFor / stats.games), 0) / qualifiedTeams.length;
            const avgPointsAgainst = qualifiedTeams.reduce((sum, stats) => sum + (stats.pointsAgainst / stats.games), 0) / qualifiedTeams.length;

            // Find league leaders
            const pointsLeader = Array.from(teamStats.entries()).reduce((max, [teamId, stats]) => {
                const avgPoints = stats.pointsFor / stats.games;
                const maxAvgPoints = max[1].pointsFor / max[1].games;
                return avgPoints > maxAvgPoints ? [teamId, stats] : max;
            });

            const defenseLeader = Array.from(teamStats.entries()).reduce((min, [teamId, stats]) => {
                const avgPointsAgainst = stats.pointsAgainst / stats.games;
                const minAvgPointsAgainst = min[1].pointsAgainst / min[1].games;
                return avgPointsAgainst < minAvgPointsAgainst ? [teamId, stats] : min;
            });

            const insights: string[] = [];

            // Calculate opponent averages
            const opponentAvgPointsFor = opponentStats.pointsFor / opponentStats.games;
            const opponentAvgPointsAgainst = opponentStats.pointsAgainst / opponentStats.games;

            // Check if opponent leads league in scoring
            if (opponentTeamId === pointsLeader[0]) {
                insights.push(`${opponentTeamName} führt die Liga mit ${opponentAvgPointsFor.toFixed(1)} Punkten pro Spiel`);
            }

            // Check if opponent leads league in defense
            if (opponentTeamId === defenseLeader[0]) {
                insights.push(`${opponentTeamName} hat die beste Defense mit nur ${opponentAvgPointsAgainst.toFixed(1)} Gegnerpunkten pro Spiel`);
            }

            // Check if opponent is significantly above/below league averages
            const pointsForPercentage = ((opponentAvgPointsFor - avgPointsFor) / avgPointsFor) * 100;
            const pointsAgainstPercentage = ((opponentAvgPointsAgainst - avgPointsAgainst) / avgPointsAgainst) * 100;

            if (Math.abs(pointsForPercentage) > 15) {
                if (pointsForPercentage > 0) {
                    insights.push(`${opponentTeamName} scoret ${Math.abs(Math.round(pointsForPercentage))}% mehr als der Ligadurchschnitt`);
                } else {
                    insights.push(`${opponentTeamName} scoret ${Math.abs(Math.round(pointsForPercentage))}% weniger als der Ligadurchschnitt`);
                }
            }

            if (Math.abs(pointsAgainstPercentage) > 15) {
                if (pointsAgainstPercentage < 0) {
                    insights.push(`${opponentTeamName} erlaubt ${Math.abs(Math.round(pointsAgainstPercentage))}% weniger Punkte als der Ligadurchschnitt`);
                } else {
                    insights.push(`${opponentTeamName} erlaubt ${Math.abs(Math.round(pointsAgainstPercentage))}% mehr Punkte als der Ligadurchschnitt`);
                }
            }

            // Check win percentage
            const winPercentage = (opponentStats.wins / opponentStats.games) * 100;
            if (winPercentage >= 75) {
                insights.push(`${opponentTeamName} hat eine Siegquote von ${Math.round(winPercentage)}%`);
            } else if (winPercentage <= 25) {
                insights.push(`${opponentTeamName} hat eine Siegquote von nur ${Math.round(winPercentage)}%`);
            }

            return insights.length > 0 ? insights[0] : null;
        } catch (error) {
            console.error('Error fetching league comparison:', error);
            return null;
        }
    };

    const getDangerousPlayers = async (teamName: string, teamId: string, gameId: string): Promise<DangerousPlayer[]> => {
        try {
            // Get all box scores for players from the opponent team (season stats)
            const { data: seasonBoxScores, error: seasonStatsError } = await supabase
                .from('box_scores')
                .select('*')
                .eq('team_id', teamId);

            if (seasonStatsError) throw seasonStatsError;

            // Get recent stats (last 2 weeks is what was used, but logic says last 2 games typically)
            // Original code used 2 weeks lookback
            const twoWeeksAgo = addDays(new Date(), -14);
            const { data: recentBoxScores, error: recentStatsError } = await supabase
                .from('box_scores')
                .select('*, games(*)')
                .eq('team_id', teamId)
                .gte('scraped_at', twoWeeksAgo.toISOString())
                .order('scraped_at', { ascending: false })
                .limit(2);

            if (recentStatsError) throw recentStatsError;

            // Group box scores by player
            const playerGroups = seasonBoxScores.reduce((acc, boxScore) => {
                const playerKey = `${boxScore.player_first_name}_${boxScore.player_last_name}`;
                if (!acc[playerKey]) {
                    acc[playerKey] = [];
                }
                acc[playerKey].push(boxScore);
                return acc;
            }, {} as Record<string, BoxScore[]>);

            // Calculate stats for each player
            const playerStats = Object.entries(playerGroups).map(([playerKey, playerBoxScores]) => {
                const [firstName, lastName] = playerKey.split('_');
                const playerRecentStats = recentBoxScores.filter(
                    stat => stat.player_first_name === firstName && stat.player_last_name === lastName
                );

                const scores = playerBoxScores as BoxScore[];

                const seasonTotals = scores.reduce(
                    (acc, boxScore) => ({
                        totalPoints: acc.totalPoints + boxScore.points,
                        totalThreePointers: acc.totalThreePointers + boxScore.three_pointers,
                        totalFreeThrows: acc.totalFreeThrows + boxScore.free_throws_made,
                        totalFreeThrowAttempts: acc.totalFreeThrowAttempts + boxScore.free_throw_attempts,
                        totalFouls: acc.totalFouls + boxScore.fouls,
                        gamesPlayed: acc.gamesPlayed + 1
                    }),
                    { totalPoints: 0, totalThreePointers: 0, totalFreeThrows: 0, totalFreeThrowAttempts: 0, totalFouls: 0, gamesPlayed: 0 }
                );

                const seasonStats = {
                    totalPoints: seasonTotals.totalPoints,
                    avgPoints: seasonTotals.gamesPlayed > 0 ? seasonTotals.totalPoints / seasonTotals.gamesPlayed : 0,
                    totalThreePointers: seasonTotals.totalThreePointers,
                    avgThreePointers: seasonTotals.gamesPlayed > 0 ? seasonTotals.totalThreePointers / seasonTotals.gamesPlayed : 0,
                    totalFreeThrows: seasonTotals.totalFreeThrows,
                    avgFreeThrows: seasonTotals.gamesPlayed > 0 ? seasonTotals.totalFreeThrows / seasonTotals.gamesPlayed : 0,
                    avgFreeThrowAttempts: seasonTotals.gamesPlayed > 0 ? seasonTotals.totalFreeThrowAttempts / seasonTotals.gamesPlayed : 0,
                    totalFouls: seasonTotals.totalFouls,
                    avgFouls: seasonTotals.gamesPlayed > 0 ? seasonTotals.totalFouls / seasonTotals.gamesPlayed : 0,
                    gamesPlayed: seasonTotals.gamesPlayed,
                    fouledOutGames: scores.filter(s => s.fouls >= 5).length
                };

                const recentTotals = playerRecentStats.slice(0, 2).reduce(
                    (acc, boxScore) => ({
                        totalPoints: acc.totalPoints + (boxScore as BoxScore).points,
                        totalThreePointers: acc.totalThreePointers + (boxScore as BoxScore).three_pointers,
                        totalFreeThrows: acc.totalFreeThrows + (boxScore as BoxScore).free_throws_made,
                        games: acc.games + 1
                    }),
                    { totalPoints: 0, totalThreePointers: 0, totalFreeThrows: 0, games: 0 }
                );

                const recentStatsData = {
                    lastTwoGames: playerRecentStats.slice(0, 2).map(boxScore => ({
                        points: (boxScore as BoxScore).points,
                        threePointers: (boxScore as BoxScore).three_pointers,
                        freeThrows: (boxScore as BoxScore).free_throws_made,
                        game: (boxScore as any).games
                    })),
                    avgPointsLastTwo: recentTotals.games > 0 ? recentTotals.totalPoints / recentTotals.games : 0,
                    avgThreePointersLastTwo: recentTotals.games > 0 ? recentTotals.totalThreePointers / recentTotals.games : 0,
                    avgFreeThrowsLastTwo: recentTotals.games > 0 ? recentTotals.totalFreeThrows / recentTotals.games : 0
                };

                const avgPoints = Math.max(seasonStats.avgPoints, recentStatsData.avgPointsLastTwo);
                let dangerLevel: 'high' | 'medium' | 'low' = 'low';

                if (avgPoints >= 20) dangerLevel = 'high';
                else if (avgPoints >= 12) dangerLevel = 'medium';

                return {
                    player: {
                        first_name: firstName,
                        last_name: lastName,
                        team_id: teamId,
                        full_name: `${firstName} ${lastName}`
                    },
                    seasonStats,
                    recentStats: recentStatsData,
                    dangerLevel
                };
            });

            return playerStats;
        } catch (err) {
            console.error('Error getting dangerous players:', err);
            return [];
        }
    };

    const fetchGamesAndDangerousPlayers = async () => {
        try {
            setLoading(true);
            const today = new Date();
            const threeMonthsLater = addDays(today, 90);

            const { data: gamesData, error: gamesError } = await supabase
                .from('games')
                .select('*')
                .or(`home_team_name.ilike.%TSV Neuenstadt%,away_team_name.ilike.%TSV Neuenstadt%`)
                .gte('game_date', today.toISOString().split('T')[0])
                .lte('game_date', threeMonthsLater.toISOString().split('T')[0])
                .order('game_date', { ascending: true });

            if (gamesError) throw gamesError;

            const gamesWithDangerousPlayers: GameWithDangerousPlayers[] = await Promise.all(
                gamesData.map(async (game: Game) => {
                    const opponentTeamName = game.home_team_name === 'TSV Neuenstadt' ? game.away_team_name : game.home_team_name;
                    const opponentTeamId = game.home_team_name === 'TSV Neuenstadt' ? game.away_team_id : game.home_team_id;
                    const allPlayerStats = await getDangerousPlayers(opponentTeamName, opponentTeamId, game.id);

                    const leagueComparison = await getLeagueComparisonInfo(opponentTeamId, opponentTeamName);
                    if (leagueComparison) {
                        setLeagueComparisons(prev => new Map(prev.set(game.id, leagueComparison)));
                    }

                    const top3Players = selectTop3DangerousPlayers(allPlayerStats);

                    return {
                        ...game,
                        dangerous_players: top3Players,
                        dangerous_players_extended: allPlayerStats
                    };
                })
            );

            setGames(gamesWithDangerousPlayers);
        } catch (err) {
            console.error('Error fetching games:', err);
            setError('Fehler beim Laden der Spiele');
        } finally {
            setLoading(false);
        }
    };

    return { games, loading, error, leagueComparisons };
};
