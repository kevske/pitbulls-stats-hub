export interface GamePlayerStats {
  playerId: string;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  minutes?: number;
}

export interface Game {
  id: string;
  date: string; // ISO format
  opponent: string;
  location: "home" | "away";
  result?: "win" | "loss";
  playerStats: GamePlayerStats[];
}

export const games: Game[] = [
  {
    id: "game-1",
    date: "2024-10-05",
    opponent: "Rot-Weiß Stuttgart",
    location: "home",
    result: "win",
    playerStats: [
      { playerId: "1", points: 24, assists: 5, rebounds: 8, steals: 3, blocks: 1, minutes: 32 },
      { playerId: "2", points: 18, assists: 12, rebounds: 4, steals: 2, blocks: 0, minutes: 35 },
      { playerId: "3", points: 15, assists: 3, rebounds: 11, steals: 1, blocks: 4, minutes: 30 },
      { playerId: "4", points: 12, assists: 7, rebounds: 3, steals: 4, blocks: 0, minutes: 28 },
      { playerId: "5", points: 8, assists: 2, rebounds: 6, steals: 2, blocks: 2, minutes: 25 },
      { playerId: "6", points: 6, assists: 4, rebounds: 2, steals: 1, blocks: 0, minutes: 20 },
    ],
  },
  {
    id: "game-2",
    date: "2024-10-12",
    opponent: "TSV Crailsheim",
    location: "away",
    result: "loss",
    playerStats: [
      { playerId: "1", points: 19, assists: 4, rebounds: 7, steals: 2, blocks: 0, minutes: 30 },
      { playerId: "2", points: 15, assists: 9, rebounds: 3, steals: 1, blocks: 1, minutes: 32 },
      { playerId: "3", points: 13, assists: 2, rebounds: 9, steals: 0, blocks: 3, minutes: 28 },
      { playerId: "4", points: 10, assists: 5, rebounds: 2, steals: 3, blocks: 0, minutes: 26 },
      { playerId: "5", points: 7, assists: 1, rebounds: 5, steals: 1, blocks: 1, minutes: 22 },
      { playerId: "6", points: 4, assists: 3, rebounds: 1, steals: 0, blocks: 0, minutes: 18 },
    ],
  },
  {
    id: "game-3",
    date: "2024-10-19",
    opponent: "VfL Kirchheim",
    location: "home",
    result: "win",
    playerStats: [
      { playerId: "1", points: 28, assists: 6, rebounds: 9, steals: 4, blocks: 2, minutes: 34 },
      { playerId: "2", points: 20, assists: 11, rebounds: 5, steals: 2, blocks: 0, minutes: 36 },
      { playerId: "3", points: 16, assists: 4, rebounds: 12, steals: 2, blocks: 5, minutes: 32 },
      { playerId: "4", points: 14, assists: 8, rebounds: 4, steals: 5, blocks: 1, minutes: 30 },
      { playerId: "5", points: 9, assists: 3, rebounds: 7, steals: 3, blocks: 3, minutes: 27 },
      { playerId: "6", points: 7, assists: 5, rebounds: 3, steals: 2, blocks: 1, minutes: 22 },
    ],
  },
  {
    id: "game-4",
    date: "2024-10-26",
    opponent: "SG Heilbronn",
    location: "away",
    result: "win",
    playerStats: [
      { playerId: "1", points: 22, assists: 5, rebounds: 8, steals: 3, blocks: 1, minutes: 31 },
      { playerId: "2", points: 17, assists: 10, rebounds: 4, steals: 1, blocks: 0, minutes: 33 },
      { playerId: "3", points: 14, assists: 3, rebounds: 10, steals: 1, blocks: 4, minutes: 29 },
      { playerId: "4", points: 11, assists: 6, rebounds: 3, steals: 4, blocks: 0, minutes: 27 },
      { playerId: "5", points: 8, assists: 2, rebounds: 6, steals: 2, blocks: 2, minutes: 24 },
      { playerId: "6", points: 5, assists: 4, rebounds: 2, steals: 1, blocks: 0, minutes: 19 },
    ],
  },
];
