import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import { AuthService } from './authService';
import { supabase } from '@/lib/supabase';

// Mock supabase client
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

describe('AuthService Security', () => {
  let consoleLogSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('sendMagicLink', () => {
    it('should not log sensitive data when user is not found', async () => {
      // Mock player not found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
        })
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      await AuthService.sendMagicLink('test@example.com');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log sensitive data when magic link is sent', async () => {
      // Mock player found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { email: 'test@example.com', first_name: 'Test', last_name: 'User' },
            error: null
          })
        })
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      // Mock auth success
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.auth.signInWithOtp as any).mockResolvedValue({ error: null });

      await AuthService.sendMagicLink('test@example.com');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should not log sensitive session data', async () => {
      // Mock session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.auth.getSession as any).mockResolvedValue({
        data: {
          session: {
            access_token: 'secret_token',
            expires_at: Date.now() / 1000 + 3600,
            user: { email: 'test@example.com' }
          }
        }
      });

      await AuthService.isAuthenticated();

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log when session is missing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });

      await AuthService.isAuthenticated();

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should not log user or player info', async () => {
      // Mock session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.auth.getSession as any).mockResolvedValue({
        data: {
          session: {
            access_token: 'secret_token',
            expires_at: Date.now() / 1000 + 3600,
            user: { email: 'test@example.com' }
          }
        }
      });

      // Mock player info
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { email: 'test@example.com', first_name: 'Test' },
              error: null
            })
          })
        })
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      await AuthService.getCurrentUser();

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
