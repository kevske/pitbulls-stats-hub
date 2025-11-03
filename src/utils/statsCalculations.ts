import { Game, GamePlayerStats } from "@/data/games";

export interface PlayerStats {
  games: number;
  points: number;
  twoPointers: number;
  threePointers: number;
  freeThrowsMade: number;
  freeThrowAttempts: number;
  fouls: number;
  minutesPlayed: string;
}

export interface PlayerAverages extends Omit<PlayerStats, 'minutesPlayed'> {
  minutesPlayed: number;
}

export const calculateTotals = (
  games: Game[],
  playerId: string,
  location?: "home" | "away"
): PlayerStats => {
  const filteredGames = location
    ? games.filter((g) => g.location === location)
    : games;

  const playerGames = filteredGames
    .map((game) => game.playerStats.find((ps) => ps.playerId === playerId))
    .filter((ps): ps is GamePlayerStats => ps !== undefined);

  // Helper function to convert MM:SS to total minutes
  const parseMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [minutes = 0, seconds = 0] = timeStr.split(':').map(Number);
    return minutes + (seconds / 60);
  };

  // Calculate total minutes as a string in MM:SS format
  const totalMinutes = playerGames.reduce((sum, game) => {
    if (!game.minutesPlayed) return sum;
    try {
      const [minutes = 0, seconds = 0] = game.minutesPlayed.split(':').map(Number);
      return sum + (minutes * 60) + seconds;
    } catch (e) {
      return sum;
    }
  }, 0);

  // Convert total seconds back to MM:SS format
  const formatMinutes = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    games: playerGames.length,
    points: playerGames.reduce((sum, ps) => sum + (ps.points || 0), 0),
    twoPointers: playerGames.reduce((sum, ps) => sum + (ps.twoPointers || 0), 0),
    threePointers: playerGames.reduce((sum, ps) => sum + (ps.threePointers || 0), 0),
    freeThrowsMade: playerGames.reduce((sum, ps) => sum + (ps.freeThrowsMade || 0), 0),
    freeThrowAttempts: playerGames.reduce((sum, ps) => sum + (ps.freeThrowAttempts || 0), 0),
    fouls: playerGames.reduce((sum, ps) => sum + (ps.fouls || 0), 0),
    minutesPlayed: formatMinutes(totalMinutes)
  };
};

export const calculateAverages = (
  games: Game[],
  playerId: string,
  location?: "home" | "away"
): PlayerAverages => {
  const totals = calculateTotals(games, playerId, location);
  const gamesPlayed = totals.games || 1;

  // Calculate average minutes as a number (in minutes)
  const totalMinutes = playerGames.reduce((sum, game) => {
    if (!game.minutesPlayed) return sum;
    try {
      const [minutes = 0, seconds = 0] = game.minutesPlayed.split(':').map(Number);
      return sum + minutes + (seconds / 60);
    } catch (e) {
      return sum;
    }
  }, 0);

  return {
    games: totals.games,
    points: parseFloat((totals.points / gamesPlayed).toFixed(1)),
    twoPointers: parseFloat((totals.twoPointers / gamesPlayed).toFixed(1)),
    threePointers: parseFloat((totals.threePointers / gamesPlayed).toFixed(1)),
    freeThrowsMade: parseFloat((totals.freeThrowsMade / gamesPlayed).toFixed(1)),
    freeThrowAttempts: parseFloat((totals.freeThrowAttempts / gamesPlayed).toFixed(1)),
    fouls: parseFloat((totals.fouls / gamesPlayed).toFixed(1)),
    minutesPlayed: parseFloat((totalMinutes / gamesPlayed).toFixed(1))
  };
};

export const getPlayerGames = (games: Game[], playerId: string) => {
  return games
    .filter((game) => game.playerStats.some((ps) => ps.playerId === playerId))
    .map((game) => ({
      ...game,
      stats: game.playerStats.find((ps) => ps.playerId === playerId)!,
    }));
};
