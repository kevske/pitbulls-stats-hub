import { supabase } from './supabase';
import { PlayerStats, PlayerGameLog } from '../types/stats';
import { generateImageFilename } from '../data/api/statsService';

// Transform Supabase player stats to match frontend PlayerStats interface
export function transformSupabaseStatsToPlayerStats(row: any): PlayerStats {
  const imageUrl = `/pitbulls-stats-hub/players/${generateImageFilename(row.first_name, row.last_name)}`;
  
  return {
    id: row.player_slug,
    firstName: row.first_name,
    lastName: row.last_name,
    imageUrl,
    jerseyNumber: row.jersey_number || 0,
    position: row.position || '',
    age: 0, // Not computed in Supabase yet
    height: row.height || '',
    bio: row.bio || '',
    gamesPlayed: Number(row.games_played) || 0,
    minutesPerGame: Number(row.minutes_per_game) || 0,
    pointsPerGame: Number(row.points_per_game) || 0,
    threePointersPerGame: Number(row.three_pointers_per_game) || 0,
    foulsPerGame: Number(row.fouls_per_game) || 0,
    freeThrowsMadePerGame: Number(row.free_throws_made_per_game) || 0,
    freeThrowAttemptsPerGame: Number(row.free_throw_attempts_per_game) || 0,
    freeThrowPercentage: row.free_throw_percentage || '',
    pointsPer40: Number(row.points_per_40) || 0,
    threePointersPer40: Number(row.three_pointers_per_40) || 0,
    foulsPer40: Number(row.fouls_per_40) || 0
  };
}

// Transform Supabase game logs to match frontend PlayerGameLog interface
export function transformSupabaseGameLog(row: any): PlayerGameLog {
  return {
    playerId: row.player_slug,
    gameNumber: Number(row.game_id) || 0, // This might need adjustment based on game_id format
    minutesPlayed: Number(row.minutes_played) || 0,
    points: Number(row.points) || 0,
    twoPointers: Number(row.two_pointers) || 0,
    threePointers: Number(row.three_pointers) || 0,
    freeThrowsMade: Number(row.free_throws_made) || 0,
    freeThrowAttempts: Number(row.free_throw_attempts) || 0,
    freeThrowPercentage: row.free_throw_percentage || '',
    fouls: Number(row.fouls) || 0,
    pointsPer40: Number(row.points_per_40) || 0,
    freeThrowAttemptsPer40: Number(row.free_throw_attempts_per_40) || 0,
    threePointersPer40: Number(row.three_pointers_per_40) || 0,
    foulsPer40: Number(row.fouls_per_40) || 0,
    gameType: row.game_type || ''
  };
}

export class SupabaseStatsService {
  // Get all player stats from Supabase
  static async fetchAllPlayerStats(): Promise<PlayerStats[]> {
    try {
      const { data, error } = await supabase
        .from('player_season_totals')
        .select('*')
        .order('points_per_game', { ascending: false });

      if (error) throw error;
      return (data || []).map(transformSupabaseStatsToPlayerStats);
    } catch (error) {
      console.error('Error fetching player stats from Supabase:', error);
      throw error;
    }
  }

  // Get player stats by slug
  static async fetchPlayerStats(playerSlug: string): Promise<PlayerStats | null> {
    try {
      const { data, error } = await supabase
        .from('player_season_totals')
        .select('*')
        .eq('player_slug', playerSlug)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return data ? transformSupabaseStatsToPlayerStats(data) : null;
    } catch (error) {
      console.error('Error fetching player stats from Supabase:', error);
      throw error;
    }
  }

  // Get all player game logs
  static async fetchAllPlayerGameLogs(): Promise<PlayerGameLog[]> {
    try {
      const { data, error } = await supabase
        .from('player_game_logs')
        .select('*')
        .order('player_slug, game_id');

      if (error) throw error;
      return (data || []).map(transformSupabaseGameLog);
    } catch (error) {
      console.error('Error fetching game logs from Supabase:', error);
      throw error;
    }
  }

  // Get game logs for a specific player
  static async fetchPlayerGameLogs(playerSlug: string): Promise<PlayerGameLog[]> {
    try {
      const { data, error } = await supabase
        .from('player_game_logs')
        .select('*')
        .eq('player_slug', playerSlug)
        .order('game_id');

      if (error) throw error;
      return (data || []).map(transformSupabaseGameLog);
    } catch (error) {
      console.error('Error fetching player game logs from Supabase:', error);
      throw error;
    }
  }

  // Get comprehensive stats data (both player totals and game logs)
  static async fetchAllStatsData(): Promise<{
    playerStats: PlayerStats[];
    gameLogs: PlayerGameLog[];
  }> {
    try {
      const [playerStats, gameLogs] = await Promise.all([
        this.fetchAllPlayerStats(),
        this.fetchAllPlayerGameLogs()
      ]);

      return { playerStats, gameLogs };
    } catch (error) {
      console.error('Error fetching stats data from Supabase:', error);
      throw error;
    }
  }
}
