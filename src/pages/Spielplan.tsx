import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { Game, DangerousPlayer, GameWithDangerousPlayers, BoxScore, Standing } from '@/types/supabase';
import { format, parseISO, isAfter, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar, Clock, MapPin, AlertTriangle, TrendingUp, Target, Award } from 'lucide-react';
import Layout from '@/components/Layout';

const Spielplan: React.FC = () => {
  const [games, setGames] = useState<GameWithDangerousPlayers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leagueComparisons, setLeagueComparisons] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetchGamesAndDangerousPlayers();
  }, []);

  const fetchGamesAndDangerousPlayers = async () => {
    try {
      setLoading(true);
      
      // Debug: Check Supabase connection
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      // Test connection with different queries to check RLS
      const { data: countTest, error: countError } = await supabase
        .from('games')
        .select('*', { count: 'exact' });
      
      console.log('Count test:', { countTest, countError, count: countTest?.length });
      
      // Try with specific columns to see if it's a column permission issue
      const { data: columnTest, error: columnError } = await supabase
        .from('games')
        .select('id, game_id, home_team_name, away_team_name, game_date');
      
      console.log('Column test:', { columnTest, columnError, count: columnTest?.length });
      
      // Check if we're authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Auth session:', { session, sessionError });
      
      // If not authenticated, try to sign in with demo credentials
      if (!session) {
        console.log('Not authenticated, trying demo sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'demo@example.com',
          password: 'demo123'
        });
        console.log('Sign in result:', { signInData, signInError });
        
        // If demo sign in fails, try to sign up
        if (signInError) {
          console.log('Demo sign in failed, trying sign up...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'demo@example.com',
            password: 'demo123'
          });
          console.log('Sign up result:', { signUpData, signUpError });
          
          // Try sign in again after sign up
          if (!signUpError) {
            const { data: retrySignIn, error: retryError } = await supabase.auth.signInWithPassword({
              email: 'demo@example.com',
              password: 'demo123'
            });
            console.log('Retry sign in:', { retrySignIn, retryError });
          }
        }
      }
      
      // Check what tables exist by trying different possible table names
      const possibleTables = ['games', 'game', 'matches', 'bundesliga_games', 'basketball_games'];
      const tableChecks = await Promise.allSettled(
        possibleTables.map(async (tableName) => {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            return { table: tableName, hasData: data && data.length > 0, error };
          } catch (e) {
            return { table: tableName, hasData: false, error: e };
          }
        })
      );
      
      console.log('Table checks:', tableChecks);
      
      // Let's query the information_schema to see all tables that exist
      const { data: allTables, error: tablesError } = await supabase
        .rpc('get_all_tables');
      
      console.log('All tables in database:', allTables);
      
      // If the RPC doesn't exist, let's try a direct query
      if (tablesError) {
        console.log('RPC failed, trying direct query...');
        const { data: schemaTables, error: schemaError } = await supabase
          .from('information_schema.tables')
          .select('table_name, table_schema')
          .eq('table_schema', 'public')
          .eq('table_type', 'BASE TABLE');
        
        console.log('Tables from information_schema:', schemaTables);
        console.log('Schema error:', schemaError);
      }
      
      // Fetch upcoming games for TSV Neuenstadt
      const today = new Date();
      const threeMonthsLater = addDays(today, 90);
      
      // Debug: First, let's see all games to understand the data
      const { data: allGames, error: allGamesError } = await supabase
        .from('games')
        .select('*')
        .order('game_date', { ascending: true });

      console.log('All games in Supabase:', allGames);
      console.log('Games count:', allGames?.length);
      
      // Check a few sample games to understand the data structure
      if (allGames && allGames.length > 0) {
        console.log('Sample game:', allGames[0]);
        console.log('Sample game date:', allGames[0].game_date);
        console.log('Sample team names:', {
          home: allGames[0].home_team_name,
          away: allGames[0].away_team_name
        });
        
        // Check what team names exist
        const teamNames = [...new Set(allGames.flatMap(g => [g.home_team_name, g.away_team_name]))];
        console.log('All team names:', teamNames);
        
        // Check if any team contains "Neuenstadt"
        const neuenstadtTeams = teamNames.filter(name => name && name.toLowerCase().includes('neuenstadt'));
        console.log('Teams with "Neuenstadt":', neuenstadtTeams);
      }
      
      // Also check what team names exist
      if (allGames && allGames.length > 0) {
        const teamNames = [...new Set(allGames.flatMap(g => [g.home_team_name, g.away_team_name]))];
        console.log('All team names:', teamNames);
      }
      console.log('Today:', today.toISOString().split('T')[0]);
      console.log('Three months later:', threeMonthsLater.toISOString().split('T')[0]);
      
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .or(`home_team_name.ilike.%TSV Neuenstadt%,away_team_name.ilike.%TSV Neuenstadt%`)
        .gte('game_date', today.toISOString().split('T')[0])
        .lte('game_date', threeMonthsLater.toISOString().split('T')[0])
        .order('game_date', { ascending: true });

      console.log('Filtered games:', gamesData);

      if (gamesError) throw gamesError;

      // For each game, get dangerous players from the opponent team and league comparison
      const gamesWithDangerousPlayers: GameWithDangerousPlayers[] = await Promise.all(
        gamesData.map(async (game: Game) => {
          const opponentTeamName = game.home_team_name === 'TSV Neuenstadt' ? game.away_team_name : game.home_team_name;
          const opponentTeamId = game.home_team_name === 'TSV Neuenstadt' ? game.away_team_id : game.home_team_id;
          const allPlayerStats = await getDangerousPlayers(opponentTeamName, opponentTeamId, game.id);
          
          // Get league comparison for this opponent
          const leagueComparison = await getLeagueComparisonInfo(opponentTeamId, opponentTeamName);
          console.log('League comparison result for', opponentTeamName, ':', leagueComparison);
          if (leagueComparison) {
            setLeagueComparisons(prev => new Map(prev.set(game.id, leagueComparison)));
            console.log('Added league comparison to state for game:', game.id);
          }
          
          // Select top 3 dangerous players based on new logic
          const top3Players = selectTop3DangerousPlayers(allPlayerStats);
          
          return {
            ...game,
            dangerous_players: top3Players,
            dangerous_players_extended: allPlayerStats // Store all players for info boxes
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

  const getFoulOutInfo = (allPlayers: DangerousPlayer[]) => {
    const playerWithMostFoulOuts = allPlayers.reduce((max, player) => 
      player.seasonStats.fouledOutGames > max.seasonStats.fouledOutGames ? player : max
    , allPlayers[0]);
    
    if (playerWithMostFoulOuts && playerWithMostFoulOuts.seasonStats.fouledOutGames > 1) {
      return `${playerWithMostFoulOuts.player.full_name} hat sich in ${playerWithMostFoulOuts.seasonStats.fouledOutGames} Spielen ausgefoult`;
    }
    return null;
  };

  const getFreeThrowInfo = (allPlayers: DangerousPlayer[]) => {
    const playerWithMostMissedFT = allPlayers.reduce((max, player) => {
      const missedFT = player.seasonStats.avgFreeThrowAttempts - player.seasonStats.avgFreeThrows;
      const maxMissedFT = max.seasonStats.avgFreeThrowAttempts - max.seasonStats.avgFreeThrows;
      return missedFT > maxMissedFT ? player : max;
    }, allPlayers[0]);
    
    if (playerWithMostMissedFT && playerWithMostMissedFT.seasonStats.avgFreeThrowAttempts > 0) {
      // Calculate freethrow percentage
      const freeThrowPercentage = (playerWithMostMissedFT.seasonStats.avgFreeThrows / playerWithMostMissedFT.seasonStats.avgFreeThrowAttempts) * 100;
      
      // Only show message if percentage is 60% or lower
      if (freeThrowPercentage <= 60) {
        const missedFT = playerWithMostMissedFT.seasonStats.avgFreeThrowAttempts - playerWithMostMissedFT.seasonStats.avgFreeThrows;
        return `${playerWithMostMissedFT.player.full_name} verfehlt im Schnitt ${missedFT.toFixed(1)} seiner ${playerWithMostMissedFT.seasonStats.avgFreeThrowAttempts.toFixed(1)} Freiwürfe pro Spiel`;
      }
    }
    return null;
  };

  const getMissingTopPlayersInfo = (allPlayers: DangerousPlayer[]) => {
    // Get the top 3 players based on season stats (similar to selectTop3DangerousPlayers logic)
    const top3Players = selectTop3DangerousPlayers(allPlayers);
    
    if (top3Players.length === 0) return null;
    
    // Check if any of the top 3 players missed recent games
    const missingPlayers: { player: DangerousPlayer; missedGames: number }[] = [];
    
    for (const player of top3Players) {
      const recentGames = player.recentStats?.lastTwoGames || [];
      let missedCount = 0;
      
      for (const recentGame of recentGames) {
        // If points are 0 and the game was played, likely missed the game
        // This is a heuristic - in reality you'd check for actual game participation
        if (recentGame.points === 0 && recentGame.game.status === 'finished') {
          missedCount++;
        }
      }
      
      if (missedCount > 0) {
        missingPlayers.push({ player, missedGames: missedCount });
      }
    }
    
    if (missingPlayers.length > 0) {
      const playerNames = missingPlayers.map(mp => mp.player.player.full_name);
      const totalMissed = missingPlayers.reduce((sum, mp) => sum + mp.missedGames, 0);
      
      if (missingPlayers.length === 1) {
        return `${playerNames[0]} hat ${totalMissed} der letzten Spiele verpasst`;
      } else if (missingPlayers.length === 2) {
        return `${playerNames[0]} und ${playerNames[1]} haben insgesamt ${totalMissed} der letzten Spiele verpasst`;
      } else {
        return `${playerNames[0]}, ${playerNames[1]} und ${playerNames[2]} haben insgesamt ${totalMissed} der letzten Spiele verpasst`;
      }
    }
    
    return null;
  };

  const getLeagueComparisonInfo = async (opponentTeamId: string, opponentTeamName: string) => {
    try {
      console.log('Fetching league comparison for:', { opponentTeamId, opponentTeamName });
      
      // Since standings table doesn't exist, calculate league stats from game data
      // Fetch all games with scores to calculate team statistics (more reliable than status)
      const { data: allGames, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .not('home_score', 'is', null)
        .not('away_score', 'is', null)
        .order('game_date', { ascending: false });

      console.log('All games for league stats:', { allGames, error: gamesError, count: allGames?.length });
      
      // Also check what game statuses exist
      const { data: allGamesWithStatus, error: statusError } = await supabase
        .from('games')
        .select('status, home_score, away_score, home_team_name, away_team_name')
        .limit(10);
      
      console.log('Sample game statuses and scores:', allGamesWithStatus);

      if (gamesError || !allGames || allGames.length === 0) {
        console.log('No completed games found for league stats');
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

      console.log('Calculated team stats:', Array.from(teamStats.entries()));

      // Find opponent team stats
      const opponentStats = teamStats.get(opponentTeamId);
      if (!opponentStats || opponentStats.games < 3) {
        console.log('Opponent stats not found or insufficient games:', opponentTeamId);
        return null;
      }

      // Calculate league averages (only include teams with 3+ games)
      const qualifiedTeams = Array.from(teamStats.values()).filter(stats => stats.games >= 3);
      if (qualifiedTeams.length < 2) {
        console.log('Not enough qualified teams for comparison');
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

      console.log('Generated insights:', insights);
      return insights.length > 0 ? insights[0] : null;
    } catch (error) {
      console.error('Error fetching league comparison:', error);
      return null;
    }
  };

  const selectTop3DangerousPlayers = (allPlayerStats: DangerousPlayer[]): DangerousPlayer[] => {
    if (allPlayerStats.length === 0) return [];

    // Sort by different metrics
    const byPoints = [...allPlayerStats].sort((a, b) => b.seasonStats.avgPoints - a.seasonStats.avgPoints);
    const byThreePointers = [...allPlayerStats].sort((a, b) => b.seasonStats.avgThreePointers - a.seasonStats.avgThreePointers);
    const byFreeThrows = [...allPlayerStats].sort((a, b) => b.seasonStats.avgFreeThrows - a.seasonStats.avgFreeThrows);

    const selectedPlayers: DangerousPlayer[] = [];
    const usedPlayerNames = new Set<string>();

    // 1. Player with most points per game
    const topPointsPlayer = byPoints.find(p => !usedPlayerNames.has(p.player.full_name));
    if (topPointsPlayer) {
      selectedPlayers.push(topPointsPlayer);
      usedPlayerNames.add(topPointsPlayer.player.full_name);
    }

    // 2. Player with most three pointers per game
    const topThreePointPlayer = byThreePointers.find(p => !usedPlayerNames.has(p.player.full_name));
    if (topThreePointPlayer) {
      selectedPlayers.push(topThreePointPlayer);
      usedPlayerNames.add(topThreePointPlayer.player.full_name);
    }

    // 3. Player with most made free throws per game
    const topFreeThrowPlayer = byFreeThrows.find(p => !usedPlayerNames.has(p.player.full_name));
    if (topFreeThrowPlayer) {
      selectedPlayers.push(topFreeThrowPlayer);
      usedPlayerNames.add(topFreeThrowPlayer.player.full_name);
    }

    // If we have less than 3 players, fill with the next best by points
    if (selectedPlayers.length < 3) {
      for (const player of byPoints) {
        if (!usedPlayerNames.has(player.player.full_name)) {
          selectedPlayers.push(player);
          usedPlayerNames.add(player.player.full_name);
          if (selectedPlayers.length >= 3) break;
        }
      }
    }

    return selectedPlayers.slice(0, 3);
  };

  const getDangerousPlayers = async (teamName: string, teamId: string, gameId: string): Promise<DangerousPlayer[]> => {
    try {
      // Get all box scores for players from the opponent team (season stats)
      const { data: seasonBoxScores, error: seasonStatsError } = await supabase
        .from('box_scores')
        .select('*')
        .eq('team_id', teamId);

      if (seasonStatsError) throw seasonStatsError;

      // Get recent stats (last 2 games)
      const twoWeeksAgo = addDays(new Date(), -14);
      const { data: recentBoxScores, error: recentStatsError } = await supabase
        .from('box_scores')
        .select('*, games(*)')
        .eq('team_id', teamId)
        .gte('scraped_at', twoWeeksAgo.toISOString())
        .order('scraped_at', { ascending: false })
        .limit(2);

      if (recentStatsError) throw recentStatsError;

      // Group box scores by player and calculate dangerous players
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

        // Type assertion to ensure TypeScript knows this is BoxScore[]
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

        // Calculate danger level based on scoring averages
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

  const formatGameDate = (gameDate: string, gameTime?: string) => {
    try {
      const dateTimeString = gameTime ? `${gameDate}T${gameTime}` : gameDate;
      const date = parseISO(dateTimeString);
      return format(date, 'EEEE, dd.MM.yyyy - HH:mm', { locale: de });
    } catch (e) {
      return gameDate;
    }
  };

  const getDangerColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDangerIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <TrendingUp className="w-4 h-4" />;
      case 'low': return <Target className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">Lade Spielplan...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-red-500 text-center py-8">
            Fehler beim Laden des Spielplans: {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Spielplan</h1>
        </div>

        {games.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Keine kommenden Spiele gefunden.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {games.map((game) => (
              <Card key={game.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span>{formatGameDate(game.game_date, game.game_time)}</span>
                    </div>
                    <Badge variant={game.status === 'scheduled' ? 'default' : 'secondary'}>
                      {game.status === 'scheduled' ? 'Bevorstehend' : 
                       game.status === 'live' ? 'Live' :
                       game.status === 'finished' ? 'Beendet' : game.status}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span className={game.home_team_name === 'TSV Neuenstadt' ? 'text-primary' : ''}>
                      {game.home_team_name}
                    </span>
                    <span className="text-muted-foreground">vs</span>
                    <span className={game.away_team_name === 'TSV Neuenstadt' ? 'text-primary' : ''}>
                      {game.away_team_name}
                    </span>
                  </div>
                  {game.venue && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{game.venue}</span>
                    </div>
                  )}
                </CardHeader>

                {game.dangerous_players.length > 0 && (
                  <CardContent className="pt-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Gefährliche Spieler
                      </h3>
                      
                      {/* Calculate best values for highlighting */}
                      {(() => {
                        const allPlayers = game.dangerous_players_extended || game.dangerous_players;
                        const bestPoints = Math.max(...allPlayers.map(p => p.seasonStats.avgPoints));
                        const best3Pointers = Math.max(...allPlayers.map(p => p.seasonStats.avgThreePointers));
                        const bestFreeThrows = Math.max(...allPlayers.map(p => p.seasonStats.avgFreeThrows));
                        
                        return (
                          <div className="mb-6">
                            <div className="overflow-x-auto -mx-4 px-4">
                              <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                                    <th className="border border-gray-300 px-4 py-2 text-center">Punkte</th>
                                    <th className="border border-gray-300 px-4 py-2 text-center">3er</th>
                                    <th className="border border-gray-300 px-4 py-2 text-center">FW</th>
                                    <th className="border border-gray-300 px-4 py-2 text-center">Fouls</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {game.dangerous_players.map((player) => (
                                    <tr key={`${player.player.first_name}_${player.player.last_name}`}>
                                      <td className="border border-gray-300 px-4 py-2 font-medium">
                                        {player.player.full_name}
                                      </td>
                                      <td className={`border border-gray-300 px-4 py-2 text-center ${player.seasonStats.avgPoints === bestPoints ? 'bg-yellow-100 font-bold' : ''}`}>
                                        {player.seasonStats.avgPoints.toFixed(1)}
                                      </td>
                                      <td className={`border border-gray-300 px-4 py-2 text-center ${player.seasonStats.avgThreePointers === best3Pointers ? 'bg-yellow-100 font-bold' : ''}`}>
                                        {player.seasonStats.avgThreePointers.toFixed(1)}
                                      </td>
                                      <td className={`border border-gray-300 px-4 py-2 text-center ${player.seasonStats.avgFreeThrows === bestFreeThrows ? 'bg-yellow-100 font-bold' : ''}`}>
                                        {player.seasonStats.avgFreeThrows.toFixed(1)}/{player.seasonStats.avgFreeThrowAttempts.toFixed(1)}
                                      </td>
                                      <td className="border border-gray-300 px-4 py-2 text-center">
                                        {player.seasonStats.avgFouls.toFixed(1)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Info boxes about any player from the team */}
                      <div className="space-y-4">
                        {getFoulOutInfo(game.dangerous_players_extended || game.dangerous_players) && (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-yellow-800">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="font-medium">
                                {getFoulOutInfo(game.dangerous_players_extended || game.dangerous_players)}
                              </span>
                            </div>
                          </div>
                        )}

                        {(() => {
                          const comparison = leagueComparisons.get(game.id);
                          console.log('Checking league comparison for game', game.id, ':', comparison);
                          console.log('All league comparisons:', Array.from(leagueComparisons.entries()));
                          return comparison && (
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                              <div className="flex items-center gap-2 text-sm text-purple-800">
                                <TrendingUp className="w-4 h-4" />
                                <span className="font-medium">
                                  {comparison}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {getMissingTopPlayersInfo(game.dangerous_players_extended || game.dangerous_players) && (
                          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-orange-800">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="font-medium">
                                {getMissingTopPlayersInfo(game.dangerous_players_extended || game.dangerous_players)}
                              </span>
                            </div>
                          </div>
                        )}

                        {getFreeThrowInfo(game.dangerous_players_extended || game.dangerous_players) && (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-blue-800">
                              <Target className="w-4 h-4" />
                              <span className="font-medium">
                                {getFreeThrowInfo(game.dangerous_players_extended || game.dangerous_players)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Spielplan;
