import { supabase } from '@/lib/supabase';

export interface PlayerMinutesData {
  playerId: string;
  playerSlug: string;
  firstName: string;
  lastName: string;
  minutes: number;
  gameId: string;
  gameNumber: number;
  gameDate?: string;
}

export interface GameMinutesData {
  gameNumber: number;
  gameDate?: string;
  homeTeam?: string;
  awayTeam?: string;
  playerMinutes: Array<{
    playerId: string;
    minutes: number;
  }>;
}

export class MinutesService {
  // Get players who need minutes data for a specific game
  static async getPlayersNeedingMinutes(gameNumber: number): Promise<PlayerMinutesData[]> {
    try {
      // First, get the game info to determine which team is TSV Neuenstadt
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('home_team_name, away_team_name, home_team_id, away_team_id')
        .eq('game_id', gameNumber.toString())
        .single();

      if (gameError) throw gameError;

      // Determine which team ID represents TSV Neuenstadt
      const isTSVNeuenstadtHome = gameData.home_team_name?.toLowerCase().includes('neuenstadt');
      const tsvNeuenstadtTeamId = isTSVNeuenstadtHome ? gameData.home_team_id : gameData.away_team_id;

      if (!tsvNeuenstadtTeamId) {
        console.warn('Could not determine TSV Neuenstadt team ID for game:', gameNumber);
        return [];
      }

      console.log(`Game ${gameNumber}: TSV Neuenstadt team ID is ${tsvNeuenstadtTeamId}`);

      const { data, error } = await supabase
        .from('box_scores')
        .select(`
          game_id,
          player_slug,
          player_first_name,
          player_last_name,
          points,
          minutes_played,
          team_id
        `)
        .eq('game_id', gameNumber.toString())
        .eq('team_id', tsvNeuenstadtTeamId) // Only TSV Neuenstadt players
        .not('player_slug', 'is', null)
        .gt('points', 0) // Only players who actually played
        .order('player_last_name, player_first_name');

      if (error) throw error;

      // Get unique players by grouping by player_slug and taking the first occurrence
      const uniquePlayers = new Map<string, any>();
      
      (data || []).forEach(row => {
        if (!uniquePlayers.has(row.player_slug)) {
          uniquePlayers.set(row.player_slug, row);
        }
      });

      return Array.from(uniquePlayers.values()).map(row => ({
        playerId: row.player_slug,
        playerSlug: row.player_slug,
        firstName: row.player_first_name,
        lastName: row.player_last_name,
        minutes: row.minutes_played || 0,
        gameId: row.game_id,
        gameNumber: parseInt(row.game_id)
      }));
    } catch (error) {
      console.error('Error fetching players needing minutes:', error);
      throw error;
    }
  }

  // Update minutes for multiple players in a game
  static async updatePlayerMinutes(gameNumber: number, playerMinutes: Array<{playerId: string, minutes: number}>): Promise<boolean> {
    try {
      const updates = playerMinutes.map(({ playerId, minutes }) => ({
        game_id: gameNumber.toString(),
        player_slug: playerId,
        minutes_played: minutes
      }));

      // Update each player's minutes
      const { error } = await supabase
        .from('box_scores')
        .upsert(updates, { onConflict: 'game_id,player_slug' });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating player minutes:', error);
      throw error;
    }
  }

