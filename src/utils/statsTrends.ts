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
  // Find the two most recent games for this player with playing time
  // Optimization: Single O(N) pass instead of filter().sort() (O(N) + O(M log M))
  // This avoids allocating a new array and sorting overhead

  let currentGame: PlayerGameLog | null = null;
  let previousGame: PlayerGameLog | null = null;

  for (const log of allGameLogs) {
    // 1. Filter checks
    if (log.playerId !== playerId) continue;
    if (log.gameNumber > currentGameNumber) continue;
    if ((log.minutesPlayed || 0) <= 0) continue;

    // 2. Track top 2 games by gameNumber
    if (!currentGame) {
      currentGame = log;
    } else if (log.gameNumber > currentGame.gameNumber) {
      previousGame = currentGame;
      currentGame = log;
    } else if (log.gameNumber === currentGame.gameNumber) {
       // Duplicate game number found. Prefer the one we just found if we want to be consistent
       // with stable sort or specific logic, but assuming unique game numbers per player/game:
       // If strictly equal, we ignore or replace. Let's ignore to match "first found" if sorted desc,
       // or if unsorted, it's ambiguous. But gameNumber should be unique per player.
       // No action needed.
    } else {
      // log is older than current
      if (!previousGame || log.gameNumber > previousGame.gameNumber) {
        previousGame = log;
      }
    }
  }

  // We need at least 2 games with playing time to calculate improvement
  if (!currentGame || !previousGame) return [];

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
  // Get all players with their improvements
  const playersWithImprovements = players.map(player => {
    const improvements = getPlayerImprovements(
      player.id,
      currentGameNumber,
      allGameLogs
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
