import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import { AuthService } from './authService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      signInWithOtp: vi.fn(),
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

describe('AuthService', () => {
  let consoleLogSpy: MockInstance;
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('sendMagicLink', () => {
    it('should NOT log sensitive email', async () => {
      const email = 'test@example.com';
      const mockPlayer = { email, first_name: 'Test', last_name: 'User', is_active: true };

      // Mock DB lookup success
      const mockSingle = vi.fn().mockResolvedValue({ data: mockPlayer, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      // Mock auth success
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.auth.signInWithOtp as any).mockResolvedValue({ error: null });

      const result = await AuthService.sendMagicLink(email);

      expect(result.success).toBe(true);

      // Verify no logs
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle error without leaking full error object', async () => {
      const email = 'test@example.com';
      const sensitiveError = new Error('Database connection failed with password=SECRET');

      // Mock DB lookup error
      const mockSingle = vi.fn().mockRejectedValue(sensitiveError);
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await AuthService.sendMagicLink(email);

      expect(result.success).toBe(false);

      // Verify error is logged but check content
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending magic link:', 'Database connection failed with password=SECRET');
    });
  });

  describe('isAuthenticated', () => {
    it('should NOT log session data', async () => {
      const mockSession = {
        access_token: 'token123',
        user: { email: 'test@example.com' },
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.auth.getSession as any).mockResolvedValue({ data: { session: mockSession } });

      const result = await AuthService.isAuthenticated();

      expect(result).toBe(true);

      // Verify no sensitive logs
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
