export interface PlayerStats {
  // Player info (from Bio CSV)
  id: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  jerseyNumber?: number;
  position?: string;
  age?: number;
  height?: string;
  bio?: string;

  // Stats from Totals CSV (all games combined)
  gamesPlayed: number;
  minutesPerGame: number;
  pointsPerGame: number;
  threePointersPerGame: number;
  foulsPerGame: number;
  freeThrowsMadePerGame: number;
  freeThrowAttemptsPerGame: number;
  freeThrowPercentage: string;
  pointsPer40: number;
  threePointersPer40: number;
  foulsPer40: number;
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
  youtubeLink?: string; // Keep for backward compatibility
  youtubeLinks?: string[]; // New field for multiple videos
  boxScoreUrl?: string;
}

export interface PlayerGameLog {
  playerId: string;
  gameNumber: number;
  minutesPlayed: number;
  points: number;
  twoPointers: number;
  threePointers: number;
  freeThrowsMade: number;
  freeThrowAttempts: number;
  freeThrowPercentage: string;
  fouls: number;
  pointsPer40: number;
  freeThrowAttemptsPer40: number;
  foulsPer40: number;
  threePointersPer40: number;
  gameType: string; // "Heim" or "Auswärts"
}

export interface CachedData<T> {
  data: T[];
  timestamp: number;
}
