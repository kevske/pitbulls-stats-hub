import { useState } from 'react';
import { SaveData } from '@/services/saveLoad';
import { SupabaseStatsService } from '@/services/supabaseStatsService';
import {
  convertVideoToPlayerGameLogs,
  convertVideoToGameStats,
  updatePlayerTotalsWithVideoData,

} from '@/services/videoToStatsHubBridge';
import { extractStatsFromVideoData } from '@/services/statsExtraction';
import { PlayerGameLog, GameStats, PlayerStats, VideoGameStats } from '@/types/stats';

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

        // Create mapping lookups for robust ID resolution
        const playerNameToSlug = new Map<string, string>();
        const playerIdToSlug = new Map<string, string>();
        const playerJerseyToSlug = new Map<string, string>();

        existingPlayerTotals.forEach(p => {
          const fullName = `${p.firstName} ${p.lastName}`.toLowerCase().trim();
          playerNameToSlug.set(fullName, p.id);
          
          // Map both slug and internal UUID to the slug
          playerIdToSlug.set(p.id, p.id);
          if ((p as any).internalId) {
            playerIdToSlug.set((p as any).internalId, p.id);
          }

          if (p.jerseyNumber) {
            playerJerseyToSlug.set(p.jerseyNumber.toString(), p.id);
          }
        });

        // Map to VideoStats format with ID resolution
        const videoStats = extractedStats.playerStats.map(stat => {
          let targetPlayerId = stat.playerId;

          // Try to resolve the correct player slug (Preferred: Name > ID > Jersey)
          const statName = stat.playerName?.toLowerCase().trim();
          
          // 1. Try Name match (most reliable if name is provided)
          if (statName && playerNameToSlug.has(statName)) {
            targetPlayerId = playerNameToSlug.get(statName)!;
          }
          // 2. Try direct ID match (slug or internal UUID)
          else if (playerIdToSlug.has(stat.playerId)) {
            targetPlayerId = playerIdToSlug.get(stat.playerId)!;
          }
          // 3. Try Jersey Number match
          else if (playerJerseyToSlug.has(stat.jerseyNumber?.toString())) {
            targetPlayerId = playerJerseyToSlug.get(stat.jerseyNumber.toString())!;
          }
          // 4. Try treating the ID itself as a Jersey Number (common in some taggers)
          else if (playerJerseyToSlug.has(stat.playerId)) {
            targetPlayerId = playerJerseyToSlug.get(stat.playerId)!;
          }
          else {
            console.warn(`Could not find matching player slug for video player: ${stat.playerName} (ID: ${stat.playerId}, # ${stat.jerseyNumber})`);
          }

          return {
            playerId: targetPlayerId,
            gameNumber: gameNumber,
            twoPointersMade: stat.fieldGoalsMade - stat.threePointersMade,
            twoPointersAttempted: stat.fieldGoalsAttempted - stat.threePointersAttempted,
            threePointersMade: stat.threePointersMade,
            threePointersAttempted: stat.threePointersAttempted,
            freeThrowsMade: stat.freeThrowsMade,
            freeThrowsAttempted: stat.freeThrowsAttempted,
            fouls: stat.fouls,
            totalPoints: stat.totalPoints,
            steals: stat.steals,
            blocks: stat.blocks,
            assists: stat.assists,
            rebounds: stat.rebounds,
            turnovers: stat.turnovers
          };
        });

        await SupabaseStatsService.saveVideoStats(videoStats);

        // Save team-level game stats
        const teamStats = extractedStats.teamStats;
        const videoGameStats: VideoGameStats = {
          gameNumber: gameNumber,
          totalPoints: teamStats.totalPoints,
          totalAssists: teamStats.totalAssists,
          totalRebounds: teamStats.totalRebounds,
          totalSteals: teamStats.totalSteals,
          totalBlocks: teamStats.totalBlocks,
          totalTurnovers: teamStats.totalTurnovers,
          totalFouls: teamStats.totalFouls,
          teamFgPercentage: teamStats.teamFieldGoalPercentage,
          teamThreePtPercentage: teamStats.teamThreePointPercentage,
          teamFtPercentage: teamStats.teamFreeThrowPercentage
        };
        await SupabaseStatsService.saveVideoGameStats(videoGameStats);
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
