import Papa from 'papaparse';
import { PlayerStats, GameStats, PlayerGameLog, CachedData } from '@/types/stats';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache
const CSV_URLS = {
  games: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Games',
  playerStats: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Spieler',
  homeStats: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Home',
  awayStats: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Away',
  playerBios: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Bio'
};

interface PlayerBio {
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: string;
  age: number;
  height: string;
  bio: string;
}

async function fetchPlayerBios(): Promise<Map<string, PlayerBio>> {
  const bios = await fetchCSV<any>(CSV_URLS.playerBios, (rows) => 
    rows.map(row => ({
      firstName: (row.Vorname || '').trim(),
      lastName: (row.Nachname || '').trim(),
      jerseyNumber: parseInt(row['Trikot-Nummer']) || 0,
      position: (row.Position || '').trim(),
      age: parseInt(row.Alter) || 0,
      height: (row['Größe'] || '').trim(),
      bio: (row.Bio || '').trim()
    }))
  );
  
  const bioMap = new Map<string, PlayerBio>();
  bios.forEach(bio => {
    if (bio.firstName || bio.lastName) {
      const key = `${bio.firstName.toLowerCase()} ${bio.lastName.toLowerCase()}`.trim();
      bioMap.set(key, bio);
    }
  });
  return bioMap;
}

interface PlayerStatsRow {
  Vorname: string;
  Nachname: string;
  Spiele: string;
  'Minuten pS': string;
  'Punkte pS': string;
  '3er pS': string;
  'FW-Quote': string;
  'Fouls pS': string;
}

