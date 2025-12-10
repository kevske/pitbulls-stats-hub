import { SaveData } from '@/lib/saveLoad';
import { extractStatsFromVideoData } from '@/services/statsExtraction';
import { PlayerGameLog, GameStats, PlayerStats } from '@/types/stats';

export interface VideoToStatsHubBridge {
  convertVideoToGameLog: (saveData: SaveData, gameNumber: number, gameType: string) => PlayerGameLog[];
  convertVideoToGameStats: (saveData: SaveData, gameNumber: number, homeTeam: string, awayTeam: string, finalScore: string) => GameStats;
  updatePlayerTotalsWithVideoData: (existingTotals: PlayerStats[], videoData: SaveData) => PlayerStats[];
}

export function convertVideoToPlayerGameLogs(
  saveData: SaveData, 
  gameNumber: number, 
  gameType: string = 'Heim'
): PlayerGameLog[] {
  const extractedStats = extractStatsFromVideoData(saveData);
  
  return extractedStats.playerStats
    .filter(player => player.totalPoints > 0 || player.assists > 0 || player.rebounds > 0)
    .map(player => {
      // Calculate minutes played based on event timespan
      const minutesPlayed = saveData.metadata.totalTimeSpan > 0 
        ? Math.round(saveData.metadata.totalTimeSpan / 60)
        : 0;

      return {
        playerId: player.playerId,
        gameNumber,
        minutesPlayed,
        points: player.totalPoints,
        twoPointers: player.fieldGoalsMade - player.threePointersMade,
        threePointers: player.threePointersMade,
        freeThrowsMade: player.freeThrowsMade,
        freeThrowAttempts: player.freeThrowsAttempted,
        freeThrowPercentage: player.freeThrowPercentage > 0 ? `${player.freeThrowPercentage}%` : '',
        fouls: player.fouls,
        pointsPer40: minutesPlayed > 0 ? Math.round((player.totalPoints / minutesPlayed) * 40 * 10) / 10 : 0,
        freeThrowAttemptsPer40: minutesPlayed > 0 ? Math.round((player.freeThrowsAttempted / minutesPlayed) * 40 * 10) / 10 : 0,
        threePointersPer40: minutesPlayed > 0 ? Math.round((player.threePointersMade / minutesPlayed) * 40 * 10) / 10 : 0,
        foulsPer40: minutesPlayed > 0 ? Math.round((player.fouls / minutesPlayed) * 40 * 10) / 10 : 0,
        gameType
      };
    });
}

export function convertVideoToGameStats(
  saveData: SaveData,
  gameNumber: number,
  homeTeam: string = 'Pitbulls',
  awayTeam: string = 'Opponent',
  finalScore?: string
): GameStats {
  const extractedStats = extractStatsFromVideoData(saveData);
  const teamStats = extractedStats.teamStats;
  
  // Generate final score from team points if not provided
  const score = finalScore || `${teamStats.totalPoints}-?`;
  
  return {
    gameNumber,
    date: new Date().toISOString().split('T')[0], // Use current date or saveData timestamp
    homeTeam,
    awayTeam,
    finalScore: score,
    q1Score: '', // Could be calculated from quarter events if available
    halfTimeScore: '', // Could be calculated from halftime events if available
    q3Score: '', // Could be calculated from quarter events if available
    youtubeLink: saveData.videoId ? `https://youtube.com/watch?v=${saveData.videoId}` : undefined
  };
}

