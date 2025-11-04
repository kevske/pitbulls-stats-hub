import Papa from 'papaparse';
import { PlayerStats, GameStats, PlayerGameLog, CachedData } from '@/types/stats';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache
const CSV_URLS = {
  games: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Games',
  playerGameLogs: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Spieler',
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

interface PlayerTotalsRow {
  Nachname: string;
  Vorname: string;
  'Minuten pS': string;
  'Punkte pS': string;
  '3er pS': string;
  'Fouls pS': string;
  Spiele: string;
  'FWTreffer pS': string;
  'FWVersuche pS': string;
  'FW-Quote': string;
}

interface PlayerGameLogRow {
  Nachname: string;
  Vorname: string;
  Spieltag: string;
  Minuten: string;
  Punkte: string;
  FWVersuche: string;
  FWTreffer: string;
  'FW-Quote': string;
  '2er': string;
  '3er': string;
  Fouls: string;
  'Punkte/40': string;
  'FWV/40': string;
  'Fouls/40': string;
  'Typ Spiel': string;
}

async function fetchPlayerBios(forceRefresh = false): Promise<Map<string, PlayerBio>> {
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

// Transform Totals CSV data into PlayerStats and include all players from Bio-CSV
function transformPlayerTotals(rows: PlayerTotalsRow[], bioMap: Map<string, PlayerBio>): PlayerStats[] {
  console.log('Bio Map Contents:');
  bioMap.forEach((bio, key) => {
    console.log(`Bio: ${bio.firstName} ${bio.lastName} (${key})`);
  });
  
  // First, process players with stats
  const playersWithStats = new Map<string, PlayerStats>();
  
  console.log('Processing players with stats:');
  rows.forEach(row => {
    const firstName = (row.Vorname || '').trim();
    const lastName = (row.Nachname || '').trim();
    
    if (!firstName) return;
    
    const playerId = generatePlayerId(firstName, lastName);
    const bioKey = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`.trim();
    const bioData = bioMap.get(bioKey);
    
    const imageName = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`.replace(/\s+/g, '-');
    const player: PlayerStats = {
      id: playerId,
      firstName,
      lastName,
      imageUrl: `/players/${imageName}.jpg`,
      jerseyNumber: bioData?.jerseyNumber || 0,
      position: bioData?.position || '',
      age: bioData?.age || 0,
      height: bioData?.height || '',
      bio: bioData?.bio || '',
      gamesPlayed: parseInt(row.Spiele) || 0,
      minutesPerGame: parseFloat((row['Minuten pS'] || '0').replace(',', '.')),
      pointsPerGame: parseFloat((row['Punkte pS'] || '0').replace(',', '.')),
      threePointersPerGame: parseFloat((row['3er pS'] || '0').replace(',', '.')),
      foulsPerGame: parseFloat((row['Fouls pS'] || '0').replace(',', '.')),
      freeThrowsMadePerGame: parseFloat((row['FWTreffer pS'] || '0').replace(',', '.')),
      freeThrowAttemptsPerGame: parseFloat((row['FWVersuche pS'] || '0').replace(',', '.')),
      freeThrowPercentage: row['FW-Quote'] || ''
    };
    
    playersWithStats.set(bioKey, player);
    console.log(`Added player with stats: ${player.firstName} ${player.lastName}`);
  });
  
  // Then add players from bio who don't have stats yet
  console.log('\nAdding players from Bio-CSV without stats:');
  bioMap.forEach((bio, bioKey) => {
    if (!playersWithStats.has(bioKey)) {
      const imageName = `${bio.firstName.toLowerCase()}-${bio.lastName.toLowerCase()}`.replace(/\s+/g, '-');
      const player: PlayerStats = {
        id: generatePlayerId(bio.firstName, bio.lastName),
        firstName: bio.firstName,
        lastName: bio.lastName,
        imageUrl: `/players/${imageName}.jpg`,
        jerseyNumber: bio.jerseyNumber,
        position: bio.position,
        age: bio.age,
        height: bio.height,
        bio: bio.bio,
        gamesPlayed: 0,
        minutesPerGame: 0,
        pointsPerGame: 0,
        threePointersPerGame: 0,
        foulsPerGame: 0,
        freeThrowsMadePerGame: 0,
        freeThrowAttemptsPerGame: 0,
        freeThrowPercentage: ''
      };
      playersWithStats.set(bioKey, player);
      console.log(`Added player from Bio-CSV: ${player.firstName} ${player.lastName}`);
    } else {
      console.log(`Player already exists in stats: ${bio.firstName} ${bio.lastName}`);
    }
  });
  
  const result = Array.from(playersWithStats.values());
  console.log('\nFinal player list:', result.map(p => `${p.firstName} ${p.lastName} (${p.gamesPlayed} games)`));
  return result;
}

export async function fetchAllData(forceRefresh = false) {
  const [games, playerGameLogs, totalsRows, bioMap] = await Promise.all([
    fetchCSV<GameStats>(CSV_URLS.games, transformGameData, forceRefresh),
    fetchCSV<PlayerGameLogRow>(CSV_URLS.playerGameLogs, (rows) => rows, forceRefresh),
    fetchCSV<PlayerTotalsRow>(CSV_URLS.playerTotals, (rows) => rows, forceRefresh),
    forceRefresh ? fetchPlayerBios(true) : fetchPlayerBios()
  ]);
  
  // Transform totals with bio data
  const playerTotals = transformPlayerTotals(totalsRows, bioMap);
  
  // Transform game logs
  const playerStats = transformPlayerGameLogs(playerGameLogs);
  
  return { 
    games, 
    playerStats, 
    playerTotals
  };
}

async function fetchCSV<T>(url: string, transform: (data: any) => T[], forceRefresh = false): Promise<T[]> {
  const cacheKey = `cache_${btoa(url)}`;
  const now = Date.now();
  
  // Only check cache if not forcing a refresh
  if (!forceRefresh) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached) as CachedData<T>;
      if (now - timestamp < CACHE_DURATION) {
        return data;
      }
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

// Transform Spieler CSV data into PlayerGameLog
function transformPlayerGameLogs(rows: PlayerGameLogRow[]): PlayerGameLog[] {
  return rows.map(row => {
    const playerId = generatePlayerId(row.Vorname, row.Nachname);
    const gameNumber = parseInt(row.Spieltag) || 0;
    
    return {
      playerId,
      gameNumber,
      minutesPlayed: parseFloat((row.Minuten || '0').replace(',', '.')),
      points: parseInt(row.Punkte) || 0,
      twoPointers: parseInt(row['2er']) || 0,
      threePointers: parseInt(row['3er']) || 0,
      freeThrowsMade: parseInt(row.FWTreffer) || 0,
      freeThrowAttempts: parseInt(row.FWVersuche) || 0,
      freeThrowPercentage: row['FW-Quote'] || '',
      fouls: parseInt(row.Fouls) || 0,
      pointsPer40: parseFloat((row['Punkte/40'] || '0').replace(',', '.')),
      freeThrowAttemptsPer40: parseFloat((row['FWV/40'] || '0').replace(',', '.')),
      foulsPer40: parseFloat((row['Fouls/40'] || '0').replace(',', '.')),
      gameType: row['Typ Spiel'] || ''
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
