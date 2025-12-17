import { supabase } from './supabase';
import { PlayerStats, PlayerGameLog, GameStats } from '../types/stats';
import { generateImageFilename } from '../data/api/statsService';

// Calculate age from birth date
const calculateAge = (birthDate?: string): number => {
  if (!birthDate) return 0;
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  // Check if birth date is valid
  if (isNaN(birth.getTime())) return 0;
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Transform Supabase player stats to match frontend PlayerStats interface
export function transformSupabaseStatsToPlayerStats(row: any): PlayerStats {
  const imageUrl = `/pitbulls-stats-hub/players/${generateImageFilename(row.first_name, row.last_name)}`;
  
  // Handle direct birth_date field (now merged from player_info)
  const birthDate = row.birth_date || '';
  
  return {
    id: row.player_slug,
    firstName: row.first_name,
    lastName: row.last_name,
    imageUrl,
    jerseyNumber: row.jersey_number || 0,
    position: row.position || '',
    age: calculateAge(birthDate),
    height: row.height || '',
    weight: row.weight || 0,
    birthDate: birthDate,
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
export function transformSupabaseGameLog(row: any, gameNumberMap: Map<string, number>): PlayerGameLog {
  const minutesPlayed = Number(row.minutes_played) || 0;
  const threePointers = Number(row.three_pointers) || 0;

  // Calculate gameType based on home/away team information
  let gameType = '';
  if (row.games) {
    const homeTeam = row.games.home_team_name?.toLowerCase() || '';
    const awayTeam = row.games.away_team_name?.toLowerCase() || '';
    
    if (homeTeam.includes('neuenstadt') || homeTeam.includes('pitbull')) {
      gameType = 'Heim';
    } else if (awayTeam.includes('neuenstadt') || awayTeam.includes('pitbull')) {
      gameType = 'Auswärts';
    } else {
      gameType = row.game_type || 'Unbekannt';
    }
  } else {
    // Fallback to existing game_type if games join is not available
    gameType = row.game_type || '';
  }

  return {
    playerId: row.player_slug,
    gameNumber: gameNumberMap.get(row.game_id) || 0, // Use the mapped game number
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
    gameType
  };
}

// Transform Supabase games to match frontend GameStats interface
export function transformSupabaseGame(row: any, index: number): GameStats {
  // Check if this is a TSV Neuenstadt game
  const isNeuenstadtGame = row.home_team_name?.toLowerCase().includes('neuenstadt') || 
                           row.away_team_name?.toLowerCase().includes('neuenstadt') ||
                           row.home_team_name?.toLowerCase().includes('pitbull') || 
                           row.away_team_name?.toLowerCase().includes('pitbull');
  
  // Use TSV_game_number for TSV games, fallback to generated number for others
  let gameNumber: number;
  if (isNeuenstadtGame && row.tsv_game_number) {
    gameNumber = row.tsv_game_number;
  } else if (isNeuenstadtGame) {
    gameNumber = index + 1; // Fallback if TSV_game_number is not set yet
  } else {
    gameNumber = 999 + index; // Non-TSV games get high numbers
  }
  
  // Extract quarter scores from quarter_scores if available
  const q1Score = row.quarter_scores ? 
    `${row.quarter_scores.first_quarter_home || 0}:${row.quarter_scores.first_quarter_away || 0}` : '-';
  const halfTimeScore = row.quarter_scores ? 
    `${row.quarter_scores.halftime_home || 0}:${row.quarter_scores.halftime_away || 0}` : '-';
  const q3Score = row.quarter_scores ? 
    `${row.quarter_scores.third_quarter_home || 0}:${row.quarter_scores.third_quarter_away || 0}` : '-';
  
  return {
    gameNumber,
    date: row.game_date,
    homeTeam: row.home_team_name,
    awayTeam: row.away_team_name,
    finalScore: row.home_score !== null && row.away_score !== null ? `${row.home_score}:${row.away_score}` : '-',
    q1Score,
    halfTimeScore,
    q3Score,
    youtubeLink: undefined, // Will be set later from video_projects
    boxScoreUrl: row.box_score_url
  };
}

export class SupabaseStatsService {
  // Get all player stats from Supabase
  static async fetchAllPlayerStats(): Promise<PlayerStats[]> {
    try {
      // First fetch player stats
      const { data: playerStats, error: statsError } = await supabase
        .from('player_season_totals')
        .select('*')
        .order('points_per_game', { ascending: false });

      if (statsError) throw statsError;

      // Then fetch player info for birth dates
      const { data: playerInfo, error: infoError } = await supabase
        .from('player_info')
        .select('player_slug, birth_date');

      if (infoError) throw infoError;

      // Create a map of player_slug to birth_date
      const birthDateMap = new Map();
      (playerInfo || []).forEach(info => {
        birthDateMap.set(info.player_slug, info.birth_date);
      });

      // Merge birth dates into player stats
      return (playerStats || []).map(player => {
        const birthDate = birthDateMap.get(player.player_slug) || '';
        return transformSupabaseStatsToPlayerStats({
          ...player,
          birth_date: birthDate
        });
      });
    } catch (error) {
      console.error('Error fetching player stats from Supabase:', error);
      throw error;
    }
  };

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
  static async fetchAllPlayerGameLogs(gameNumberMap?: Map<string, number>): Promise<PlayerGameLog[]> {
    try {
      // Join with games table to get proper gameType calculation
      const { data, error } = await supabase
        .from('player_game_logs')
        .select(`
          *,
          games (
            home_team_name,
            away_team_name
          )
        `)
        .order('player_slug, game_id');

      if (error) throw error;
      const map = gameNumberMap || new Map();
      return (data || []).map(row => {
        const map = gameNumberMap || new Map();
        return transformSupabaseGameLog(row, map);
      });
    } catch (error) {
      console.error('Error fetching game logs from Supabase:', error);
      throw error;
    }
  }

  // Get game logs for a specific player
  static async fetchPlayerGameLogs(playerSlug: string): Promise<PlayerGameLog[]> {
    try {
      // Join with games table to get proper gameType calculation
      const { data, error } = await supabase
        .from('player_game_logs')
        .select(`
          *,
          games (
            home_team_name,
            away_team_name
          )
        `)
        .eq('player_slug', playerSlug)
        .order('game_id');

      if (error) throw error;
      return (data || []).map(row => {
        const map = new Map(); // Empty map since we don't have gameNumber mapping here
        return transformSupabaseGameLog(row, map);
      });
    } catch (error) {
      console.error('Error fetching player game logs from Supabase:', error);
      throw error;
    }
  }

  // Get all games
  static async fetchAllGames(): Promise<{games: GameStats[], gameNumberMap: Map<string, number>}> {
    try {
      // Fetch games
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .order('game_date', { ascending: true });

      if (gamesError) throw gamesError;

      // Fetch video projects to link youtube videos and find games without logs
      const { data: videoProjects, error: videoError } = await supabase
        .from('video_projects')
        .select('*');

      if (videoError) {
        console.warn('Error fetching video projects:', videoError);
        // Continue without videos if that fails
      }

      // Create a map of TSV_game_number to video data (consolidates playlist entries)
      const videoMap = new Map<number, { link: string; events: any[]; players: any[]; videoIndex: number }>();
      const videoOnlyGameNumbers = new Set<number>(); // Track games that only exist in video projects
      
      if (videoProjects) {
        videoProjects.forEach((vp: any) => {
          // Handle both old and new table structures
          let gameNumber: number | undefined;
          
          if (vp.tsv_game_number !== undefined && vp.tsv_game_number !== null) {
            // New structure: use TSV_game_number directly
            gameNumber = vp.tsv_game_number;
          } else if (vp.game_number) {
            // Old structure: convert game_number string to number
            const parsedGameNumber = parseInt(vp.game_number);
            if (!isNaN(parsedGameNumber)) {
              gameNumber = parsedGameNumber;
            }
          }
          
          if (gameNumber !== undefined && !isNaN(gameNumber)) {
            // Track games that only exist in video projects
            videoOnlyGameNumbers.add(gameNumber);
            
            // Construct youtube link
            let link = '';
            if (vp.video_id) {
              link = `https://www.youtube.com/watch?v=${vp.video_id}`;
            } else if (vp.playlist_id) {
              link = `https://www.youtube.com/playlist?list=${vp.playlist_id}`;
            }

            if (link) {
              // Check if we already have a video for this game (consolidate playlists)
              if (!videoMap.has(gameNumber)) {
                // Create consolidated video data
                videoMap.set(gameNumber, {
                  link,
                  events: vp.data?.events || [],
                  players: vp.data?.players || [],
                  videoIndex: vp.video_index || 0
                });
              } else {
                // Merge events and players from additional video entries
                const existingVideo = videoMap.get(gameNumber)!;
                const newEvents = vp.data?.events || [];
                const newPlayers = vp.data?.players || [];
                
                // Merge events (avoid duplicates based on timestamp or unique identifier)
                const allEvents = [...existingVideo.events];
                newEvents.forEach((newEvent: any) => {
                  if (!allEvents.some((existingEvent: any) => 
                    existingEvent.time === newEvent.time && 
                    existingEvent.type === newEvent.type)) {
                    allEvents.push(newEvent);
                  }
                });
                
                // Merge players (avoid duplicates based on player ID)
                const allPlayers = [...existingVideo.players];
                newPlayers.forEach((newPlayer: any) => {
                  if (!allPlayers.some((existingPlayer: any) => 
                    existingPlayer.id === newPlayer.id)) {
                    allPlayers.push(newPlayer);
                  }
                });
                
                // Update the existing video entry
                videoMap.set(gameNumber, {
                  ...existingVideo,
                  events: allEvents,
                  players: allPlayers
                });
              }
            }
          }
        });
      }

      // Create gameNumberMap for mapping game_id to gameNumber
      const gameNumberMap = new Map<string, number>();
      let neuenstadtGameCounter = 1;
      
      // First, process games from the games table and remove them from video-only set
      const games = (gamesData || []).map((row, index) => {
        const gameStats = transformSupabaseGame(row, index);
        
        // Map game_id to gameNumber for game logs
        if (gameStats.gameNumber <= 999) { // TSV Neuenstadt games
          gameNumberMap.set(row.game_id, gameStats.gameNumber);
        }
        
        // Remove this game from video-only set if it exists in both tables
        if (videoOnlyGameNumbers.has(gameStats.gameNumber)) {
          videoOnlyGameNumbers.delete(gameStats.gameNumber);
        }
        
        // Attach video data if available (using TSV_game_number)
        const videoData = videoMap.get(gameStats.gameNumber); // Use the actual TSV game number
        
        if (videoData) {
          // Extract just the link for backward compatibility
          gameStats.youtubeLink = videoData.link;
          gameStats.youtubeLinks = [videoData.link]; // Single video per game
          
          // Store full video data for advanced features (events, players)
          gameStats.videoData = [videoData];
        }
        return gameStats;
      });

      // Now create games for video-only entries
      const videoOnlyGames: GameStats[] = [];
      videoOnlyGameNumbers.forEach(gameNumber => {
        const videoData = videoMap.get(gameNumber);
        if (videoData) {
          // Create a minimal game entry for video-only games
          const videoOnlyGame: GameStats = {
            gameNumber,
            date: new Date().toISOString(), // Use current date as placeholder
            homeTeam: 'TSV Neuenstadt', // Default home team
            awayTeam: 'Gegner', // Default away team
            finalScore: '-', // No score available
            q1Score: '-',
            halfTimeScore: '-',
            q3Score: '-',
            youtubeLink: videoData.link,
            youtubeLinks: [videoData.link],
            videoData: [videoData]
          };
          videoOnlyGames.push(videoOnlyGame);
        }
      });

      // Combine regular games with video-only games
      const allGames = [...games, ...videoOnlyGames].sort((a, b) => {
        // Sort by game number, putting video-only games at the end of their number range
        if (a.gameNumber !== b.gameNumber) {
          return a.gameNumber - b.gameNumber;
        }
        return 0;
      });

      return { games: allGames, gameNumberMap };
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
      const [playerStats, { games, gameNumberMap }] = await Promise.all([
        this.fetchAllPlayerStats(),
        this.fetchAllGames()
      ]);

      const gameLogs = await this.fetchAllPlayerGameLogs(gameNumberMap);

      return { playerStats, gameLogs, games };
    } catch (error) {
      console.error('Error fetching stats data from Supabase:', error);
      throw error;
    }
  }
}
