import { Game, GamePlayerStats } from "@/data/games";

export interface PlayerStats {
  games: number;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
}

export interface PlayerAverages extends PlayerStats {}

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

  return {
    games: playerGames.length,
    points: playerGames.reduce((sum, ps) => sum + ps.points, 0),
    assists: playerGames.reduce((sum, ps) => sum + ps.assists, 0),
    rebounds: playerGames.reduce((sum, ps) => sum + ps.rebounds, 0),
    steals: playerGames.reduce((sum, ps) => sum + ps.steals, 0),
    blocks: playerGames.reduce((sum, ps) => sum + ps.blocks, 0),
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
    assists: parseFloat((totals.assists / gamesPlayed).toFixed(1)),
    rebounds: parseFloat((totals.rebounds / gamesPlayed).toFixed(1)),
    steals: parseFloat((totals.steals / gamesPlayed).toFixed(1)),
    blocks: parseFloat((totals.blocks / gamesPlayed).toFixed(1)),
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
