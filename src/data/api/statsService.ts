import Papa from 'papaparse';
import { PlayerStats, GameStats, PlayerGameLog, CachedData } from '@/types/stats';
import { config } from '@/config';

// Types for CSV Data
interface PlayerBioRow {
  Vorname: string;
  Nachname: string;
  'Trikot-Nummer': string;
  Position: string;
  Alter: string;
  'Größe': string;
  Bio: string;
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
  '3er/40': string;
  'Fouls/40': string;
  'Typ Spiel': string;
}

interface GameDataRow {
  'Sp.tag': string;
  Datum: string;
  Heim: string;
  Gast: string;
  Endstand: string;
  '1. Viertel': string;
  Halbzeit: string;
  '3. Viertel': string;
  'Youtube-Link'?: string;
}

interface PlayerBio {
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: string;
  age: number;
  height: string;
  bio: string;
}

// Helper Functions
const parseNumber = (value: string): number => {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.')) || 0;
};

const parseInteger = (value: string): number => {
  if (!value) return 0;
  return parseInt(value) || 0;
};

// Mapping of player names to their exact filenames
const PLAYER_IMAGE_MAP: Record<string, string> = {
  'nino de bortoli': 'nino-de-bortoli.jpg',
  'tobias thury': 'tobi-thury.jpg',
  'gregor arapidis': 'gregor-arapidis.jpg',
  'david scheja': 'david-scheja.png',
  'alexander rib': 'alexander-rib.png',
  'jan strobel': 'jan-strobel.png',
  'tim krause': 'tim-krause.jpg',
  'sven bader': 'sven-bader.jpg',
  'stefan anselm': 'stefan-anselm.jpg',
  'christoph mörsch': 'christoph-mrsch.jpg',
  'abdullah ari': 'abdullah-ari.jpg',
  'kevin rassner': 'kevin-rassner.jpg',
  'marius scholl': 'marius-scholl.jpg',
  'jan crocoll': 'jan-crocoll.jpg',
  'marcus hayes': 'marcus-hayes.jpg',
  'danny seitz': 'danny-seitz.jpg'
};

export function generateImageFilename(firstName: string, lastName: string = ''): string {
  const fullName = `${firstName} ${lastName}`.trim().toLowerCase();

  if (PLAYER_IMAGE_MAP[fullName]) {
    return PLAYER_IMAGE_MAP[fullName];
  }

  const baseName = `${firstName}${lastName ? ' ' + lastName : ''}`
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return baseName + '.jpg';
}

function generatePlayerId(firstName: string, lastName: string = ''): string {
  return `${firstName.toLowerCase()}${lastName ? '-' + lastName.toLowerCase() : ''}`.replace(/\s+/g, '-');
}

