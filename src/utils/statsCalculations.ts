import { Game, GamePlayerStats } from "@/data/games";

export interface PlayerStats {
  games: number;
  points: number;
  twoPointers: number;
  threePointers: number;
  freeThrowsMade: number;
  freeThrowAttempts: number;
  fouls: number;
  minutesPlayed: number;
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

  // Calculate total minutes
  const totalMinutes = playerGames.reduce((sum, game) => {
    return sum + (game.minutesPlayed || 0);
  }, 0);

  return {
    games: playerGames.length,
    points: playerGames.reduce((sum, ps) => sum + (ps.points || 0), 0),
    twoPointers: playerGames.reduce((sum, ps) => sum + (ps.twoPointers || 0), 0),
    threePointers: playerGames.reduce((sum, ps) => sum + (ps.threePointers || 0), 0),
    freeThrowsMade: playerGames.reduce((sum, ps) => sum + (ps.freeThrowsMade || 0), 0),
    freeThrowAttempts: playerGames.reduce((sum, ps) => sum + (ps.freeThrowAttempts || 0), 0),
    fouls: playerGames.reduce((sum, ps) => sum + (ps.fouls || 0), 0),
    minutesPlayed: totalMinutes
  };
};

export const calculateAverages = (
  games: Game[],
  playerId: string,
  location?: "home" | "away"
): PlayerAverages => {
  const totals = calculateTotals(games, playerId, location);
  const gamesPlayed = totals.games || 1;

  return {
    games: totals.games,
    points: parseFloat((totals.points / gamesPlayed).toFixed(1)),
    twoPointers: parseFloat((totals.twoPointers / gamesPlayed).toFixed(1)),
    threePointers: parseFloat((totals.threePointers / gamesPlayed).toFixed(1)),
    freeThrowsMade: parseFloat((totals.freeThrowsMade / gamesPlayed).toFixed(1)),
    freeThrowAttempts: parseFloat((totals.freeThrowAttempts / gamesPlayed).toFixed(1)),
    fouls: parseFloat((totals.fouls / gamesPlayed).toFixed(1)),
    minutesPlayed: parseFloat((totals.minutesPlayed / gamesPlayed).toFixed(1))
  };
};

/**
 * @deprecated This function is no longer used internally and may be removed in future versions.
 */
export const getPlayerGames = (games: Game[], playerId: string) => {
  return games
    .filter((game) => game.playerStats.some((ps) => ps.playerId === playerId))
    .map((game) => ({
      ...game,
      stats: game.playerStats.find((ps) => ps.playerId === playerId)!,
    }));
};
