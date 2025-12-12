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
        .eq('team_id', '168416') // Only TSV Neuenstadt players
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
      const { data, error } = await supabase
        .from('box_scores')
        .select('minutes_played, points, player_slug')
        .eq('game_id', gameNumber.toString())
        .eq('team_id', '168416') // Only TSV Neuenstadt players
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
      // First, get all games from the database that involve TSV Neuenstadt
      const { data: allGames, error: allGamesError } = await supabase
        .from('games')
        .select('game_id, home_team_name, away_team_name, game_date')
        .or('home_team_name.ilike.%TSV Neuenstadt%,away_team_name.ilike.%TSV Neuenstadt%')
        .order('game_date', { ascending: false });

      if (allGamesError) throw allGamesError;

      console.log('All TSV Neuenstadt games:', allGames?.length || 0);

      // Get box_scores data for all these games - only for TSV Neuenstadt players
      const gameIds = allGames?.map(g => g.game_id) || [];
      const { data: boxScoresData, error: boxScoresError } = await supabase
        .from('box_scores')
        .select('game_id, player_slug, points, minutes_played')
        .eq('team_id', '168416') // Only TSV Neuenstadt players
        .not('player_slug', 'is', null)
        .gt('points', 0) // Only players who actually played
        .in('game_id', gameIds);

      if (boxScoresError) throw boxScoresError;

      console.log('Box scores records found:', boxScoresData?.length || 0);

      // Create a map for quick game info lookup
      const gameInfoMap = new Map<string, {
        homeTeam: string;
        awayTeam: string;
        gameDate: string;
      }>();
      
      (allGames || []).forEach(game => {
        gameInfoMap.set(game.game_id, {
          homeTeam: game.home_team_name,
          awayTeam: game.away_team_name,
          gameDate: game.game_date
        });
      });

      // Group by game and count unique players
      const gameStats = new Map<string, { 
        totalPlayers: number; 
        needingMinutes: number; 
      }>();
      
      // Use a Set to track unique players per game
      const uniquePlayersPerGame = new Map<string, Set<string>>();
      const playersNeedingMinutesPerGame = new Map<string, Set<string>>();
      
      (boxScoresData || []).forEach(row => {
        const gameId = row.game_id;
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