  // Get minutes summary for a game
  static async getGameMinutesSummary(gameNumber: number): Promise<{
    totalMinutes: number;
    playersWithMinutes: number;
    playersNeedingMinutes: number;
  }> {
    try {
      // First, get the game info to determine which team is TSV Neuenstadt
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('home_team_name, away_team_name, home_team_id, away_team_id')
        .eq('game_id', gameNumber.toString())
        .single();

      if (gameError) throw gameError;

      // Determine which team ID represents TSV Neuenstadt
      const isTSVNeuenstadtHome = gameData.home_team_name?.toLowerCase().includes('neuenstadt');
      const tsvNeuenstadtTeamId = isTSVNeuenstadtHome ? gameData.home_team_id : gameData.away_team_id;

      if (!tsvNeuenstadtTeamId) {
        console.warn('Could not determine TSV Neuenstadt team ID for game:', gameNumber);
        return {
          totalMinutes: 0,
          playersWithMinutes: 0,
          playersNeedingMinutes: 0
        };
      }

      const { data, error } = await supabase
        .from('box_scores')
        .select('minutes_played, points, player_slug')
        .eq('game_id', gameNumber.toString())
        .eq('team_id', tsvNeuenstadtTeamId) // Only TSV Neuenstadt players
        .not('player_slug', 'is', null)
        .gt('points', 0);

      if (error) throw error;

      // Get unique players by player_slug
      const uniquePlayers = new Map<string, any>();
      
      (data || []).forEach(row => {
        if (!uniquePlayers.has(row.player_slug)) {
          uniquePlayers.set(row.player_slug, row);
        }
      });

      const players = Array.from(uniquePlayers.values());
      const totalMinutes = players.reduce((sum, player) => sum + (player.minutes_played || 0), 0);
      const playersWithMinutes = players.filter(player => (player.minutes_played || 0) > 0).length;
      const playersNeedingMinutes = players.filter(player => (player.minutes_played || 0) === 0).length;

      return {
        totalMinutes,
        playersWithMinutes,
        playersNeedingMinutes
      };
    } catch (error) {
      console.error('Error getting game minutes summary:', error);
      throw error;
    }
  }

