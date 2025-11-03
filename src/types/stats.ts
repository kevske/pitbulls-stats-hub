export interface PlayerStats {
  // Player info
  id: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  jerseyNumber?: number;
  position?: string;
  age?: number;
  bio?: string;
  
  // Game stats
  gamesPlayed: number;
  
  // Per-game stats (averages)
  minutesPerGame: number;
  pointsPerGame: number;
  threePointersPerGame: number;
  foulsPerGame: number;
  freeThrowPercentage: string;
  
  // Home game stats
  homeGames: number;
  homeMinutesPlayed: number;
  homePoints: number;
  homeThreePointers: number;
  homeFouls: number;
  
  // Away game stats
  awayGames: number;
  awayMinutesPlayed: number;
  awayPoints: number;
  awayThreePointers: number;
  awayFouls: number;
  
  // Total stats
  totalMinutes: number;
  totalPoints: number;
  totalThreePointers: number;
  totalFouls: number;
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
