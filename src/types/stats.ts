export interface PlayerStats {
  id: string;
  firstName: string;
  lastName: string;
  gamesPlayed: number;
  minutesPerGame: number;
  pointsPerGame: number;
  threePointersPerGame: number;
  freeThrowPercentage: string;
  foulsPerGame: number;
  imageUrl: string;
  jerseyNumber?: number;
  position?: string;
  age?: number;
  bio?: string;
}

export interface GameStats {
  gameNumber: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  finalScore: string;
  q1Score: string;
  halfTimeScore: string;
  q3Score: string;
}

export interface PlayerGameLog {
  playerId: string;
  gameNumber: number;
  minutesPlayed: number; // Changed from string to number for decimal minutes
  points: number;
  twoPointers: number;
  threePointers: number;
  freeThrowsMade: number;
  freeThrowAttempts: number;
  fouls: number;
}

export interface CachedData<T> {
  data: T[];
  timestamp: number;
}
