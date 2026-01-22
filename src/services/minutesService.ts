import { supabase, supabaseAdmin } from '@/lib/supabase';

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

      // Try fetching box scores for this specific game
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
        .order('player_last_name, player_first_name');

      if (error) throw error;

      // Check if we found any players
      if (!data || data.length === 0) {
        console.warn('No box score entries found for this game. Attempting fallback to active roster.');

        // Revised Fallback: Fetch all active players from player_info
        // This is more reliable as it doesn't depend on previous games
        const { data: rosterPlayers, error: rosterError } = await supabase
          .from('player_info')
          .select('player_slug, first_name, last_name')
          .eq('is_active', true)
          .order('last_name, first_name');

        if (rosterError) {
          console.error("Fallback roster fetch from player_info failed", rosterError);
          return [];
        }

        // Return roster players initialized with 0 minutes
        return (rosterPlayers || []).map(player => ({
          playerId: player.player_slug,
          playerSlug: player.player_slug,
          firstName: player.first_name,
          lastName: player.last_name,
          minutes: 0,
          gameId: gameNumber.toString(),
          gameNumber: gameNumber
        }));
      }

      // Get unique players by grouping by player name and taking the first occurrence (handle null names)
      const uniquePlayers = new Map<string, any>();

      (data || []).forEach(row => {
        const firstName = row.player_first_name || 'Unknown';
        const lastName = row.player_last_name || 'Player';
        const playerKey = `${firstName}-${lastName}`;
        if (!uniquePlayers.has(playerKey)) {
          uniquePlayers.set(playerKey, row);
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

  // Update seconds for multiple players in a game
  static async updatePlayerMinutes(gameNumber: number, playerSeconds: Array<{ playerId: string, seconds: number }>): Promise<boolean> {
    try {
      // First, get the game info to determine which team is TSV Neuenstadt (same as in getPlayersNeedingMinutes)
      const { data: gameData, error: gameError } = await supabaseAdmin
        .from('games')
        .select('home_team_name, away_team_name, home_team_id, away_team_id')
        .eq('game_id', gameNumber.toString())
        .single();

      if (gameError) throw gameError;

      // Determine which team ID represents TSV Neuenstadt
      const isTSVNeuenstadtHome = gameData.home_team_name?.toLowerCase().includes('neuenstadt');
      const tsvNeuenstadtTeamId = isTSVNeuenstadtHome ? gameData.home_team_id : gameData.away_team_id;

      if (!tsvNeuenstadtTeamId) {
        console.error('Could not determine TSV Neuenstadt team ID for game:', gameNumber);
        throw new Error('Could not determine team ID for update');
      }

      // Let's first check what rows actually exist for this game and team
      const { error: checkError } = await supabaseAdmin
        .from('box_scores')
        .select('game_id, team_id, player_slug, player_first_name, player_last_name, minutes_played')
        .eq('game_id', gameNumber.toString())
        .eq('team_id', tsvNeuenstadtTeamId);

      if (checkError) {
        console.error('Error checking existing rows:', checkError);
      }

      // Update each player's minutes individually (convert seconds to decimal for database)
      for (const { playerId, seconds } of playerSeconds) {
        // Use precise conversion to avoid floating point issues
        const decimalMinutes = Math.round((seconds / 60) * 100) / 100; // Round to 2 decimal places

        // Check if this specific player exists
        const { error: playerCheckError } = await supabaseAdmin
          .from('box_scores')
          .select('game_id, team_id, player_slug, player_first_name, player_last_name, minutes_played')
          .eq('game_id', gameNumber.toString())
          .eq('team_id', tsvNeuenstadtTeamId)
          .eq('player_slug', playerId);

        if (playerCheckError) {
          console.error(`Error checking player ${playerId}:`, playerCheckError);
        }

        // Try the update with more detailed error handling
        try {
          const { error, data } = await supabaseAdmin
            .from('box_scores')
            .update({ minutes_played: decimalMinutes })
            .eq('game_id', gameNumber.toString())
            .eq('team_id', tsvNeuenstadtTeamId)
            .eq('player_slug', playerId)
            .select();

          if (error) {
            console.error('Error updating player:', playerId, error);
            throw error;
          }

          if (!data || data.length === 0) {
            console.warn(`No rows updated for player ${playerId} - attempting INSERT`);

            // If update found no rows, it means the row doesn't exist yet for this game
            // We need to insert a new row

            // First get player details from player_info to populate name fields if needed
            const { data: playerInfo } = await supabaseAdmin
              .from('player_info')
              .select('first_name, last_name')
              .eq('player_slug', playerId)
              .single();

            const { error: insertError } = await supabaseAdmin
              .from('box_scores')
              .insert({
                game_id: gameNumber.toString(),
                team_id: tsvNeuenstadtTeamId,
                player_slug: playerId,
                player_first_name: playerInfo?.first_name || 'Unknown',
                player_last_name: playerInfo?.last_name || 'Player',
                minutes_played: decimalMinutes,
                points: 0, // Default to 0 if creating new row
                game_date: gameData.game_date // Use game date if available or let DB default
              });

            if (insertError) {
              console.error('Insert failed for player:', playerId, insertError);
              throw insertError;
            }
          }
        } catch (updateError) {
          console.error(`Update/Insert failed for player ${playerId}:`, updateError);
          throw updateError;
        }
      }

      return true;
    } catch (error) {
      console.error('=== SAVE OPERATION FAILED ===', error);
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
        .select('minutes_played, points, player_slug, player_first_name, player_last_name')
        .eq('game_id', gameNumber.toString())
        .eq('team_id', tsvNeuenstadtTeamId); // Only TSV Neuenstadt players

      if (error) throw error;

      // Get unique players by player name (handle null names)
      const uniquePlayers = new Map<string, any>();

      (data || []).forEach(row => {
        const firstName = row.player_first_name || 'Unknown';
        const lastName = row.player_last_name || 'Player';
        const playerKey = `${firstName}-${lastName}`;
        if (!uniquePlayers.has(playerKey)) {
          uniquePlayers.set(playerKey, row);
        }
      });

      const players = Array.from(uniquePlayers.values());
      const totalMinutes = Math.round((players.reduce((sum, player) => sum + (player.minutes_played || 0), 0)) * 1000) / 1000;
      const playersWithMinutes = players.filter(player => (player.minutes_played || 0) >= 0).length; // Include 0 minutes as "having minutes"
      const playersNeedingMinutes = players.filter(player => player.minutes_played === null || player.minutes_played === undefined).length; // Only count truly missing data

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

      // Single clean approach: Get box scores for TSV Neuenstadt games
      const gameIds = allGames?.map(g => g.game_id) || [];
      const { data: boxScores, error: boxScoresError } = await supabase
        .from('box_scores')
        .select('game_id, player_first_name, player_last_name, points, minutes_played, team_id')
        .in('game_id', gameIds)
        .in('team_id', Array.from(tsvTeamIds));

      if (boxScoresError) throw boxScoresError;

      // Filter to only include TSV Neuenstadt players by checking team_id against game info
      const filteredBoxScores = (boxScores || []).filter(row => {
        const gameInfo = gameInfoMap.get(row.game_id.toString());
        return gameInfo && row.team_id === gameInfo.tsvNeuenstadtTeamId;
      });

      // Deduplicate by player name and game_id
      const uniquePlayers = new Map<string, any>();
      filteredBoxScores.forEach(row => {
        const key = `${row.game_id}-${row.player_first_name}-${row.player_last_name}`;
        if (!uniquePlayers.has(key)) {
          uniquePlayers.set(key, row);
        }
      });

      const boxScoresData = Array.from(uniquePlayers.values());
      console.log('Found TSV Neuenstadt box scores:', boxScoresData.length);

      // Group by game and count unique players, also calculate total minutes
      const gameStats = new Map<string, {
        totalPlayers: number;
        needingMinutes: number;
        totalMinutes: number;
      }>();

      // Use a Set to track unique players per game (using player names since slug may be null)
      const uniquePlayersPerGame = new Map<string, Set<string>>();
      const playersNeedingMinutesPerGame = new Map<string, Set<string>>();
      const gameMinutesPerGame = new Map<string, number>();

      (boxScoresData || []).forEach(row => {
        const gameId = row.game_id.toString(); // Ensure string key
        const playerKey = `${row.player_first_name}-${row.player_last_name}`;

        // Initialize sets if not exists
        if (!uniquePlayersPerGame.has(gameId)) {
          uniquePlayersPerGame.set(gameId, new Set());
          playersNeedingMinutesPerGame.set(gameId, new Set());
          gameMinutesPerGame.set(gameId, 0);
        }

        // Add to unique players set
        uniquePlayersPerGame.get(gameId)!.add(playerKey);

        // Add to total minutes
        gameMinutesPerGame.set(gameId, (gameMinutesPerGame.get(gameId) || 0) + (row.minutes_played || 0));

        // Add to needing minutes set if minutes are null/undefined (truly missing data)
        if (row.minutes_played === null || row.minutes_played === undefined) {
          playersNeedingMinutesPerGame.get(gameId)!.add(playerKey);
        }
      });

      // Convert sets to counts and apply 200 minutes rule
      uniquePlayersPerGame.forEach((players, gameId) => {
        const needingMinutes = playersNeedingMinutesPerGame.get(gameId) || new Set();
        const totalMinutes = gameMinutesPerGame.get(gameId) || 0;

        // A game needs minutes if:
        // 1. Some players have no data at all, OR
        // 2. Total minutes is not exactly 200 (allowing 1 minute tolerance)
        const hasMissingData = needingMinutes.size > 0;
        const isInvalidTotal = Math.abs(totalMinutes - 200) > 1;

        // Only count players who actually need minutes, not all players
        const finalNeedingMinutes = hasMissingData ? needingMinutes.size : (isInvalidTotal ? players.size : 0);

        gameStats.set(gameId, {
          totalPlayers: players.size,
          needingMinutes: finalNeedingMinutes,
          totalMinutes: totalMinutes
        });
      });

      // Also include games that don't have any box_scores yet (all players need minutes)
      (allGames || []).forEach(game => {
        if (!gameStats.has(game.game_id)) {
          gameStats.set(game.game_id, {
            totalPlayers: 0, // No players recorded yet
            needingMinutes: 0, // Will be handled differently in UI
            totalMinutes: 0 // No minutes recorded yet
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
