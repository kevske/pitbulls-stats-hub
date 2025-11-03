import { PlayerGameLog } from "@/types/stats";

interface StatImprovement {
  category: string;
  improvement: number;
  currentValue: number;
  previousValue: number;
}

export function getPlayerImprovements(
  playerId: string,
  currentGameNumber: number,
  allGameLogs: PlayerGameLog[]
): StatImprovement[] {
  // Filter logs for this player and sort by game number
  const playerLogs = allGameLogs
    .filter(log => log.playerId === playerId && log.gameNumber <= currentGameNumber)
    .sort((a, b) => a.gameNumber - b.gameNumber);

  // We need at least 2 games to calculate improvement
  if (playerLogs.length < 2) return [];

  const currentGame = playerLogs[playerLogs.length - 1];
  const previousGame = playerLogs[playerLogs.length - 2];

  // Convert minutes played from 'MM:SS' to minutes (float)
  const parseMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return minutes + (seconds / 60);
  };

  const currentMinutes = parseMinutes(currentGame.minutesPlayed);
  const previousMinutes = parseMinutes(previousGame.minutesPlayed);

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

export function getTopImprovement(
  playerId: string,
  currentGameNumber: number,
  allGameLogs: PlayerGameLog[]
): StatImprovement | null {
  const improvements = getPlayerImprovements(playerId, currentGameNumber, allGameLogs);
  return improvements.length > 0 ? improvements[0] : null;
}