export function updatePlayerTotalsWithVideoData(
  existingTotals: PlayerStats[], 
  videoData: SaveData
): PlayerStats[] {
  const videoGameLogs = convertVideoToPlayerGameLogs(videoData, 999, 'Video'); // Use temporary game number
  
  // Create a map of existing player totals by playerId
  const playerTotalsMap = new Map<string, PlayerStats>();
  existingTotals.forEach(player => {
    playerTotalsMap.set(player.id, { ...player });
  });

  // Aggregate video stats for each player
  const videoStatsMap = new Map<string, {
    totalPoints: number;
    totalMinutes: number;
    totalGames: number;
    totalThrees: number;
    totalFouls: number;
    totalFTMade: number;
    totalFTAttempts: number;
  }>();

  videoGameLogs.forEach(gameLog => {
    const existing = videoStatsMap.get(gameLog.playerId) || {
      totalPoints: 0,
      totalMinutes: 0,
      totalGames: 0,
      totalThrees: 0,
      totalFouls: 0,
      totalFTMade: 0,
      totalFTAttempts: 0
    };

    existing.totalPoints += gameLog.points;
    existing.totalMinutes += gameLog.minutesPlayed;
    existing.totalGames += 1;
    existing.totalThrees += gameLog.threePointers;
    existing.totalFouls += gameLog.fouls;
    existing.totalFTMade += gameLog.freeThrowsMade;
    existing.totalFTAttempts += gameLog.freeThrowsAttempts;

    videoStatsMap.set(gameLog.playerId, existing);
  });

  // Update existing totals with video data
  videoStatsMap.forEach((videoStats, playerId) => {
    const existingPlayer = playerTotalsMap.get(playerId);
    if (existingPlayer) {
      // Update totals by adding video stats
      const newGamesPlayed = existingPlayer.gamesPlayed + videoStats.totalGames;
      const newTotalMinutes = (existingPlayer.minutesPerGame * existingPlayer.gamesPlayed) + videoStats.totalMinutes;
      const newTotalPoints = (existingPlayer.pointsPerGame * existingPlayer.gamesPlayed) + videoStats.totalPoints;
      const newTotalThrees = (existingPlayer.threePointersPerGame * existingPlayer.gamesPlayed) + videoStats.totalThrees;
      const newTotalFouls = (existingPlayer.foulsPerGame * existingPlayer.gamesPlayed) + videoStats.totalFouls;
      const newTotalFTMade = (existingPlayer.freeThrowsMadePerGame * existingPlayer.gamesPlayed) + videoStats.totalFTMade;
      const newTotalFTAttempts = (existingPlayer.freeThrowAttemptsPerGame * existingPlayer.gamesPlayed) + videoStats.totalFTAttempts;

      // Calculate new averages
      existingPlayer.gamesPlayed = newGamesPlayed;
      existingPlayer.minutesPerGame = newGamesPlayed > 0 ? Math.round((newTotalMinutes / newGamesPlayed) * 10) / 10 : 0;
      existingPlayer.pointsPerGame = newGamesPlayed > 0 ? Math.round((newTotalPoints / newGamesPlayed) * 10) / 10 : 0;
      existingPlayer.threePointersPerGame = newGamesPlayed > 0 ? Math.round((newTotalThrees / newGamesPlayed) * 10) / 10 : 0;
      existingPlayer.foulsPerGame = newGamesPlayed > 0 ? Math.round((newTotalFouls / newGamesPlayed) * 10) / 10 : 0;
      existingPlayer.freeThrowsMadePerGame = newGamesPlayed > 0 ? Math.round((newTotalFTMade / newGamesPlayed) * 10) / 10 : 0;
      existingPlayer.freeThrowAttemptsPerGame = newGamesPlayed > 0 ? Math.round((newTotalFTAttempts / newGamesPlayed) * 10) / 10 : 0;
      
      // Update percentages
      existingPlayer.freeThrowPercentage = newTotalFTAttempts > 0 
        ? `${Math.round((newTotalFTMade / newTotalFTAttempts) * 100)}%`
        : existingPlayer.freeThrowPercentage;
      
      // Update per-40 stats
      existingPlayer.pointsPer40 = existingPlayer.minutesPerGame > 0 
        ? Math.round((existingPlayer.pointsPerGame / existingPlayer.minutesPerGame) * 40 * 10) / 10 
        : 0;
      existingPlayer.threePointersPer40 = existingPlayer.minutesPerGame > 0 
        ? Math.round((existingPlayer.threePointersPerGame / existingPlayer.minutesPerGame) * 40 * 10) / 10 
        : 0;
      existingPlayer.foulsPer40 = existingPlayer.minutesPerGame > 0 
        ? Math.round((existingPlayer.foulsPerGame / existingPlayer.minutesPerGame) * 40 * 10) / 10 
        : 0;
    }
  });

  return Array.from(playerTotalsMap.values());
}

// Main integration function to feed video data back to stats hub
export function integrateVideoDataWithStatsHub(
  videoData: SaveData,
  gameNumber: number,
  homeTeam: string = 'Pitbulls',
  awayTeam: string = 'Opponent',
  finalScore?: string,
  gameType: string = 'Heim'
) {
  return {
    gameLogs: convertVideoToPlayerGameLogs(videoData, gameNumber, gameType),
    gameStats: convertVideoToGameStats(videoData, gameNumber, homeTeam, awayTeam, finalScore)
  };
}