// Transformers
function transformPlayerBios(rows: PlayerBioRow[]): Map<string, PlayerBio> {
  const bioMap = new Map<string, PlayerBio>();

  rows.forEach(row => {
    const firstName = (row.Vorname || '').trim();
    const lastName = (row.Nachname || '').trim();

    if (firstName || lastName) {
      const key = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`.trim();
      bioMap.set(key, {
        firstName,
        lastName,
        jerseyNumber: parseInteger(row['Trikot-Nummer']),
        position: (row.Position || '').trim(),
        age: parseInteger(row.Alter),
        height: (row['Größe'] || '').trim(),
        bio: (row.Bio || '').trim()
      });
    }
  });

  return bioMap;
}

function transformPlayerTotals(rows: PlayerTotalsRow[], bioMap: Map<string, PlayerBio>): PlayerStats[] {
  const playersWithStats = new Map<string, PlayerStats>();

  // Process players with stats
  rows.forEach(row => {
    const firstName = (row.Vorname || '').trim();
    const lastName = (row.Nachname || '').trim();

    if (!firstName) return;

    const playerId = generatePlayerId(firstName, lastName);
    const bioKey = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`.trim();
    const bioData = bioMap.get(bioKey);
    const imageName = generateImageFilename(firstName, lastName);
    const imageUrl = `/pitbulls-stats-hub/players/${imageName}`;

    const player: PlayerStats = {
      id: playerId,
      firstName,
      lastName,
      imageUrl,
      jerseyNumber: bioData?.jerseyNumber || 0,
      position: bioData?.position || '',
      age: bioData?.age || 0,
      height: bioData?.height || '',
      bio: bioData?.bio || '',
      gamesPlayed: parseInteger(row.Spiele),
      minutesPerGame: parseNumber(row['Minuten pS']),
      pointsPerGame: parseNumber(row['Punkte pS']),
      threePointersPerGame: parseNumber(row['3er pS']),
      foulsPerGame: parseNumber(row['Fouls pS']),
      freeThrowsMadePerGame: parseNumber(row['FWTreffer pS']),
      freeThrowAttemptsPerGame: parseNumber(row['FWVersuche pS']),
      freeThrowPercentage: row['FW-Quote'] || ''
    };

    playersWithStats.set(bioKey, player);
  });

  // Add players from bio who don't have stats yet
  bioMap.forEach((bio, bioKey) => {
    if (!playersWithStats.has(bioKey)) {
      const imageName = generateImageFilename(bio.firstName, bio.lastName);
      const imageUrl = `/pitbulls-stats-hub/players/${imageName}`;

      const player: PlayerStats = {
        id: generatePlayerId(bio.firstName, bio.lastName),
        firstName: bio.firstName,
        lastName: bio.lastName,
        imageUrl,
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
    }
  });

  return Array.from(playersWithStats.values());
}

function transformPlayerGameLogs(rows: PlayerGameLogRow[]): PlayerGameLog[] {
  return rows.map(row => {
    const playerId = generatePlayerId(row.Vorname, row.Nachname);

    return {
      playerId,
      gameNumber: parseInteger(row.Spieltag),
      minutesPlayed: parseNumber(row.Minuten),
      points: parseInteger(row.Punkte),
      twoPointers: parseInteger(row['2er']),
      threePointers: parseInteger(row['3er']),
      freeThrowsMade: parseInteger(row.FWTreffer),
      freeThrowAttempts: parseInteger(row.FWVersuche),
      freeThrowPercentage: row['FW-Quote'] || '',
      fouls: parseInteger(row.Fouls),
      pointsPer40: parseNumber(row['Punkte/40']),
      freeThrowAttemptsPer40: parseNumber(row['FWV/40']),
      threePointersPer40: parseNumber(row['3er/40']),
      foulsPer40: parseNumber(row['Fouls/40']),
      gameType: row['Typ Spiel'] || ''
    };
  });
}

function transformGameData(rows: GameDataRow[]): GameStats[] {
  return rows
    .filter(row => row['Sp.tag'] && row.Datum)
    .map(row => ({
      gameNumber: parseInteger(row['Sp.tag']),
      date: row.Datum,
      homeTeam: row.Heim,
      awayTeam: row.Gast,
      finalScore: row.Endstand,
      q1Score: row['1. Viertel'],
      halfTimeScore: row.Halbzeit,
      q3Score: row['3. Viertel'],
      youtubeLink: row['Youtube-Link']?.trim() || undefined
    }))
    .sort((a, b) => a.gameNumber - b.gameNumber);
}

// Data Fetching
async function fetchCSV<T>(url: string, transform: (data: any[]) => T[], forceRefresh = false): Promise<T[]> {
  const cacheKey = `cache_${btoa(url)}`;
  const now = Date.now();

  if (!forceRefresh) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached) as CachedData<T>;
        if (now - timestamp < config.data.cacheDuration) {
          return data;
        }
      } catch (e) {
        console.warn('Failed to parse cached data', e);
      }
    }
  }

  try {
    const response = await fetch(url);
    const text = await response.text();
    const result = await new Promise<any[]>((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      });
    });

    const transformed = transform(result);

    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: transformed,
        timestamp: now
      }));
    } catch (e) {
      console.warn('Failed to cache data (likely quota exceeded)', e);
    }

    return transformed;
  } catch (error) {
    console.error('Error fetching CSV:', error);
    return [];
  }
}

export async function fetchAllData(forceRefresh = false) {
  try {
    const [games, playerGameLogs, totalsRows, bioRows] = await Promise.all([
      fetchCSV<GameStats>(config.data.csvUrls.games, transformGameData, forceRefresh),
      fetchCSV<PlayerGameLogRow>(config.data.csvUrls.playerGameLogs, (rows) => rows as any[], forceRefresh),
      fetchCSV<PlayerTotalsRow>(config.data.csvUrls.playerTotals, (rows) => rows as any[], forceRefresh),
      fetchCSV<PlayerBioRow>(config.data.csvUrls.playerBios, (rows) => rows as any[], forceRefresh)
    ]);

    const bioMap = transformPlayerBios(bioRows);
    const playerTotals = transformPlayerTotals(totalsRows, bioMap);
    const playerStats = transformPlayerGameLogs(playerGameLogs);

    return {
      games,
      playerStats,
      playerTotals
    };
  } catch (error) {
    console.error('Error fetching all data:', error);
    throw error;
  }
}
