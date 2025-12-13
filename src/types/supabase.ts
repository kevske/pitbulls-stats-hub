// Types for Supabase basketball data structure

export interface Game {
  id: string;
  game_id: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  game_date: string;
  game_time?: string;
  home_score?: number;
  away_score?: number;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  league_id: string;
  venue?: string;
  box_score_url?: string;
  quarter_scores?: {
    first_quarter_home?: number;
    first_quarter_away?: number;
    halftime_home?: number;
    halftime_away?: number;
    third_quarter_home?: number;
    third_quarter_away?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface BoxScore {
  id: string;
  game_id: string;
  team_id: string;
  player_first_name: string;
  player_last_name: string;
  player_slug?: string; // Foreign key to player_info (only for TSV Neuenstadt players)
  points: number;
  free_throw_attempts: number;
  free_throws_made: number;
  two_pointers: number;
  three_pointers: number;
  fouls: number;
  league_id: string;
  scraped_at: string;
  created_at: string;
  updated_at: string;
}

export interface BoxScoreWithPlayerInfo extends BoxScore {
  info_first_name?: string;
  info_last_name?: string;
  email?: string;
  jersey_number?: number;
  position?: string;
  height?: string;
  weight?: number;
  birth_date?: string;
  nationality?: string;
  bio?: string;
  achievements?: string[];
  social_links?: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  player_active?: boolean;
}

export interface DangerousPlayer {
  player: {
    first_name: string;
    last_name: string;
    team_id: string;
    full_name: string;
  };
  seasonStats: {
    totalPoints: number;
    avgPoints: number;
    totalThreePointers: number;
    avgThreePointers: number;
    totalFreeThrows: number;
    avgFreeThrows: number;
    avgFreeThrowAttempts: number;
    totalFouls: number;
    avgFouls: number;
    gamesPlayed: number;
    fouledOutGames: number;
  };
  recentStats: {
    lastTwoGames: {
      points: number;
      threePointers: number;
      freeThrows: number;
      game: Game;
    }[];
    avgPointsLastTwo: number;
    avgThreePointersLastTwo: number;
    avgFreeThrowsLastTwo: number;
  };
  dangerLevel: 'high' | 'medium' | 'low';
}

export interface PlayerInfo {
  id: string;
  player_slug: string; // e.g., "abdullah-ari"
  first_name: string;
  last_name: string;
  email?: string; // for magic link authentication
  jersey_number?: number;
  position?: string;
  height?: string; // e.g., "6'2\""
  weight?: number; // in kg
  birth_date?: string; // ISO date string
  nationality?: string;
  bio?: string;
  social_links?: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  old_data?: any;
  new_data?: any;
  user_email: string;
  user_id: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export interface Standing {
  id: string;
  team_id: string;
  team_name: string;
  league_id: string;
  position: number;
  games_played: number;
  wins: number;
  losses: number;
  points: number;
  points_for: number;
  points_against: number;
  scoring_difference: number;
  scraped_at: string;
  created_at: string;
  updated_at: string;
}

export interface GameWithDangerousPlayers extends Game {
  dangerous_players: DangerousPlayer[];
  dangerous_players_extended?: DangerousPlayer[];
}