function combineHomeAndAwayStats(
  homeRows: PlayerStatsRow[], 
  awayRows: PlayerStatsRow[], 
  bioMap: Map<string, PlayerBio>
): PlayerStats[] {
  const playerMap = new Map<string, PlayerStats>();

  // Process home stats
  homeRows.forEach(row => {
    const firstName = (row.Vorname || '').trim();
    const lastName = (row.Nachname || '').trim();
    if (!firstName) return;

    const playerId = generatePlayerId(firstName, lastName);
    const bioKey = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`.trim();
    const bioData = bioMap.get(bioKey);
    
    const homeGames = parseInt(row.Spiele) || 0;
    const homeMinutes = parseFloat((row['Minuten pS'] || '0').replace(',', '.')) * homeGames;
    const homePoints = parseFloat((row['Punkte pS'] || '0').replace(',', '.')) * homeGames;
    const homeThreePointers = parseFloat((row['3er pS'] || '0').replace(',', '.')) * homeGames;
    const homeFouls = parseFloat((row['Fouls pS'] || '0').replace(',', '.')) * homeGames;

    playerMap.set(playerId, {
      id: playerId,
      firstName,
      lastName,
      gamesPlayed: homeGames,
      minutesPerGame: parseFloat((row['Minuten pS'] || '0').replace(',', '.')),
      pointsPerGame: parseFloat((row['Punkte pS'] || '0').replace(',', '.')),
      threePointersPerGame: parseFloat((row['3er pS'] || '0').replace(',', '.')),
      freeThrowPercentage: row['FW-Quote'] || '0%',
      foulsPerGame: parseFloat((row['Fouls pS'] || '0').replace(',', '.')),
      imageUrl: '/placeholder-player.png',
      jerseyNumber: bioData?.jerseyNumber || 0,
      position: bioData?.position || '',
      age: bioData?.age || 0,
      bio: bioData?.bio || '',
      // Home stats
      homeGames,
      homeMinutesPlayed: homeMinutes,
      homePoints: homePoints,
      homeThreePointers: homeThreePointers,
      homeFouls: homeFouls,
      // Initialize away stats as 0
      awayGames: 0,
      awayMinutesPlayed: 0,
      awayPoints: 0,
      awayThreePointers: 0,
      awayFouls: 0,
      // Initialize totals with home stats
      totalMinutes: homeMinutes,
      totalPoints: homePoints,
      totalThreePointers: homeThreePointers,
      totalFouls: homeFouls
    });
  });

  // Process away stats and combine with home stats
  awayRows.forEach(row => {
    const firstName = (row.Vorname || '').trim();
    const lastName = (row.Nachname || '').trim();
    if (!firstName) return;

    const playerId = generatePlayerId(firstName, lastName);
    const bioKey = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`.trim();
    const bioData = bioMap.get(bioKey);
    
    const awayGames = parseInt(row.Spiele) || 0;
    const awayMinutes = parseFloat((row['Minuten pS'] || '0').replace(',', '.')) * awayGames;
    const awayPoints = parseFloat((row['Punkte pS'] || '0').replace(',', '.')) * awayGames;
    const awayThreePointers = parseFloat((row['3er pS'] || '0').replace(',', '.')) * awayGames;
    const awayFouls = parseFloat((row['Fouls pS'] || '0').replace(',', '.')) * awayGames;

    const existingPlayer = playerMap.get(playerId);
    
    if (existingPlayer) {
      // Update existing player with away stats
      existingPlayer.awayGames = awayGames;
      existingPlayer.awayMinutesPlayed = awayMinutes;
      existingPlayer.awayPoints = awayPoints;
      existingPlayer.awayThreePointers = awayThreePointers;
      existingPlayer.awayFouls = awayFouls;
      
      // Update totals
      existingPlayer.gamesPlayed += awayGames;
      existingPlayer.totalMinutes = (existingPlayer.homeMinutesPlayed || 0) + awayMinutes;
      existingPlayer.totalPoints = (existingPlayer.homePoints || 0) + awayPoints;
      existingPlayer.totalThreePointers = (existingPlayer.homeThreePointers || 0) + awayThreePointers;
      existingPlayer.totalFouls = (existingPlayer.homeFouls || 0) + awayFouls;
      
      // Update per-game averages
      if (existingPlayer.gamesPlayed > 0) {
        existingPlayer.minutesPerGame = existingPlayer.totalMinutes / existingPlayer.gamesPlayed;
        existingPlayer.pointsPerGame = existingPlayer.totalPoints / existingPlayer.gamesPlayed;
        existingPlayer.threePointersPerGame = existingPlayer.totalThreePointers / existingPlayer.gamesPlayed;
        existingPlayer.foulsPerGame = existingPlayer.totalFouls / existingPlayer.gamesPlayed;
      }
    } else {
      // Create new player with away stats only
      playerMap.set(playerId, {
        id: playerId,
        firstName,
        lastName,
        gamesPlayed: awayGames,
        minutesPerGame: parseFloat((row['Minuten pS'] || '0').replace(',', '.')),
        pointsPerGame: parseFloat((row['Punkte pS'] || '0').replace(',', '.')),
        threePointersPerGame: parseFloat((row['3er pS'] || '0').replace(',', '.')),
        freeThrowPercentage: row['FW-Quote'] || '0%',
        foulsPerGame: parseFloat((row['Fouls pS'] || '0').replace(',', '.')),
        imageUrl: '/placeholder-player.png',
        jerseyNumber: bioData?.jerseyNumber || 0,
        position: bioData?.position || '',
        age: bioData?.age || 0,
        bio: bioData?.bio || '',
        // Initialize home stats as 0
        homeGames: 0,
        homeMinutesPlayed: 0,
        homePoints: 0,
        homeThreePointers: 0,
        homeFouls: 0,
        // Away stats
        awayGames: awayGames,
        awayMinutesPlayed: awayMinutes,
        awayPoints: awayPoints,
        awayThreePointers: awayThreePointers,
        awayFouls: awayFouls,
        // Totals (same as away stats since no home stats)
        totalMinutes: awayMinutes,
        totalPoints: awayPoints,
        totalThreePointers: awayThreePointers,
        totalFouls: awayFouls
      });
    }
  });

  return Array.from(playerMap.values());
}

export async function fetchAllData() {
  const [games, playerStats, homeRows, awayRows, bioMap] = await Promise.all([
    fetchCSV<GameStats>(CSV_URLS.games, transformGameData),
    fetchCSV<PlayerGameLog>(CSV_URLS.playerStats, transformPlayerGameLog),
    fetchCSV<PlayerStatsRow>(CSV_URLS.homeStats, (rows) => rows),
    fetchCSV<PlayerStatsRow>(CSV_URLS.awayStats, (rows) => rows),
    fetchPlayerBios()
  ]);
  
  // Combine home and away stats
  const playerTotals = combineHomeAndAwayStats(homeRows, awayRows, bioMap);
  
  return { 
    games, 
    playerStats, 
    playerTotals
  };
}

