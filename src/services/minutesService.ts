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
      // First, get the game info to determine which team is TSV Neuenstadt
      // Try finding by tsv_game_number (priority) or game_id
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('game_id, home_team_name, away_team_name, home_team_id, away_team_id')
        .or(`game_id.eq.${gameNumber},tsv_game_number.eq.${gameNumber}`)
        .limit(1)
        .maybeSingle();

      if (gameError) throw gameError;
      if (!gameData) {
        console.error('Game not found:', gameNumber);
        return [];
      }

      // IMPORTANT: Use the actual game_id (Match ID, e.g. "2786721") for box_score lookups, 
      // even if we searched by "9"
      const realGameId = gameData.game_id;

      // Determine which team ID represents TSV Neuenstadt
      const isTSVNeuenstadtHome = gameData.home_team_name?.toLowerCase().includes('neuenstadt');
      const tsvNeuenstadtTeamId = isTSVNeuenstadtHome ? gameData.home_team_id : gameData.away_team_id;

      if (!tsvNeuenstadtTeamId) {
        console.warn('Could not determine TSV Neuenstadt team ID for game:', gameNumber);
        return [];
      }

      // Fetch active roster for name-to-slug lookup
      const { data: rosterPlayers, error: rosterError } = await supabase
        .from('player_info')
        .select('player_slug, first_name, last_name')
        .eq('is_active', true);

      if (rosterError) console.error("Roster fetch warning", rosterError);

      const rosterMap = new Map<string, string>();
      (rosterPlayers || []).forEach(p => {
        const nameKey = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().trim();
        rosterMap.set(nameKey, p.player_slug);
      });

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
        .eq('game_id', realGameId)
        .eq('team_id', tsvNeuenstadtTeamId) // Only TSV Neuenstadt players
        .order('player_last_name, player_first_name');

      if (error) throw error;

      // Check if we found any players
      if (!data || data.length === 0) {
        // Use the already fetched roster as fallback
        return (rosterPlayers || []).map(player => ({
          playerId: player.player_slug,
          playerSlug: player.player_slug,
          firstName: player.first_name,
          lastName: player.last_name,
          minutes: 0,
          gameId: realGameId,
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

      return Array.from(uniquePlayers.values()).map(row => {
        // Try to find the correct slug if missing
        let usedSlug = row.player_slug;

        if (!usedSlug) {
          // Try lookup in active roster by name
          const nameToMatch = `${row.player_first_name || ''} ${row.player_last_name || ''}`.toLowerCase().trim();
          if (rosterMap.has(nameToMatch)) {
            usedSlug = rosterMap.get(nameToMatch);
          }
        }

        // Generate a slug if STILL missing (e.g. "Markus Maurer" who is not in roster yet)
        const generatedSlug = usedSlug ||
          `${row.player_first_name || ''} ${row.player_last_name || ''}`
            .toLowerCase()
            .trim()
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss')
            .replace(/\s+/g, '-') // Replace spaces with dashes
            .replace(/[^a-z0-9-]/g, ''); // Remove other special chars

        return {
          playerId: generatedSlug,
          playerSlug: generatedSlug,
          firstName: row.player_first_name,
          lastName: row.player_last_name,
          minutes: row.minutes_played || 0,
          gameId: row.game_id,
          gameNumber: parseInt(row.game_id)
        };
      });
    } catch (error) {
      console.error('Error fetching players needing minutes:', error);
      throw error;
    }
  }

  // Update seconds for multiple players in a game
  // Now uses Edge Function for secure admin operations
  static async updatePlayerMinutes(
    gameNumber: number,
    playerSeconds: Array<{ playerId: string, seconds: number }>,
    adminPassword: string
  ): Promise<boolean> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-update-minutes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          gameNumber,
          playerSeconds,
          adminPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Edge function error:', result);
        throw new Error(result.message || result.error || 'Failed to update minutes');
      }

      return result.success !== false;
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
