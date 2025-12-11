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
        .not('player_slug', 'is', null)
        .gt('points', 0) // Only players who actually played
        .order('player_last_name, player_first_name');

      if (error) throw error;

      return (data || []).map(row => ({
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
        .select('minutes_played, points')
        .eq('game_id', gameNumber.toString())
        .not('player_slug', 'is', null)
        .gt('points', 0);

      if (error) throw error;

      const players = data || [];
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
    playersNeedingMinutes: number;
    totalPlayers: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('box_scores')
        .select('game_id, player_slug, points, minutes_played, game_date')
        .not('player_slug', 'is', null)
        .gt('points', 0);

      if (error) throw error;

      // Group by game and count
      const gameStats = new Map<string, { totalPlayers: number; needingMinutes: number; gameDate?: string }>();
      
      (data || []).forEach(row => {
        const gameId = row.game_id;
        const current = gameStats.get(gameId) || { totalPlayers: 0, needingMinutes: 0, gameDate: row.game_date };
        current.totalPlayers++;
        if ((row.minutes_played || 0) === 0) {
          current.needingMinutes++;
        }
        gameStats.set(gameId, current);
      });

      // Convert to expected format, but use game_id as string since we can't map to gameNumber
      return Array.from(gameStats.entries())
        .map(([gameId, stats]) => ({
          gameNumber: parseInt(gameId) || 0, // Convert to number, but this might not match CSV games
          gameDate: stats.gameDate,
          playersNeedingMinutes: stats.needingMinutes,
          totalPlayers: stats.totalPlayers
        }))
        .sort((a, b) => {
          // Sort by date if available, otherwise by gameNumber
          if (a.gameDate && b.gameDate) {
            return new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime();
          }
          return b.gameNumber - a.gameNumber;
        });
    } catch (error) {
      console.error('Error getting games needing minutes:', error);
      throw error;
    }
  }
}
