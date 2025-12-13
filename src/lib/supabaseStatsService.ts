import { supabase } from './supabase';
import { PlayerStats, PlayerGameLog, GameStats } from '../types/stats';
import { generateImageFilename } from '../data/api/statsService';

// Transform Supabase player stats to match frontend PlayerStats interface
export function transformSupabaseStatsToPlayerStats(row: any): PlayerStats {
  const imageUrl = `/pitbulls-stats-hub/players/${generateImageFilename(row.first_name, row.last_name)}`;

  return {
    id: row.player_slug,
    firstName: row.first_name,
    lastName: row.last_name,
    imageUrl,
    jerseyNumber: row.jersey_number || 0,
    position: row.position || '',
    age: 0, // Not computed in Supabase yet
    height: row.height || '',
    bio: row.bio || '',
    gamesPlayed: Number(row.games_played) || 0,
    minutesPerGame: Number(row.minutes_per_game) || 0,
    pointsPerGame: Number(row.points_per_game) || 0,
    threePointersPerGame: Number(row.three_pointers_per_game) || 0,
    foulsPerGame: Number(row.fouls_per_game) || 0,
    freeThrowsMadePerGame: Number(row.free_throws_made_per_game) || 0,
    freeThrowAttemptsPerGame: Number(row.free_throw_attempts_per_game) || 0,
    freeThrowPercentage: row.free_throw_percentage || '',
    pointsPer40: Number(row.points_per_40) || 0,
    threePointersPer40: Number(row.three_pointers_per_40) || 0,
    foulsPer40: Number(row.fouls_per_40) || 0
  };
}

// Transform Supabase game logs to match frontend PlayerGameLog interface
export function transformSupabaseGameLog(row: any): PlayerGameLog {
  const minutesPlayed = Number(row.minutes_played) || 0;
  const threePointers = Number(row.three_pointers) || 0;

  return {
    playerId: row.player_slug,
    gameNumber: Number(row.game_id) || 0, // This might need adjustment based on game_id format
    minutesPlayed,
    points: Number(row.points) || 0,
    twoPointers: Number(row.two_pointers) || 0,
    threePointers,
    freeThrowsMade: Number(row.free_throws_made) || 0,
    freeThrowAttempts: Number(row.free_throw_attempts) || 0,
    freeThrowPercentage: row.free_throw_percentage || '',
    fouls: Number(row.fouls) || 0,
    pointsPer40: Number(row.points_per_40) || 0,
    freeThrowAttemptsPer40: Number(row.free_throw_attempts_per_40) || 0,
    threePointersPer40: Number(row.three_pointers_per_40) || 0,
    foulsPer40: Number(row.fouls_per_40) || 0,
    gameType: row.game_type || ''
  };
}

// Transform Supabase games to match frontend GameStats interface
export function transformSupabaseGame(row: any, index: number): GameStats {
  return {
    gameNumber: index + 1, // Start from 1
    date: row.game_date,
    homeTeam: row.home_team_name,
    awayTeam: row.away_team_name,
    finalScore: row.home_score !== null && row.away_score !== null ? `${row.home_score}:${row.away_score}` : '-',
    q1Score: '-', // Not available in Supabase yet
    halfTimeScore: '-', // Not available in Supabase yet
    q3Score: '-', // Not available in Supabase yet
    youtubeLink: undefined, // Will be set later from video_projects
    boxScoreUrl: row.box_score_url
  };
}

export class SupabaseStatsService {
  // Get all player stats from Supabase
  static async fetchAllPlayerStats(): Promise<PlayerStats[]> {
    try {
      const { data, error } = await supabase
        .from('player_season_totals')
        .select('*')
        .order('points_per_game', { ascending: false });

      if (error) throw error;
      return (data || []).map(transformSupabaseStatsToPlayerStats);
    } catch (error) {
      console.error('Error fetching player stats from Supabase:', error);
      throw error;
    }
  }

  // Get player stats by slug
  static async fetchPlayerStats(playerSlug: string): Promise<PlayerStats | null> {
    try {
      const { data, error } = await supabase
        .from('player_season_totals')
        .select('*')
        .eq('player_slug', playerSlug)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return data ? transformSupabaseStatsToPlayerStats(data) : null;
    } catch (error) {
      console.error('Error fetching player stats from Supabase:', error);
      throw error;
    }
  }

  // Get all player game logs
  static async fetchAllPlayerGameLogs(): Promise<PlayerGameLog[]> {
    try {
      const { data, error } = await supabase
        .from('player_game_logs')
        .select('*')
        .order('player_slug, game_id');

      if (error) throw error;
      return (data || []).map(transformSupabaseGameLog);
    } catch (error) {
      console.error('Error fetching game logs from Supabase:', error);
      throw error;
    }
  }

  // Get game logs for a specific player
  static async fetchPlayerGameLogs(playerSlug: string): Promise<PlayerGameLog[]> {
    try {
      const { data, error } = await supabase
        .from('player_game_logs')
        .select('*')
        .eq('player_slug', playerSlug)
        .order('game_id');

      if (error) throw error;
      return (data || []).map(transformSupabaseGameLog);
    } catch (error) {
      console.error('Error fetching player game logs from Supabase:', error);
      throw error;
    }
  }

  // Get all games
  static async fetchAllGames(): Promise<GameStats[]> {
    try {
      // Fetch games
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .order('game_date', { ascending: true });

      if (gamesError) throw gamesError;

      // Fetch video projects to link youtube videos
      const { data: videoProjects, error: videoError } = await supabase
        .from('video_projects')
        .select('*');

      if (videoError) {
        console.warn('Error fetching video projects:', videoError);
        // Continue without videos if that fails
      }

      // Create a map of game number to youtube link
      const videoMap = new Map<number, string>();
      if (videoProjects) {
        videoProjects.forEach((vp: any) => {
          const gameNum = parseInt(vp.game_number);
          if (!isNaN(gameNum)) {
            // Construct youtube link
            let link = '';
            if (vp.video_id) {
              link = `https://www.youtube.com/watch?v=${vp.video_id}`;
            } else if (vp.playlist_id) {
              link = `https://www.youtube.com/playlist?list=${vp.playlist_id}`;
            }

            if (link) {
              videoMap.set(gameNum, link);
            }
          }
        });
      }

      return (gamesData || []).map((row, index) => {
        const gameStats = transformSupabaseGame(row, index);
        // Attach video link if available
        const videoLink = videoMap.get(gameStats.gameNumber);
        if (videoLink) {
          gameStats.youtubeLink = videoLink;
        }
        return gameStats;
      });
    } catch (error) {
      console.error('Error fetching games from Supabase:', error);
      throw error;
    }
  }

  // Get comprehensive stats data (both player totals, game logs, and games)
  static async fetchAllStatsData(): Promise<{
    playerStats: PlayerStats[];
    gameLogs: PlayerGameLog[];
    games: GameStats[];
  }> {
    try {
      const [playerStats, gameLogs, games] = await Promise.all([
        this.fetchAllPlayerStats(),
        this.fetchAllPlayerGameLogs(),
        this.fetchAllGames()
      ]);

      return { playerStats, gameLogs, games };
    } catch (error) {
      console.error('Error fetching stats data from Supabase:', error);
      throw error;
    }
  }
}