async function fetchCSV<T>(url: string, transform: (data: any) => T[]): Promise<T[]> {
  const cacheKey = `cache_${btoa(url)}`;
  const cached = localStorage.getItem(cacheKey);
  const now = Date.now();

  if (cached) {
    const { data, timestamp } = JSON.parse(cached) as CachedData<T>;
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  try {
    const response = await fetch(url);
    const text = await response.text();
    const result = await new Promise<any[]>((resolve) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data)
      });
    });

    const transformed = transform(result);
    localStorage.setItem(cacheKey, JSON.stringify({
      data: transformed,
      timestamp: now
    }));
    return transformed;
  } catch (error) {
    console.error('Error fetching CSV:', error);
    return [];
  }
}

// Transformers
function transformPlayerTotals(rows: any[], bioMap: Map<string, PlayerBio>): PlayerStats[] {
  return rows.map(row => {
    const firstName = (row.Vorname || '').trim();
    const lastName = (row.Nachname || '').trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const playerId = generatePlayerId(firstName, lastName);
    
    // Skip if no first name
    if (!firstName) return null;
    
    // Find bio data if available
    const bioKey = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`.trim();
    const bioData = bioMap.get(bioKey);
    
    // Base player data
    const player: PlayerStats = {
      id: playerId,
      firstName,
      lastName,
      gamesPlayed: parseInt(row.Spiele) || 0,
      minutesPerGame: typeof row['Minuten pS'] === 'number' ? row['Minuten pS'] : parseFloat((row['Minuten pS'] || '0').replace(',', '.')),
      pointsPerGame: parseFloat((row['Punkte pS'] || '0').replace(',', '.')),
      threePointersPerGame: parseFloat((row['3er pS'] || '0').replace(',', '.')),
      freeThrowPercentage: row['FW-Quote'] || '0%',
      foulsPerGame: parseFloat((row['Fouls pS'] || '0').replace(',', '.')),
      imageUrl: '/placeholder-player.png',
      // Use bio data if available, otherwise use defaults
      jerseyNumber: bioData?.jerseyNumber || 0,
      position: bioData?.position || '',
      age: bioData?.age || 0,
      bio: bioData?.bio || ''
    };

    return player;
  }).filter(Boolean) as PlayerStats[]; // Filter out any null entries
}

function transformPlayerGameLog(rows: any[]): PlayerGameLog[] {
  return rows.map(row => {
    // Log the row keys for debugging
    if (Object.keys(row).length > 0 && !Object.prototype.hasOwnProperty.call(row, 'Punkte')) {
      console.log('Available columns:', Object.keys(row));
    }
    
    return {
      playerId: generatePlayerId(row.Vorname, row.Nachname),
      gameNumber: parseInt(row['Spiel-Nr.']) || 0,
      minutesPlayed: typeof row.Minuten === 'number' ? row.Minuten : parseFloat((row.Minuten || '0').toString().replace(',', '.')),
      points: parseInt(row.Punkte) || 0,
      twoPointers: parseInt(row['2er']) || 0,
      threePointers: parseInt(row['3er']) || 0,
      freeThrowsMade: parseInt(row['FTM']) || 0,
      freeThrowAttempts: parseInt(row['FTA']) || 0,
      fouls: parseInt(row.Fouls) || 0
    };
  });
}

function transformGameData(rows: any[]): GameStats[] {
  return rows
    .filter(row => row['Sp.tag'] && row.Datum)
    .map(row => ({
      gameNumber: parseInt(row['Sp.tag']),
      date: row.Datum,
      homeTeam: row.Heim,
      awayTeam: row.Gast,
      finalScore: row.Endstand,
      q1Score: row['1. Viertel'],
      halfTimeScore: row.Halbzeit,
      q3Score: row['3. Viertel']
    }))
    .sort((a, b) => a.gameNumber - b.gameNumber);
}

const generatePlayerId = (firstName: string, lastName: string = ''): string => {
  const name = `${firstName} ${lastName}`.trim().toLowerCase();
  return name.replace(/\s+/g, '-');
};
