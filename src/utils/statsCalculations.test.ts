import { describe, it, expect } from 'vitest';
import { calculateTotals } from './statsCalculations';
import { Game } from '@/data/games';

describe('calculateTotals', () => {
  const mockGames: Game[] = [
    {
      id: 'game-1',
      date: '2024-01-01',
      opponent: 'Team A',
      location: 'home',
      result: 'win',
      playerStats: [
        {
          playerId: 'p1',
          points: 10,
          twoPointers: 2,
          threePointers: 2,
          freeThrowsMade: 0,
          freeThrowAttempts: 0,
          fouls: 1,
          minutesPlayed: 20
        },
        {
          playerId: 'p2',
          points: 5,
          twoPointers: 1,
          threePointers: 1,
          freeThrowsMade: 0,
          freeThrowAttempts: 0,
          fouls: 2,
          minutesPlayed: 15
        }
      ]
    },
    {
      id: 'game-2',
      date: '2024-01-08',
      opponent: 'Team B',
      location: 'away',
      result: 'loss',
      playerStats: [
        {
          playerId: 'p1',
          points: 15,
          twoPointers: 3,
          threePointers: 3,
          freeThrowsMade: 0,
          freeThrowAttempts: 0,
          fouls: 3,
          minutesPlayed: 25
        }
      ]
    },
    {
      id: 'game-3',
      date: '2024-01-15',
      opponent: 'Team C',
      location: 'home',
      result: 'win',
      playerStats: [] // Player p1 didn't play
    }
  ];

  it('should correctly calculate totals for a player present in multiple games', () => {
    const stats = calculateTotals(mockGames, 'p1');

    expect(stats.games).toBe(2);
    expect(stats.points).toBe(25); // 10 + 15
    expect(stats.twoPointers).toBe(5); // 2 + 3
    expect(stats.threePointers).toBe(5); // 2 + 3
    expect(stats.fouls).toBe(4); // 1 + 3
    expect(stats.minutesPlayed).toBe(45); // 20 + 25
  });

  it('should return zeros for empty games array', () => {
    const stats = calculateTotals([], 'p1');

    expect(stats.games).toBe(0);
    expect(stats.points).toBe(0);
    expect(stats.minutesPlayed).toBe(0);
  });

  it('should return zeros when player is not found in any game', () => {
    const stats = calculateTotals(mockGames, 'non-existent-player');

    expect(stats.games).toBe(0);
    expect(stats.points).toBe(0);
    expect(stats.minutesPlayed).toBe(0);
  });

  it('should correctly filter by "home" location', () => {
    const stats = calculateTotals(mockGames, 'p1', 'home');

    // p1 played in game-1 (home) but not game-3 (home), so 1 game
    expect(stats.games).toBe(1);
    expect(stats.points).toBe(10);
    expect(stats.minutesPlayed).toBe(20);
  });

  it('should correctly filter by "away" location', () => {
    const stats = calculateTotals(mockGames, 'p1', 'away');

    // p1 played in game-2 (away)
    expect(stats.games).toBe(1);
    expect(stats.points).toBe(15);
    expect(stats.minutesPlayed).toBe(25);
  });

  it('should handle partial stats (missing optional values) by defaulting to 0', () => {
    // Creating a mock game where some stats might be missing/undefined if the type allows optional
    // But GamePlayerStats requires numbers.
    // However, the function uses `|| 0`. Let's create a partial object cast as any to simulate runtime data issues or incomplete data
    const partialGame = {
      id: 'game-partial',
      location: 'home',
      playerStats: [
        {
          playerId: 'p3',
          points: 10,
          // other stats missing
        }
      ]
    } as unknown as Game;

    const stats = calculateTotals([partialGame], 'p3');

    expect(stats.games).toBe(1);
    expect(stats.points).toBe(10);
    expect(stats.twoPointers).toBe(0); // Should default to 0
    expect(stats.minutesPlayed).toBe(0); // Should default to 0
  });

  it('should handle zero values correctly', () => {
      const zeroGame: Game = {
      id: 'game-zero',
      date: '2024-01-01',
      opponent: 'Team Z',
      location: 'home',
      result: 'win',
      playerStats: [
        {
          playerId: 'pZero',
          points: 0,
          twoPointers: 0,
          threePointers: 0,
          freeThrowsMade: 0,
          freeThrowAttempts: 0,
          fouls: 0,
          minutesPlayed: 0
        }
      ]
    };

    const stats = calculateTotals([zeroGame], 'pZero');
    expect(stats.games).toBe(1);
    expect(stats.points).toBe(0);
    expect(stats.minutesPlayed).toBe(0);
  });
});
