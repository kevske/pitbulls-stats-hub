import { useState } from 'react';
import { SaveData } from '@/services/saveLoad';
import {
  convertVideoToPlayerGameLogs,
  convertVideoToGameStats,
  updatePlayerTotalsWithVideoData,
  integrateVideoDataWithStatsHub
} from '@/services/videoToStatsHubBridge';
import { PlayerGameLog, GameStats, PlayerStats } from '@/types/stats';

export function useVideoStatsIntegration() {
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);

  const integrateVideoData = async (
    videoData: SaveData,
    gameNumber: number,
    options: {
      homeTeam?: string;
      awayTeam?: string;
      finalScore?: string;
      gameType?: string;
      updateExistingTotals?: boolean;
      existingPlayerTotals?: PlayerStats[];
    } = {}
  ) => {
    setIsIntegrating(true);
    setIntegrationError(null);

    try {
      const {
        homeTeam = 'Pitbulls',
        awayTeam = 'Opponent',
        finalScore,
        gameType = 'Heim',
        updateExistingTotals = false,
        existingPlayerTotals = []
      } = options;

      // Convert video data to stats hub format
      const gameLogs = convertVideoToPlayerGameLogs(videoData, gameNumber, gameType);
      const gameStats = convertVideoToGameStats(videoData, gameNumber, homeTeam, awayTeam, finalScore);

      let updatedPlayerTotals: PlayerStats[] = existingPlayerTotals;

      if (updateExistingTotals && existingPlayerTotals.length > 0) {
        updatedPlayerTotals = updatePlayerTotalsWithVideoData(existingPlayerTotals, videoData);
      }

      return {
        gameLogs,
        gameStats,
        updatedPlayerTotals,
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setIntegrationError(errorMessage);
      return {
        gameLogs: [],
        gameStats: null as any,
        updatedPlayerTotals: [],
        success: false,
        error: errorMessage
      };
    } finally {
      setIsIntegrating(false);
    }
  };

  return {
    integrateVideoData,
    isIntegrating,
    integrationError,
    clearError: () => setIntegrationError(null)
  };
}
