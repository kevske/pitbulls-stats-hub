import { PlayerInfoService } from './playerInfoService';
import { PlayerStats } from '../types/stats';
import { PlayerInfo } from '../types/supabase';
import { generateImageFilename } from '../data/api/statsService';

// Transform Supabase PlayerInfo to match PlayerStats interface
export function transformSupabasePlayerToStats(player: PlayerInfo): PlayerStats {
  const imageUrl = `/pitbulls-stats-hub/players/${generateImageFilename(player.first_name, player.last_name)}`;
  
  return {
    id: player.player_slug,
    firstName: player.first_name,
    lastName: player.last_name,
    imageUrl,
    jerseyNumber: player.jersey_number || 0,
    position: player.position || '',
    age: player.birth_date ? new Date().getFullYear() - new Date(player.birth_date).getFullYear() : 0,
    height: player.height || '',
    bio: player.bio || '',
    // Stats fields - set to 0 for now as Supabase only has basic info
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
  };
}

// Service to fetch player data from Supabase
export class SupabasePlayerService {
  static async fetchAllPlayers(): Promise<PlayerStats[]> {
    try {
      const players = await PlayerInfoService.getAllPlayers();
      return players.map(transformSupabasePlayerToStats);
    } catch (error) {
      console.error('Error fetching players from Supabase:', error);
      throw error;
    }
  }

  static async fetchActivePlayers(): Promise<PlayerStats[]> {
    try {
      const players = await PlayerInfoService.getActivePlayers();
      return players.map(transformSupabasePlayerToStats);
    } catch (error) {
      console.error('Error fetching active players from Supabase:', error);
      throw error;
    }
  }
}
