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
        .gt('points', 0) // Only players who actually played
        .order('player_last_name, player_first_name');

      if (error) throw error;

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
  static async updatePlayerMinutes(gameNumber: number, playerMinutes: Array<{playerId: string, minutes: number}>): Promise<boolean> {
    try {
      const updates = playerMinutes.map(({ playerId, minutes }) => ({
        game_id: gameNumber.toString(),
        player_slug: playerId,
        minutes_played: minutes // Store decimal minutes directly
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
        .select('minutes_played, points, player_slug, player_first_name, player_last_name')
        .eq('game_id', gameNumber.toString())
        .eq('team_id', tsvNeuenstadtTeamId) // Only TSV Neuenstadt players
        .gt('points', 0); // Only players who actually played

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
        .in('team_id', Array.from(tsvTeamIds))
        .gt('points', 0);

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

      // Group by game and count unique players
      const gameStats = new Map<string, { 
        totalPlayers: number; 
        needingMinutes: number; 
      }>();
      
      // Use a Set to track unique players per game (using player names since slug may be null)
      const uniquePlayersPerGame = new Map<string, Set<string>>();
      const playersNeedingMinutesPerGame = new Map<string, Set<string>>();
      
      (boxScoresData || []).forEach(row => {
        const gameId = row.game_id.toString(); // Ensure string key
        const playerKey = `${row.player_first_name}-${row.player_last_name}`;
        
        // Initialize sets if not exists
        if (!uniquePlayersPerGame.has(gameId)) {
          uniquePlayersPerGame.set(gameId, new Set());
          playersNeedingMinutesPerGame.set(gameId, new Set());
        }
        
        // Add to unique players set
        uniquePlayersPerGame.get(gameId)!.add(playerKey);
        
        // Add to needing minutes set if minutes are 0 or null
        if ((row.minutes_played || 0) === 0) {
          playersNeedingMinutesPerGame.get(gameId)!.add(playerKey);
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
