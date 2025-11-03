export interface GamePlayerStats {
  playerId: string;
  points: number;
  twoPointers: number;
  threePointers: number;
  freeThrowsMade: number;
  freeThrowAttempts: number;
  fouls: number;
  minutesPlayed: string;
}

export interface Game {
  id: string;
  date: string; // ISO format
  opponent: string;
  location: "home" | "away";
  result: "win" | "loss";
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
      { playerId: "1", points: 24, twoPointers: 8, threePointers: 2, freeThrowsMade: 2, freeThrowAttempts: 4, fouls: 2, minutesPlayed: "32:00" },
      { playerId: "2", points: 18, twoPointers: 5, threePointers: 2, freeThrowsMade: 2, freeThrowAttempts: 2, fouls: 1, minutesPlayed: "35:00" },
      { playerId: "3", points: 15, twoPointers: 4, threePointers: 2, freeThrowsMade: 1, freeThrowAttempts: 2, fouls: 3, minutesPlayed: "30:00" },
      { playerId: "4", points: 12, twoPointers: 4, threePointers: 1, freeThrowsMade: 1, freeThrowAttempts: 2, fouls: 2, minutesPlayed: "28:00" },
      { playerId: "5", points: 8, twoPointers: 4, threePointers: 0, freeThrowsMade: 0, freeThrowAttempts: 0, fouls: 4, minutesPlayed: "25:00" },
      { playerId: "6", points: 6, twoPointers: 3, threePointers: 0, freeThrowsMade: 0, freeThrowAttempts: 0, fouls: 1, minutesPlayed: "20:00" },
    ],
  },
  {
    id: "game-2",
    date: "2024-10-12",
    opponent: "TSV Crailsheim",
    location: "away",
    result: "loss",
    playerStats: [
      { playerId: "1", points: 19, twoPointers: 6, threePointers: 2, freeThrowsMade: 1, freeThrowAttempts: 2, fouls: 1, minutesPlayed: "30:00" },
      { playerId: "2", points: 15, twoPointers: 4, threePointers: 1, freeThrowsMade: 4, freeThrowAttempts: 4, fouls: 2, minutesPlayed: "32:00" },
      { playerId: "3", points: 13, twoPointers: 4, threePointers: 1, freeThrowsMade: 2, freeThrowAttempts: 2, fouls: 3, minutesPlayed: "28:00" },
      { playerId: "4", points: 10, twoPointers: 4, threePointers: 0, freeThrowsMade: 2, freeThrowAttempts: 4, fouls: 2, minutesPlayed: "26:00" },
      { playerId: "5", points: 7, twoPointers: 2, threePointers: 1, freeThrowsMade: 0, freeThrowAttempts: 0, fouls: 4, minutesPlayed: "22:00" },
      { playerId: "6", points: 4, twoPointers: 2, threePointers: 0, freeThrowsMade: 0, freeThrowAttempts: 0, fouls: 1, minutesPlayed: "18:00" },
    ],
  },
  {
    id: "game-3",
    date: "2024-10-19",
    opponent: "VfL Kirchheim",
    location: "home",
    result: "win",
    playerStats: [
      { playerId: "1", points: 28, twoPointers: 9, threePointers: 2, freeThrowsMade: 4, freeThrowAttempts: 4, fouls: 1, minutesPlayed: "34:00" },
      { playerId: "2", points: 20, twoPointers: 5, threePointers: 2, freeThrowsMade: 4, freeThrowAttempts: 4, fouls: 2, minutesPlayed: "36:00" },
      { playerId: "3", points: 16, twoPointers: 5, threePointers: 1, freeThrowsMade: 3, freeThrowAttempts: 4, fouls: 3, minutesPlayed: "32:00" },
      { playerId: "4", points: 14, twoPointers: 5, threePointers: 1, freeThrowsMade: 1, freeThrowAttempts: 2, fouls: 2, minutesPlayed: "30:00" },
      { playerId: "5", points: 9, twoPointers: 3, threePointers: 1, freeThrowsMade: 0, freeThrowAttempts: 0, fouls: 4, minutesPlayed: "27:00" },
      { playerId: "6", points: 7, twoPointers: 2, threePointers: 1, freeThrowsMade: 0, freeThrowAttempts: 0, fouls: 1, minutesPlayed: "22:00" },
    ],
  },
  {
    id: "game-4",
    date: "2024-10-26",
    opponent: "SG Heilbronn",
    location: "away",
    result: "win",
    playerStats: [
      { playerId: "1", points: 22, twoPointers: 7, threePointers: 2, freeThrowsMade: 2, freeThrowAttempts: 2, fouls: 1, minutesPlayed: "31:00" },
      { playerId: "2", points: 17, twoPointers: 4, threePointers: 2, freeThrowsMade: 3, freeThrowAttempts: 4, fouls: 2, minutesPlayed: "33:00" },
      { playerId: "3", points: 14, twoPointers: 5, threePointers: 1, freeThrowsMade: 1, freeThrowAttempts: 2, fouls: 3, minutesPlayed: "29:00" },
      { playerId: "4", points: 11, twoPointers: 4, threePointers: 1, freeThrowsMade: 0, freeThrowAttempts: 0, fouls: 2, minutesPlayed: "27:00" },
      { playerId: "5", points: 8, twoPointers: 4, threePointers: 0, freeThrowsMade: 0, freeThrowAttempts: 0, fouls: 4, minutesPlayed: "24:00" },
      { playerId: "6", points: 5, twoPointers: 2, threePointers: 0, freeThrowsMade: 1, freeThrowAttempts: 2, fouls: 1, minutesPlayed: "19:00" },
    ],
  },
];
