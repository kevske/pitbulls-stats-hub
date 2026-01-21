import { PlayerInfoService } from './playerInfoService';
import { SupabaseStatsService } from './supabaseStatsService';
import { PlayerStats } from '../types/stats';
import { BASE_PATH } from '../config';

// Service to fetch player data from Supabase with computed stats
export class SupabasePlayerService {
  static async fetchAllPlayers(): Promise<PlayerStats[]> {
    try {
      // Use the new Supabase stats service that includes computed statistics
      const { playerStats } = await SupabaseStatsService.fetchAllStatsData();
      return playerStats;
    } catch (error) {
      console.error('Error fetching players from Supabase:', error);
      // Fallback to basic player info if stats service fails
      const players = await PlayerInfoService.getAllPlayers();
      return players.map(player => ({
        id: player.player_slug,
        firstName: player.first_name,
        lastName: player.last_name,
        imageUrl: `${BASE_PATH}/players/${player.first_name.toLowerCase()}-${player.last_name.toLowerCase()}.jpg`,
        jerseyNumber: player.jersey_number || 0,
        position: player.position || '',
        age: player.birth_date ? new Date().getFullYear() - new Date(player.birth_date).getFullYear() : 0,
        height: player.height || '',
        bio: player.bio || '',
        gamesPlayed: 0,
        minutesPerGame: 0,
        pointsPerGame: 0,
        threePointersPerGame: 0,
        foulsPerGame: 0,
        freeThrowsMadePerGame: 0,
        freeThrowAttemptsPerGame: 0,
        freeThrowPercentage: '',
        pointsPer40: 0,
        threePointersPer40: 0,
        foulsPer40: 0
      }));
    }
  }

  static async fetchActivePlayers(): Promise<PlayerStats[]> {
    try {
      // Use the stats service and filter for active players
      const allPlayers = await this.fetchAllPlayers();
      return allPlayers; // The view already filters for active players
    } catch (error) {
      console.error('Error fetching active players from Supabase:', error);
      throw error;
    }
  }
}
