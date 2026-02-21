import { describe, it, expect } from "vitest";
import { calculateAverages } from "./statsCalculations";
import { Game } from "@/data/games";

describe("calculateAverages", () => {
  const mockGames: Game[] = [
    {
      id: "game-1",
      date: "2024-10-05",
      opponent: "Opponent A",
      location: "home",
      result: "win",
      playerStats: [
        {
          playerId: "p1",
          points: 10,
          twoPointers: 2,
          threePointers: 2,
          freeThrowsMade: 0,
          freeThrowAttempts: 0,
          fouls: 1,
          minutesPlayed: 20,
        },
      ],
    },
    {
      id: "game-2",
      date: "2024-10-12",
      opponent: "Opponent B",
      location: "away",
      result: "loss",
      playerStats: [
        {
          playerId: "p1",
          points: 20,
          twoPointers: 4,
          threePointers: 4,
          freeThrowsMade: 0,
          freeThrowAttempts: 0,
          fouls: 2,
          minutesPlayed: 30,
        },
      ],
    },
    {
      id: "game-3",
      date: "2024-10-19",
      opponent: "Opponent C",
      location: "home",
      result: "win",
      playerStats: [
        {
          playerId: "p1",
          points: 5,
          twoPointers: 1,
          threePointers: 1,
          freeThrowsMade: 0,
          freeThrowAttempts: 0,
          fouls: 0,
          minutesPlayed: 10,
        },
      ],
    },
  ];

  it("calculates basic averages correctly", () => {
    // Total points: 10 + 20 + 5 = 35. Games: 3. Avg: 11.7 (35/3 = 11.666...)
    // Total minutes: 20 + 30 + 10 = 60. Games: 3. Avg: 20.0
    const result = calculateAverages(mockGames, "p1");

    expect(result.games).toBe(3);
    expect(result.points).toBe(11.7);
    expect(result.minutesPlayed).toBe(20.0);
    expect(result.fouls).toBe(1.0); // (1+2+0)/3 = 1
  });

  it("calculates averages with location filter (home)", () => {
    // Home games: game-1 (20 min), game-3 (10 min). Total games: 2.
    // Total minutes (home): 20 + 10 = 30. Avg: 15.0.
    // BUG: Current implementation calculates total minutes from ALL games (60) / 2 = 30.0
    const result = calculateAverages(mockGames, "p1", "home");

    expect(result.games).toBe(2);
    // 15 points total / 2 games = 7.5
    expect(result.points).toBe(7.5);
    // 30 minutes total / 2 games = 15.0
    expect(result.minutesPlayed).toBe(15.0);
  });

  it("calculates averages with location filter (away)", () => {
    // Away games: game-2 (30 min). Total games: 1.
    // Total minutes (away): 30. Avg: 30.0.
    // BUG: Current implementation calculates total minutes from ALL games (60) / 1 = 60.0
    const result = calculateAverages(mockGames, "p1", "away");

    expect(result.games).toBe(1);
    expect(result.points).toBe(20.0);
    expect(result.minutesPlayed).toBe(30.0);
  });

  it("handles empty games list", () => {
    const result = calculateAverages([], "p1");
    expect(result.games).toBe(0);
    expect(result.points).toBe(0);
    expect(result.minutesPlayed).toBe(0);
  });

  it("handles player not found in games", () => {
    const result = calculateAverages(mockGames, "unknown-player");
    expect(result.games).toBe(0);
    expect(result.points).toBe(0);
    expect(result.minutesPlayed).toBe(0);
  });

  it("handles rounding correctly", () => {
    // 1 game, 10 points -> 10.0
    // 3 games, 10 points -> 3.3
    const games: Game[] = [
      {
        ...mockGames[0],
        playerStats: [{ playerId: "p2", points: 10, twoPointers: 0, threePointers: 0, freeThrowsMade: 0, freeThrowAttempts: 0, fouls: 0, minutesPlayed: 10 }]
      },
      {
        ...mockGames[0],
        id: "g2",
        playerStats: [{ playerId: "p2", points: 0, twoPointers: 0, threePointers: 0, freeThrowsMade: 0, freeThrowAttempts: 0, fouls: 0, minutesPlayed: 0 }]
      },
      {
        ...mockGames[0],
        id: "g3",
        playerStats: [{ playerId: "p2", points: 0, twoPointers: 0, threePointers: 0, freeThrowsMade: 0, freeThrowAttempts: 0, fouls: 0, minutesPlayed: 0 }]
      }
    ];
    // Total points 10, games 3 -> 3.333... -> 3.3
    const result = calculateAverages(games, "p2");
    expect(result.points).toBe(3.3);
  });
});
