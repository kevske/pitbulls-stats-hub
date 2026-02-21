import { describe, it, expect } from 'vitest';
import { calculatePlayerEfficiency, PlayerGameStats, ExtractedGameStats, TeamGameStats, exportStatsToCSV } from './statsExtraction';

const createMockStats = (overrides: Partial<PlayerGameStats> = {}): PlayerGameStats => ({
  playerId: '1',
  playerName: 'Test Player',
  jerseyNumber: 1,
  assists: 0,
  rebounds: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  fieldGoalsMade: 0,
  fieldGoalsAttempted: 0,
  fieldGoalPercentage: 0,
  threePointersMade: 0,
  threePointersAttempted: 0,
  threePointPercentage: 0,
  freeThrowsMade: 0,
  freeThrowsAttempted: 0,
  freeThrowPercentage: 0,
  totalPoints: 0,
  plusMinus: 0,
  fouls: 0,
  substitutions: 0,
  ...overrides,
});

const createMockTeamStats = (overrides: Partial<TeamGameStats> = {}): TeamGameStats => ({
  totalPoints: 0,
  totalAssists: 0,
  totalRebounds: 0,
  totalSteals: 0,
  totalBlocks: 0,
  totalTurnovers: 0,
  teamFieldGoalPercentage: 0,
  teamThreePointPercentage: 0,
  teamFreeThrowPercentage: 0,
  totalFouls: 0,
  totalSubstitutions: 0,
  fieldGoalsMade: 0,
  fieldGoalsAttempted: 0,
  threePointersMade: 0,
  threePointersAttempted: 0,
  freeThrowsMade: 0,
  freeThrowsAttempted: 0,
  ...overrides
});

const createMockExtractedStats = (playerStats: PlayerGameStats[]): ExtractedGameStats => ({
  gameId: 'test-game',
  timestamp: '2023-01-01',
  playerStats,
  teamStats: createMockTeamStats(),
  playByPlay: []
});

describe('calculatePlayerEfficiency', () => {
  it('calculates efficiency correctly for a standard game', () => {
    // Formula: (Points + Rebounds + Assists + Steals + Blocks - Turnovers)
    // 20 + 5 + 5 + 2 + 1 - 3 = 30
    const stats = createMockStats({
      totalPoints: 20,
      rebounds: 5,
      assists: 5,
      steals: 2,
      blocks: 1,
      turnovers: 3
    });

    expect(calculatePlayerEfficiency(stats)).toBe(30);
  });

  it('returns 0 when all relevant stats are 0', () => {
    const stats = createMockStats();
    expect(calculatePlayerEfficiency(stats)).toBe(0);
  });

  it('returns negative value when turnovers exceed positive stats', () => {
    // 0 + 0 + 0 + 0 + 0 - 5 = -5
    const stats = createMockStats({
      turnovers: 5
    });
    expect(calculatePlayerEfficiency(stats)).toBe(-5);
  });

  it('handles floating point inputs correctly', () => {
     // Ideally stats are integers, but let's check basic math stability if needed.
     const stats = createMockStats({
       totalPoints: 10.5,
       rebounds: 2,
       turnovers: 1.5
     });
     // 10.5 + 2 - 1.5 = 11
     expect(calculatePlayerEfficiency(stats)).toBe(11);
  });
});

describe('exportStatsToCSV', () => {
  it('returns CSV with headers only when no player stats are present', () => {
    const stats = createMockExtractedStats([]);
    const csv = exportStatsToCSV(stats);
    // The expected header string based on implementation
    const expectedHeaders = 'Player Name,Jersey #,Points,FGM,FGA,FG%,3PM,3PA,3P%,FTM,FTA,FT%,AST,REB,STL,BLK,TOV,FOULS,SUB';
    expect(csv).toBe(expectedHeaders);
  });

  it('formats player stats correctly into CSV rows', () => {
    const playerStats = createMockStats({
      playerName: 'Test Player',
      jerseyNumber: 23,
      totalPoints: 30,
      fieldGoalsMade: 10,
      fieldGoalsAttempted: 20,
      fieldGoalPercentage: 50,
      threePointersMade: 5,
      threePointersAttempted: 10,
      threePointPercentage: 50,
      freeThrowsMade: 5,
      freeThrowsAttempted: 5,
      freeThrowPercentage: 100,
      assists: 10,
      rebounds: 8,
      steals: 3,
      blocks: 2,
      turnovers: 4,
      fouls: 2,
      substitutions: 1
    });

    const stats = createMockExtractedStats([playerStats]);
    const csv = exportStatsToCSV(stats);

    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    // Note: implementation appends '%' to percentages
    // 'Test Player,23,30,10,20,50%,5,10,50%,5,5,100%,10,8,3,2,4,2,1'
    const expectedRow = 'Test Player,23,30,10,20,50%,5,10,50%,5,5,100%,10,8,3,2,4,2,1';
    expect(lines[1]).toBe(expectedRow);
  });

  it('handles multiple players correctly', () => {
    const player1 = createMockStats({ playerName: 'Player One', jerseyNumber: 1 });
    const player2 = createMockStats({ playerName: 'Player Two', jerseyNumber: 2 });

    // Sort order in export depends on input array order, but extractPlayerStats usually sorts by jersey number.
    // Here we pass pre-sorted or assume export preserves order.
    // exportStatsToCSV iterates over stats.playerStats.
    const stats = createMockExtractedStats([player1, player2]);
    const csv = exportStatsToCSV(stats);

    const lines = csv.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('Player One,1');
    expect(lines[2]).toContain('Player Two,2');
  });
});
