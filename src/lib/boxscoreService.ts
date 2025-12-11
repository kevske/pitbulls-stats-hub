import { supabase } from './supabase';
import { BoxScore, BoxScoreWithPlayerInfo } from '../types/supabase';

export class BoxscoreService {
  // Get box scores with player info (TSV Neuenstadt only)
  static async getBoxScoresWithPlayerInfo(teamId?: string): Promise<BoxScoreWithPlayerInfo[]> {
    const { data, error } = await supabase
      .from('player_stats_with_info')
      .select('*')
      .eq('team_id', teamId || 'tsv-neuenstadt')
      .order('scraped_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get player career stats
  static async getPlayerCareerStats(playerSlug: string): Promise<BoxScore[]> {
    const { data, error } = await supabase
      .from('box_scores')
      .select('*')
      .eq('player_slug', playerSlug)
      .order('scraped_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get player stats for a specific game
  static async getPlayerGameStats(gameId: string, playerSlug: string): Promise<BoxScore | null> {
    const { data, error } = await supabase
      .from('box_scores')
      .select('*')
      .eq('game_id', gameId)
      .eq('player_slug', playerSlug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Get TSV Neuenstadt players with unmatched boxscore records
  static async getUnmatchedPlayers(): Promise<{
    player_first_name: string;
    player_last_name: string;
    team_id: string;
    game_count: number;
  }[]> {
    const { data, error } = await supabase
      .rpc('get_unmatched_boxscore_players');

    if (error) throw error;
    return data || [];
  }

  // Link an unmatched boxscore player to player_info
  static async linkPlayer(
    gameIds: string[], 
    playerSlug: string
  ): Promise<void> {
    const { error } = await supabase
      .from('box_scores')
      .update({ player_slug: playerSlug })
      .in('game_id', gameIds);

    if (error) throw error;
  }

  // Get all box scores (original functionality)
  static async getAllBoxScores(): Promise<BoxScore[]> {
    const { data, error } = await supabase
      .from('box_scores')
      .select('*')
      .order('scraped_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get box scores by game
  static async getBoxScoresByGame(gameId: string): Promise<BoxScore[]> {
    const { data, error } = await supabase
      .from('box_scores')
      .select('*')
      .eq('game_id', gameId)
      .order('points', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get box scores by team
  static async getBoxScoresByTeam(teamId: string): Promise<BoxScore[]> {
    const { data, error } = await supabase
      .from('box_scores')
      .select('*')
      .eq('team_id', teamId)
      .order('scraped_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
