import { supabase } from './supabase';
import { Game } from '../types/supabase';
import { BasketballBundCrawler, ParsedGameResult } from './basketballBundCrawler';

export class QuarterScoresService {
  /**
   * Update a game with quarter scores from basketball-bund.net
   */
  static async updateGameWithQuarterScores(
    gameId: string, 
    basketballBundUrl: string
  ): Promise<boolean> {
    try {
      // Fetch quarter scores from basketball-bund.net
      const quarterData = await BasketballBundCrawler.fetchQuarterScores(basketballBundUrl);
      
      if (!quarterData) {
        console.error('Failed to extract quarter scores from URL:', basketballBundUrl);
        return false;
      }

      // Update the game with quarter scores
      const { error } = await supabase
        .from('games')
        .update({
          quarter_scores: {
            first_quarter_home: quarterData.quarterScores.firstQuarter.home,
            first_quarter_away: quarterData.quarterScores.firstQuarter.away,
            halftime_home: quarterData.quarterScores.halftime.home,
            halftime_away: quarterData.quarterScores.halftime.away,
            third_quarter_home: quarterData.quarterScores.thirdQuarter.home,
            third_quarter_away: quarterData.quarterScores.thirdQuarter.away,
          },
          updated_at: new Date().toISOString()
        })
        .eq('game_id', gameId);

      if (error) {
        console.error('Error updating game with quarter scores:', error);
        return false;
      }

      console.log(`Successfully updated game ${gameId} with quarter scores`);
      return true;
    } catch (error) {
      console.error('Error in updateGameWithQuarterScores:', error);
      return false;
    }
  }

  /**
   * Get games that don't have quarter scores yet
   */
  static async getGamesWithoutQuarterScores(): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .is('quarter_scores', null)
      .not('box_score_url', 'is', null)
      .eq('status', 'finished');

    if (error) {
      console.error('Error fetching games without quarter scores:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Bulk update all games that are missing quarter scores
   */
  static async updateAllGamesWithQuarterScores(): Promise<void> {
    const games = await this.getGamesWithoutQuarterScores();
    console.log(`Found ${games.length} games without quarter scores`);

    for (const game of games) {
      if (game.box_score_url) {
        console.log(`Updating quarter scores for game ${game.game_id}: ${game.home_team_name} vs ${game.away_team_name}`);
        
        const success = await this.updateGameWithQuarterScores(
          game.game_id, 
          game.box_score_url
        );

        if (success) {
          console.log(`✓ Successfully updated game ${game.game_id}`);
        } else {
          console.log(`✗ Failed to update game ${game.game_id}`);
        }

        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Get quarter scores for a specific game
   */
  static async getGameQuarterScores(gameId: string): Promise<Game['quarter_scores'] | null> {
    const { data, error } = await supabase
      .from('games')
      .select('quarter_scores')
      .eq('game_id', gameId)
      .single();

    if (error) {
      console.error('Error fetching quarter scores:', error);
      return null;
    }

    return data?.quarter_scores || null;
  }

  /**
   * Parse quarter scores from HTML content (for testing/manual updates)
   */
  static parseQuarterScoresFromHtml(html: string): ParsedGameResult | null {
    return BasketballBundCrawler.extractQuarterScores(html);
  }
}
