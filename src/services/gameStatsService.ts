import { VideoProjectService } from './videoProjectService';
import { extractStatsFromVideoData } from './statsExtraction';

export class GameStatsService {
  /**
   * Calculates the total points from all videos in a game playlist,
   * optionally excluding a specific video index.
   *
   * This is used to aggregate stats from multiple video projects that belong to the same game,
   * ensuring "tagging status" calculations reflect the entire game's progress.
   *
   * @param gameNumber The game number to fetch projects for
   * @param excludeVideoIndex Optional video index to exclude (typically the current video being edited)
   * @returns Promise resolving to the total points from the relevant projects
   */
  static async getPlaylistTotalPoints(gameNumber: number, excludeVideoIndex?: number): Promise<number> {
    try {
      // Fetch all projects for this game
      const allProjects = await VideoProjectService.getProjectsForGame(gameNumber);

      // Filter out the excluded video if specified
      // Note: DB video_index is 1-based
      const otherProjects = excludeVideoIndex !== undefined
        ? allProjects.filter(p => p.video_index !== excludeVideoIndex)
        : allProjects;

      let totalPoints = 0;

      for (const project of otherProjects) {
        // Convert to SaveData format
        const saveData = VideoProjectService.toSaveData(project);

        // Extract stats using the standard extraction logic
        const projectStats = extractStatsFromVideoData(saveData);

        // Aggregate points
        totalPoints += projectStats.teamStats.totalPoints;
      }

      return totalPoints;
    } catch (error) {
      console.error('Failed to fetch playlist stats for aggregation:', error);
      // Return 0 on error to allow the calling process to continue with available data
      return 0;
    }
  }
}
