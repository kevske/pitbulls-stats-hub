import { supabase } from '@/lib/supabase';

export class DataDebug {
  // Check actual game_id values in box_scores
  static async checkGameIds() {
    try {
      const { data, error } = await supabase
        .from('box_scores')
        .select('game_id')
        .limit(10);

      if (error) throw error;
      
      console.log('Sample game_id values from box_scores:', data);
      return data;
    } catch (error) {
      console.error('Error checking game_ids:', error);
      throw error;
    }
  }

  // Check games table structure
  static async checkGamesTable() {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('gameNumber, homeTeam, awayTeam')
        .limit(10);

      if (error) throw error;
      
      console.log('Sample games table data:', data);
      return data;
    } catch (error) {
      console.error('Error checking games table:', error);
      throw error;
    }
  }

  // Check distinct game_id values
  static async getDistinctGameIds() {
    try {
      const { data, error } = await supabase
        .from('box_scores')
        .select('game_id')
        .not('game_id', 'is', null);

      if (error) throw error;
      
      const distinctIds = [...new Set(data?.map(row => row.game_id))];
      console.log('Distinct game_id values:', distinctIds);
      return distinctIds;
    } catch (error) {
      console.error('Error getting distinct game_ids:', error);
      throw error;
    }
  }

  // Check if there's a game with ID 2786676
  static async checkSpecificGame(gameId: string) {
    try {
      const { data, error } = await supabase
        .from('box_scores')
        .select('*')
        .eq('game_id', gameId)
        .limit(5);

      if (error) throw error;
      
      console.log(`Data for game_id ${gameId}:`, data);
      return data;
    } catch (error) {
      console.error(`Error checking game ${gameId}:`, error);
      throw error;
    }
  }
}
