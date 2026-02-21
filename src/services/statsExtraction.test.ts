import { describe, it, expect } from 'vitest';
import { calculatePlayerEfficiency, PlayerGameStats } from './statsExtraction';

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
