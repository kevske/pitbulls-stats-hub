import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameStatsService } from './gameStatsService';
import { VideoProjectService, VideoProject, SaveData } from './videoProjectService';
import { extractStatsFromVideoData, ExtractedGameStats } from './statsExtraction';

// Mock supabase lib to avoid environment variable check failure
vi.mock('@/lib/supabase', () => ({
  supabase: {}
}));

// Mock the dependencies
vi.mock('./videoProjectService');
vi.mock('./statsExtraction');

describe('GameStatsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlaylistTotalPoints', () => {
    it('calculates total points correctly from multiple projects', async () => {
      // Mock data
      const mockProjects = [
        { video_index: 1, id: '1' },
        { video_index: 2, id: '2' }
      ] as unknown as VideoProject[];
      const mockSaveData = { version: '1.0.0' } as unknown as SaveData;
      const mockStats = { teamStats: { totalPoints: 10 } } as unknown as ExtractedGameStats;

      // Setup mocks
      vi.mocked(VideoProjectService.getProjectsForGame).mockResolvedValue(mockProjects);
      vi.mocked(VideoProjectService.toSaveData).mockReturnValue(mockSaveData);
      vi.mocked(extractStatsFromVideoData).mockReturnValue(mockStats);

      // Execute
      const totalPoints = await GameStatsService.getPlaylistTotalPoints(123);

      // Verify
      expect(VideoProjectService.getProjectsForGame).toHaveBeenCalledWith(123);
      expect(VideoProjectService.toSaveData).toHaveBeenCalledTimes(2);
      expect(extractStatsFromVideoData).toHaveBeenCalledTimes(2);
      expect(totalPoints).toBe(20); // 10 + 10
    });

    it('excludes specified video index', async () => {
      const mockProjects = [
        { video_index: 1, id: '1' },
        { video_index: 2, id: '2' },
        { video_index: 3, id: '3' }
      ] as unknown as VideoProject[];
      const mockSaveData = { version: '1.0.0' } as unknown as SaveData;
      const mockStats = { teamStats: { totalPoints: 10 } } as unknown as ExtractedGameStats;

      vi.mocked(VideoProjectService.getProjectsForGame).mockResolvedValue(mockProjects);
      vi.mocked(VideoProjectService.toSaveData).mockReturnValue(mockSaveData);
      vi.mocked(extractStatsFromVideoData).mockReturnValue(mockStats);

      // Exclude video index 2
      const totalPoints = await GameStatsService.getPlaylistTotalPoints(123, 2);

      expect(VideoProjectService.toSaveData).toHaveBeenCalledTimes(2); // Should only process 1 and 3
      expect(totalPoints).toBe(20);
    });

    it('returns 0 if no projects found', async () => {
      vi.mocked(VideoProjectService.getProjectsForGame).mockResolvedValue([]);

      const totalPoints = await GameStatsService.getPlaylistTotalPoints(123);

      expect(totalPoints).toBe(0);
      expect(VideoProjectService.toSaveData).not.toHaveBeenCalled();
    });

    it('returns 0 on error', async () => {
      vi.mocked(VideoProjectService.getProjectsForGame).mockRejectedValue(new Error('DB Error'));

      // Spy on console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const totalPoints = await GameStatsService.getPlaylistTotalPoints(123);

      expect(totalPoints).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
