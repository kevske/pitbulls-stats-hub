import { PlayerGameLog } from "@/types/stats";

interface StatImprovement {
  category: string;
  improvement: number;
  currentValue: number;
  previousValue: number;
}

// Helper function to check if a player had playing time
const hasPlayedMinutes = (game: PlayerGameLog): boolean => {
  return (game.minutesPlayed || 0) > 0;
};

export function getPlayerImprovementsFromLogs(
  playerLogs: PlayerGameLog[],
  currentGameNumber: number
): StatImprovement[] {
  // Filter logs for this player, only include games with playing time, and sort by game number (newest first)
  const filteredLogs = playerLogs
    .filter(log =>
      log.gameNumber <= currentGameNumber &&
      hasPlayedMinutes(log)
    )
    .sort((a, b) => b.gameNumber - a.gameNumber);

  // We need at least 2 games with playing time to calculate improvement
  if (filteredLogs.length < 2) return [];

  // Always compare the two most recent games where player had playing time
  const currentGame = filteredLogs[0];
  const previousGame = filteredLogs[1];

  // Use minutes directly as they are already in numeric format
  const currentMinutes = currentGame.minutesPlayed || 0;
  const previousMinutes = previousGame.minutesPlayed || 0;

  const statCategories = [
    {
      key: 'points',
      label: 'Punkte',
      current: currentGame.points,
      previous: previousGame.points
    },
    {
      key: 'twoPointers',
      label: '2-Punkte',
      current: currentGame.twoPointers,
      previous: previousGame.twoPointers
    },
    {
      key: 'threePointers',
      label: '3-Punkte',
      current: currentGame.threePointers,
      previous: previousGame.threePointers
    },
    {
      key: 'freeThrowsMade',
      label: 'Freiwürfe',
      current: currentGame.freeThrowsMade,
      previous: previousGame.freeThrowsMade
    },
    {
      key: 'minutesPlayed',
      label: 'Spielzeit (Minuten)',
      current: currentMinutes,
      previous: previousMinutes
    }
  ];

  const improvements: StatImprovement[] = [];

  statCategories.forEach(({ key, label, current, previous }) => {
    // Skip if we don't have valid numbers to compare
    if (typeof current !== 'number' || typeof previous !== 'number') return;

    // Skip if previous value was 0 to avoid division by zero
    if (previous === 0) return;

    const improvement = ((current - previous) / previous) * 100;

    // Only include significant improvements (30% or more)
    if (improvement >= 30) {
      improvements.push({
        category: label,
        improvement: Math.round(improvement),
        currentValue: key === 'minutesPlayed' ? parseFloat(current.toFixed(1)) : current,
        previousValue: key === 'minutesPlayed' ? parseFloat(previous.toFixed(1)) : previous
      });
    }
  });

  // Sort by highest improvement first
  return improvements.sort((a, b) => b.improvement - a.improvement);
}

export function getPlayerImprovements(
  playerId: string,
  currentGameNumber: number,
  allGameLogs: PlayerGameLog[]
): StatImprovement[] {
  // Filter logs for this player
  const playerLogs = allGameLogs.filter(log => log.playerId === playerId);
  return getPlayerImprovementsFromLogs(playerLogs, currentGameNumber);
}

export function getTopImprovement(
  playerId: string,
  currentGameNumber: number,
  allGameLogs: PlayerGameLog[]
): StatImprovement | null {
  const improvements = getPlayerImprovements(playerId, currentGameNumber, allGameLogs);
  return improvements.length > 0 ? improvements[0] : null;
}

export interface PlayerTrendInfo {
  playerId: string;
  firstName: string;
  lastName: string;
  image: string;
  improvements: StatImprovement[];
  improvementCount: number;
}

export function getTopTrendingPlayers(
  players: Array<{ id: string; firstName: string; lastName: string; image?: string }>,
  currentGameNumber: number,
  allGameLogs: PlayerGameLog[],
  limit: number = 3
): PlayerTrendInfo[] {
  // Pre-compute logs map for O(1) lookup
  const logsMap = new Map<string, PlayerGameLog[]>();

  allGameLogs.forEach(log => {
    if (!logsMap.has(log.playerId)) {
      logsMap.set(log.playerId, []);
    }
    logsMap.get(log.playerId)!.push(log);
  });

  // Get all players with their improvements
  const playersWithImprovements = players.map(player => {
    // Use O(1) lookup instead of filtering all logs
    const playerLogs = logsMap.get(player.id) || [];
    
    const improvements = getPlayerImprovementsFromLogs(
      playerLogs,
      currentGameNumber
    );

    return {
      playerId: player.id,
      firstName: player.firstName,
      lastName: player.lastName,
      image: player.image || '/placeholder-player.png',
      improvements,
      improvementCount: improvements.length
    };
  });

  // Sort by number of improvements (descending) and get top N
  return playersWithImprovements
    .filter(player => player.improvementCount > 0)
    .sort((a, b) => b.improvementCount - a.improvementCount ||
                    b.improvements[0]?.improvement - (a.improvements[0]?.improvement || 0))
    .slice(0, limit);
}
