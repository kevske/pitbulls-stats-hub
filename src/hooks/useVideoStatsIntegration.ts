import { useState } from 'react';
import { SaveData } from '@/services/saveLoad';
import { SupabaseStatsService } from '@/services/supabaseStatsService';
import {
  convertVideoToPlayerGameLogs,
  convertVideoToGameStats,
  updatePlayerTotalsWithVideoData,

} from '@/services/videoToStatsHubBridge';
import { extractStatsFromVideoData } from '@/services/statsExtraction';
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
      saveToDb?: boolean;
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

      if (options.saveToDb) {
        // Extract detailed stats using the helper
        const extractedStats = extractStatsFromVideoData(videoData);

        // Create a map of Player Name -> Player Slug from existing totals
        const playerNameToSlug = new Map<string, string>();
        const playerIdToSlug = new Map<string, string>();

        existingPlayerTotals.forEach(p => {
          const fullName = `${p.firstName} ${p.lastName}`.toLowerCase().trim();
          playerNameToSlug.set(fullName, p.id);
          playerIdToSlug.set(p.id, p.id); // In case video already uses slugs
        });

        // Map to VideoStats format with ID resolution
        const videoStats = extractedStats.playerStats.map(stat => {
          // Try to find the correct player slug
          let targetPlayerId = stat.playerId;

          // 1. Try direct slug match
          if (playerIdToSlug.has(stat.playerId)) {
            targetPlayerId = stat.playerId;
          }
          // 2. Try name match
          else {
            const statName = stat.playerName.toLowerCase().trim();
            if (playerNameToSlug.has(statName)) {
              targetPlayerId = playerNameToSlug.get(statName)!;
            } else {
              console.warn(`Could not find matching player slug for video player: ${stat.playerName} (${stat.playerId})`);
            }
          }

          return {
            playerId: targetPlayerId,
            gameNumber: gameNumber,
            twoPointersMade: stat.fieldGoalsMade - stat.threePointersMade,
            twoPointersAttempted: stat.fieldGoalsAttempted - stat.threePointersAttempted,
            threePointersMade: stat.threePointersMade,
            threePointersAttempted: stat.threePointersAttempted,
            steals: stat.steals,
            blocks: stat.blocks,
            assists: stat.assists,
            rebounds: stat.rebounds,
            turnovers: stat.turnovers
          };
        });

        await SupabaseStatsService.saveVideoStats(videoStats);
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