  // Get all games that need minutes data
  static async getGamesNeedingMinutes(): Promise<Array<{
    gameNumber: number;
    gameDate?: string;
    homeTeam?: string;
    awayTeam?: string;
    playersNeedingMinutes: number;
    totalPlayers: number;
  }>> {
    try {
      // First, get all games from the database that involve TSV Neuenstadt and are not in the future
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      const { data: allGames, error: allGamesError } = await supabase
        .from('games')
        .select('game_id, home_team_name, away_team_name, home_team_id, away_team_id, game_date')
        .or('home_team_name.ilike.%TSV Neuenstadt%,away_team_name.ilike.%TSV Neuenstadt%')
        .lte('game_date', today) // Only include games up to today (hide future games)
        .order('game_date', { ascending: false });

      if (allGamesError) throw allGamesError;

      console.log('All TSV Neuenstadt games (past/present):', allGames?.length || 0);
      console.log('Sample game IDs from games table:', allGames?.slice(0, 3).map(g => ({ id: g.game_id, date: g.game_date })));

      // Create a map for quick game info lookup including TSV Neuenstadt team ID
      const gameInfoMap = new Map<string, {
        homeTeam: string;
        awayTeam: string;
        gameDate: string;
        tsvNeuenstadtTeamId: string;
      }>();
      
      (allGames || []).forEach(game => {
        // Determine which team ID represents TSV Neuenstadt for this game
        const isTSVNeuenstadtHome = game.home_team_name?.toLowerCase().includes('neuenstadt');
        const tsvNeuenstadtTeamId = isTSVNeuenstadtHome ? game.home_team_id : game.away_team_id;
        
        gameInfoMap.set(game.game_id, {
          homeTeam: game.home_team_name,
          awayTeam: game.away_team_name,
          gameDate: game.game_date,
          tsvNeuenstadtTeamId: tsvNeuenstadtTeamId || ''
        });
      });

      // Try multiple approaches to find box scores with correct TSV Neuenstadt team filtering
      let boxScoresData = [];
      
      // Get all TSV Neuenstadt team IDs from games
      const tsvTeamIds = new Set<string>();
      (allGames || []).forEach(game => {
        const isTSVNeuenstadtHome = game.home_team_name?.toLowerCase().includes('neuenstadt');
        const tsvTeamId = isTSVNeuenstadtHome ? game.home_team_id : game.away_team_id;
        if (tsvTeamId) {
          tsvTeamIds.add(tsvTeamId);
        }
      });
      
      console.log('TSV Neuenstadt team IDs found:', Array.from(tsvTeamIds));
      
      // Approach 1: Try with exact game_id matching and correct TSV team IDs
      const gameIds = allGames?.map(g => g.game_id) || [];
      const { data: boxScores1, error: boxScoresError1 } = await supabase
        .from('box_scores')
        .select('game_id, player_slug, points, minutes_played, team_id')
        .in('team_id', Array.from(tsvTeamIds))
        .not('player_slug', 'is', null)
        .in('game_id', gameIds);

      if (!boxScoresError1 && boxScores1 && boxScores1.length > 0) {
        // Filter to only include TSV Neuenstadt players by checking team_id against game info
        const filteredBoxScores = boxScores1.filter(row => {
          const gameInfo = gameInfoMap.get(row.game_id.toString());
          return gameInfo && row.team_id === gameInfo.tsvNeuenstadtTeamId;
        });
        
        // Deduplicate by player_slug and game_id before counting
        const uniquePlayers = new Map<string, any>();
        filteredBoxScores.forEach(row => {
          const key = `${row.game_id}-${row.player_slug}`;
          if (!uniquePlayers.has(key)) {
            uniquePlayers.set(key, row);
          }
        });
        
        boxScoresData = Array.from(uniquePlayers.values());
        console.log('Found box scores with correct TSV team filtering (deduplicated):', boxScoresData.length);
      }

      // Approach 2: Try with team_id as string 'tsv-neuenstadt'
      if (boxScoresData.length === 0) {
        const { data: boxScores2, error: boxScoresError2 } = await supabase
          .from('box_scores')
          .select('game_id, player_slug, points, minutes_played, team_id')
          .eq('team_id', 'tsv-neuenstadt')
          .not('player_slug', 'is', null)
          .in('game_id', gameIds);

        if (!boxScoresError2 && boxScores2 && boxScores2.length > 0) {
          // Filter to only include TSV Neuenstadt players by checking against game info
          const filteredBoxScores = boxScores2.filter(row => {
            const gameInfo = gameInfoMap.get(row.game_id.toString());
            return gameInfo && row.team_id === gameInfo.tsvNeuenstadtTeamId;
          });
          
          // Deduplicate by player_slug and game_id
          const uniquePlayers = new Map<string, any>();
          filteredBoxScores.forEach(row => {
            const key = `${row.game_id}-${row.player_slug}`;
            if (!uniquePlayers.has(key)) {
              uniquePlayers.set(key, row);
            }
          });
          
          boxScoresData = Array.from(uniquePlayers.values());
          console.log('Found box scores with team_id=tsv-neuenstadt (filtered and deduplicated):', boxScoresData.length);
        }
      }

      // Approach 3: Try without team_id filter at all, then filter for TSV Neuenstadt players
      if (boxScoresData.length === 0) {
        const { data: boxScores3, error: boxScoresError3 } = await supabase
          .from('box_scores')
          .select('game_id, player_slug, points, minutes_played, team_id')
          .not('player_slug', 'is', null)
          .in('game_id', gameIds);

        if (!boxScoresError3 && boxScores3 && boxScores3.length > 0) {
          // Filter to only include TSV Neuenstadt players by checking team_id against game info
          const filteredBoxScores = boxScores3.filter(row => {
            const gameInfo = gameInfoMap.get(row.game_id.toString());
            return gameInfo && row.team_id === gameInfo.tsvNeuenstadtTeamId;
          });
          
          // Deduplicate by player_slug and game_id
          const uniquePlayers = new Map<string, any>();
          filteredBoxScores.forEach(row => {
            const key = `${row.game_id}-${row.player_slug}`;
            if (!uniquePlayers.has(key)) {
              uniquePlayers.set(key, row);
            }
          });
          
          boxScoresData = Array.from(uniquePlayers.values());
          console.log('Found box scores without team_id filter (filtered for TSV and deduplicated):', boxScoresData.length);
          console.log('Team IDs found after filtering:', [...new Set(boxScoresData.map(row => row.team_id))]);
        }
      }

      // Approach 4: Try getting all box scores and match by game_id as number, then filter for TSV
      if (boxScoresData.length === 0) {
        const gameIdsAsNumbers = gameIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        const { data: boxScores4, error: boxScoresError4 } = await supabase
          .from('box_scores')
          .select('game_id, player_slug, points, minutes_played, team_id')
          .not('player_slug', 'is', null)
          .in('game_id', gameIdsAsNumbers);

        if (!boxScoresError4 && boxScores4 && boxScores4.length > 0) {
          // Filter to only include TSV Neuenstadt players by checking team_id against game info
          const filteredBoxScores = boxScores4.filter(row => {
            const gameInfo = gameInfoMap.get(row.game_id.toString());
            return gameInfo && row.team_id === gameInfo.tsvNeuenstadtTeamId;
          });
          
          // Deduplicate by player_slug and game_id
          const uniquePlayers = new Map<string, any>();
          filteredBoxScores.forEach(row => {
            const key = `${row.game_id}-${row.player_slug}`;
            if (!uniquePlayers.has(key)) {
              uniquePlayers.set(key, row);
            }
          });
          
          boxScoresData = Array.from(uniquePlayers.values());
          console.log('Found box scores with numeric game_ids (filtered for TSV and deduplicated):', boxScoresData.length);
        }
      }

      // Approach 5: Get ALL box scores and see what we have, then filter for TSV
      if (boxScoresData.length === 0) {
        const { data: allBoxScores, error: allBoxScoresError } = await supabase
          .from('box_scores')
          .select('game_id, player_slug, points, minutes_played, team_id')
          .not('player_slug', 'is', null)
          .limit(50); // Limit to avoid too much data

        if (!allBoxScoresError && allBoxScores && allBoxScores.length > 0) {
          console.log('Sample of ALL box scores:', allBoxScores.length);
          console.log('Sample game IDs from box_scores:', [...new Set(allBoxScores.slice(0, 10).map(row => row.game_id))]);
          console.log('Sample team IDs from box_scores:', [...new Set(allBoxScores.slice(0, 10).map(row => row.team_id))]);
          
          // Try to find matches manually and filter for TSV Neuenstadt players
          const matchingGames = allBoxScores.filter(row => 
            (gameIds.includes(row.game_id.toString()) || 
            gameIds.includes(row.game_id) ||
            gameIds.map(id => parseInt(id)).includes(parseInt(row.game_id))) &&
            // Additional filter for TSV Neuenstadt players
            (() => {
              const gameInfo = gameInfoMap.get(row.game_id.toString());
              return gameInfo && row.team_id === gameInfo.tsvNeuenstadtTeamId;
            })()
          );
          
          if (matchingGames.length > 0) {
            // Deduplicate the matching games
            const uniquePlayers = new Map<string, any>();
            matchingGames.forEach(row => {
              const key = `${row.game_id}-${row.player_slug}`;
              if (!uniquePlayers.has(key)) {
                uniquePlayers.set(key, row);
              }
            });
            
            boxScoresData = Array.from(uniquePlayers.values());
            console.log('Found manually matched box scores (filtered for TSV and deduplicated):', boxScoresData.length);
          }
        }
      }

      console.log('Final box scores count:', boxScoresData.length);
      if (boxScoresData.length > 0) {
        console.log('Sample box scores:', boxScoresData.slice(0, 3));
        
        // Show distribution of players across games
        const gameDistribution = new Map<string, number>();
        boxScoresData.forEach(row => {
          const gameId = row.game_id.toString();
          gameDistribution.set(gameId, (gameDistribution.get(gameId) || 0) + 1);
        });
        
        console.log('Player distribution across games:');
        gameDistribution.forEach((count, gameId) => {
          console.log(`  Game ${gameId}: ${count} players`);
        });
      }

      // Group by game and count unique players
      const gameStats = new Map<string, { 
        totalPlayers: number; 
        needingMinutes: number; 
      }>();
      
      // Use a Set to track unique players per game
      const uniquePlayersPerGame = new Map<string, Set<string>>();
      const playersNeedingMinutesPerGame = new Map<string, Set<string>>();
      
      (boxScoresData || []).forEach(row => {
        const gameId = row.game_id.toString(); // Ensure string key
        const playerSlug = row.player_slug;
        
        // Initialize sets if not exists
        if (!uniquePlayersPerGame.has(gameId)) {
          uniquePlayersPerGame.set(gameId, new Set());
          playersNeedingMinutesPerGame.set(gameId, new Set());
        }
        
        // Add to unique players set
        uniquePlayersPerGame.get(gameId)!.add(playerSlug);
        
        // Add to needing minutes set if minutes are 0 or null
        if ((row.minutes_played || 0) === 0) {
          playersNeedingMinutesPerGame.get(gameId)!.add(playerSlug);
        }
      });

      // Convert sets to counts
      uniquePlayersPerGame.forEach((players, gameId) => {
        const needingMinutes = playersNeedingMinutesPerGame.get(gameId) || new Set();
        gameStats.set(gameId, {
          totalPlayers: players.size,
          needingMinutes: needingMinutes.size
        });
      });

      // Test specific game 2786687 to verify our logic works
      console.log('Testing with known working game 2786687...');
      const { data: testGame2786687, error: testGameError } = await supabase
        .from('games')
        .select('game_id, home_team_name, away_team_name, home_team_id, away_team_id')
        .eq('game_id', '2786687')
        .single();

      if (!testGameError && testGame2786687) {
        const isTSVNeuenstadtHome = testGame2786687.home_team_name.toLowerCase().includes('neuenstadt');
        const tsvNeuenstadtTeamId = isTSVNeuenstadtHome ? testGame2786687.home_team_id : testGame2786687.away_team_id;
        console.log('Game 2786687 details:', {
          home_team: testGame2786687.home_team_name,
          away_team: testGame2786687.away_team_name,
          tsv_team_id: tsvNeuenstadtTeamId
        });

        // Test box scores for this game with our team ID
        const { data: testBoxScores, error: testBoxScoresError } = await supabase
          .from('box_scores')
          .select('player_first_name, player_last_name, player_slug, team_id, points, minutes_played')
          .eq('game_id', '2786687')
          .eq('team_id', tsvNeuenstadtTeamId)
          .not('player_slug', 'is', null);

        if (!testBoxScoresError && testBoxScores) {
          console.log('Found TSV Neuenstadt players for game 2786687:', testBoxScores.length);
          console.log('Sample players:', testBoxScores.slice(0, 3).map(p => `${p.player_first_name} ${p.player_last_name}: ${p.points} pts`));
        } else {
          console.log('Error finding TSV players for game 2786687:', testBoxScoresError);
        }

        // Let's also check ALL box scores for this game to see what's there
        const { data: allBoxScoresForGame, error: allBoxScoresError } = await supabase
          .from('box_scores')
          .select('player_first_name, player_last_name, player_slug, team_id, points, minutes_played')
          .eq('game_id', '2786687');

        if (!allBoxScoresError && allBoxScoresForGame) {
          console.log('ALL box scores for game 2786687:', allBoxScoresForGame.length);
          console.log('Team IDs in this game:', [...new Set(allBoxScoresForGame.map(bs => bs.team_id))]);
          console.log('Players with slug:', allBoxScoresForGame.filter(bs => bs.player_slug).length);
          console.log('Sample all players:', allBoxScoresForGame.slice(0, 5).map(p => `${p.player_first_name} ${p.player_last_name} (team: ${p.team_id}): ${p.points} pts`));
        }
      }

      // Also include games that don't have any box_scores yet (all players need minutes)
      (allGames || []).forEach(game => {
        if (!gameStats.has(game.game_id)) {
          gameStats.set(game.game_id, {
            totalPlayers: 0, // No players recorded yet
            needingMinutes: 0 // Will be handled differently in UI
          });
        }
      });

      console.log('Final game stats count:', gameStats.size);
      console.log('Games without box scores:', Array.from(gameStats.entries()).filter(([_, stats]) => stats.totalPlayers === 0).length);
      console.log('Games with box scores:', Array.from(gameStats.entries()).filter(([_, stats]) => stats.totalPlayers > 0).map(([gameId, _]) => gameId));

      // Convert to expected format
      return Array.from(gameStats.entries())
        .map(([gameId, stats]) => {
          const gameInfo = gameInfoMap.get(gameId);
          return {
            gameNumber: parseInt(gameId) || 0,
            gameDate: gameInfo?.gameDate,
            homeTeam: gameInfo?.homeTeam,
            awayTeam: gameInfo?.awayTeam,
            playersNeedingMinutes: stats.needingMinutes,
            totalPlayers: stats.totalPlayers
          };
        })
        .sort((a, b) => b.gameNumber - a.gameNumber);
    } catch (error) {
      console.error('Error getting games needing minutes:', error);
      throw error;
    }
  }
}
