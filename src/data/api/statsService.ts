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
  return rows.map(row => ({
    id: generatePlayerId(row.Vorname),
    firstName: row.Vorname,
    lastName: row.Nachname || '',
    gamesPlayed: parseInt(row.Spiele) || 0,
    minutesPerGame: row['Minuten pS'] || '00:00',
    pointsPerGame: parseFloat((row['Punkte pS'] || '0').replace(',', '.')),
    threePointersPerGame: parseFloat((row['3er pS'] || '0').replace(',', '.')),
    freeThrowPercentage: row['FW-Quote'] || '0%',
    foulsPerGame: parseFloat((row['Fouls pS'] || '0').replace(',', '.')),
    imageUrl: `/players/${generatePlayerId(row.Vorname)}.jpg`
  }));
}

function transformPlayerGameLog(rows: any[]): PlayerGameLog[] {
  return rows.map(row => ({
    playerId: generatePlayerId(row.Vorname),
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

function generatePlayerId(firstName: string): string {
  return firstName.toLowerCase().replace(/\s+/g, '-');
}
