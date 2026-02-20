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
  weight?: number;
  birthDate?: string;
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
  videoData?: { link: string; events: any[]; players: any[]; videoIndex: number; metadata?: any }[]; // Full video data with events and players
  boxScoreUrl?: string;
  gameId?: string; // Real Supabase game_id (e.g., "2786721")
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

export interface VideoStats {
  id?: string;
  playerId: string;
  gameNumber: number;
  twoPointersMade: number;
  twoPointersAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  steals: number;
  blocks: number;
  assists: number;
  rebounds: number;
  turnovers: number;
}

export interface CachedData<T> {
  data: T[];
  timestamp: number;
}
