import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MinutesService } from './minutesService';
import { supabase } from '@/lib/supabase';

// Mock supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('MinutesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGameMinutesSummary', () => {
    it('should calculate summary correctly when game and box scores exist', async () => {
      const gameNumber = 123;
      const tsvTeamId = 'tsv-team-id';

      // Mock game data response
      const mockGameData = {
        home_team_name: 'TSV Neuenstadt',
        away_team_name: 'Opponent',
        home_team_id: tsvTeamId,
        away_team_id: 'opponent-id'
      };

      // Mock box scores response
      const mockBoxScores = [
        {
          minutes_played: 10,
          points: 5,
          player_slug: 'player-1',
          player_first_name: 'Player',
          player_last_name: 'One'
        },
        {
          minutes_played: 20,
          points: 10,
          player_slug: 'player-2',
          player_first_name: 'Player',
          player_last_name: 'Two'
        },
        {
          minutes_played: null, // Needing minutes
          points: 0,
          player_slug: 'player-3',
          player_first_name: 'Player',
          player_last_name: 'Three'
        },
        {
          minutes_played: 0, // 0 minutes is valid "having minutes"
          points: 0,
          player_slug: 'player-4',
          player_first_name: 'Player',
          player_last_name: 'Four'
        }
      ];

      // Mock supabase.from implementation
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'games') {
          const mockSingle = vi.fn().mockResolvedValue({ data: mockGameData, error: null });
          const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
          const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'box_scores') {
          // Chain: select -> eq -> eq -> Promise
          const mockEq2 = vi.fn().mockResolvedValue({ data: mockBoxScores, error: null });
          const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
          const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
          return { select: mockSelect };
        }
        return { select: vi.fn() };
      });

      const result = await MinutesService.getGameMinutesSummary(gameNumber);

      expect(supabase.from).toHaveBeenCalledWith('games');
      expect(supabase.from).toHaveBeenCalledWith('box_scores');

      expect(result).toEqual({
        totalMinutes: 30, // 10 + 20 + 0
        playersWithMinutes: 3, // 10, 20, 0. null is not counted
        playersNeedingMinutes: 1 // Only player-3 with null minutes
      });
    });

    it('should return zeros if TSV Neuenstadt team ID cannot be determined', async () => {
      const gameNumber = 456;

      // Mock game data response where neither team is Neuenstadt
      const mockGameData = {
        home_team_name: 'Team A',
        away_team_name: 'Team B',
        home_team_id: 'id-a',
        away_team_id: 'id-b'
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'games') {
          const mockSingle = vi.fn().mockResolvedValue({ data: mockGameData, error: null });
          const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
          const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        return { select: vi.fn() };
      });

      const result = await MinutesService.getGameMinutesSummary(gameNumber);

      expect(result).toEqual({
        totalMinutes: 0,
        playersWithMinutes: 0,
        playersNeedingMinutes: 0
      });
    });

    it('should throw error when database query fails', async () => {
        const gameNumber = 789;
        const error = new Error('Database error');

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'games') {
                const mockSingle = vi.fn().mockResolvedValue({ data: null, error: error });
                const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
                const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
                return { select: mockSelect };
            }
            return { select: vi.fn() };
        });

        await expect(MinutesService.getGameMinutesSummary(gameNumber)).rejects.toThrow('Database error');
    });
  });
});
