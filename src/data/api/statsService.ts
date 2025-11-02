import Papa from 'papaparse';
import { PlayerStats, GameStats, PlayerGameLog, CachedData } from '@/types/stats';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache
const CSV_URLS = {
  games: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Games',
  playerStats: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Spieler',
  playerTotals: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Totals'
};

export async function fetchAllData() {
  const [games, playerStats, playerTotals] = await Promise.all([
    fetchCSV<GameStats>(CSV_URLS.games, transformGameData),
    fetchCSV<PlayerGameLog>(CSV_URLS.playerStats, transformPlayerGameLog),
    fetchCSV<PlayerStats>(CSV_URLS.playerTotals, transformPlayerTotals)
  ]);
  return { games, playerStats, playerTotals };
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
function transformPlayerTotals(rows: any[]): PlayerStats[] {
  return rows.map(row => {
    const firstName = (row.Vorname || '').trim();
    const lastName = (row.Nachname || '').trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const playerId = generatePlayerId(firstName, lastName);
    
    // Skip if no first name
    if (!firstName) return null;
    
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
      // Default values for additional fields
      jerseyNumber: 0,
      position: '',
      age: 0,
      bio: ''
    };

    // Add Kevin Rassner's specific info
    if (fullName.toLowerCase() === 'kevin rassner') {
      player.jerseyNumber = 19;
      player.position = 'Forward';
      player.age = 37;
      player.bio = 'Der Spieler für die, die sich nicht entscheiden wollen: Veteran moves oder lieber Explosivität? Guard, Forward oder Center? Offense oder Defense? Dummes Gelaber oder Lebensweisheit?';
    }

    return player;
  });
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
