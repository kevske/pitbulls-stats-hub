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
  created_at: string;
  updated_at: string;
}

export interface BoxScore {
  id: string;
  game_id: string;
  team_id: string;
  player_first_name: string;
  player_last_name: string;
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

export interface GameWithDangerousPlayers extends Game {
  dangerous_players: DangerousPlayer[];
  dangerous_players_extended?: DangerousPlayer[];
}
