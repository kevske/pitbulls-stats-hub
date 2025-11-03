import Papa from 'papaparse';
import { PlayerStats, GameStats, PlayerGameLog, CachedData } from '@/types/stats';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache
const CSV_URLS = {
  games: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Games',
  playerStats: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Spieler',
  playerTotals: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Totals',
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

export async function fetchAllData() {
  const [games, playerStats, playerTotals, bioMap] = await Promise.all([
    fetchCSV<GameStats>(CSV_URLS.games, transformGameData),
    fetchCSV<PlayerGameLog>(CSV_URLS.playerStats, transformPlayerGameLog),
    fetchCSV<any>(CSV_URLS.playerTotals, (rows) => transformPlayerTotals(rows, new Map())), // Initial transform without bios
    fetchPlayerBios()
  ]);
  
  // Transform player totals again with bio data
  const playerTotalsWithBios = await fetchCSV<PlayerStats>(
    CSV_URLS.playerTotals, 
    (rows) => transformPlayerTotals(rows, bioMap)
  );
  
  return { 
    games, 
    playerStats, 
    playerTotals: playerTotalsWithBios 
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
      minutesPerGame: row['Minuten pS'] || '00:00',
      pointsPerGame: parseFloat((row['Punkte pS'] || '0').replace(',', '.')),
      threePointersPerGame: parseFloat((row['3er pS'] || '0').replace(',', '.')),
      freeThrowPercentage: row['FW-Quote'] || '0%',
      foulsPerGame: parseFloat((row['Fouls pS'] || '0').replace(',', '.')),
      imageUrl: `/pitbulls-stats-hub/players/${playerId}.jpg`,
      // Use bio data if available, otherwise use defaults
      jerseyNumber: bioData?.jerseyNumber || 0,
      position: bioData?.position || '',
      age: bioData?.age || 0,
      height: bioData?.height || '',
      bio: bioData?.bio || ''
    };

    return player;
  }).filter(Boolean) as PlayerStats[]; // Filter out any null entries
}

function transformPlayerGameLog(rows: any[]): PlayerGameLog[] {
  return rows.map(row => ({
    playerId: generatePlayerId(row.Vorname, row.Nachname),
    gameNumber: parseInt(row.Spieltag) || 0,
    minutesPlayed: row.Minuten || '00:00',
    points: parseInt(row.Punkte) || 0,
    twoPointers: parseInt(row['2er']) || 0,
    threePointers: parseInt(row['3er']) || 0,
    freeThrowsMade: parseInt(row.FWTreffer) || 0,
    freeThrowAttempts: parseInt(row.FWVersuche) || 0,
    fouls: parseInt(row.Fouls) || 0
  }));
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
