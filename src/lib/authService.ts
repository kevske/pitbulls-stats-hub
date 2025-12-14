import { supabase } from './supabase';
import { PlayerInfo } from '../types/supabase';

export class AuthService {
  // Send magic link to player email
  static async sendMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First check if email exists in player_info table
      console.log('Looking up email:', email.trim().toLowerCase());
      
      const { data: player, error: playerError } = await supabase
        .from('player_info')
        .select('email, first_name, last_name, is_active')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (playerError || !player) {
        console.log('Player lookup error:', playerError);
        console.log('Player data:', player);
        return { success: false, error: 'Email not found in player database' };
      }

      // Send magic link
      const baseUrl = import.meta.env.PROD ? 'https://kevske.github.io/pitbulls-stats-hub' : window.location.origin;
      const redirectUrl = `${baseUrl}/admin/player-info`;
      
      console.log('Using base URL for magic link:', baseUrl);
      console.log('Redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending magic link:', error);
      return { success: false, error: 'Failed to send magic link' };
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return false;
      }

      // Check if session is expired
      const now = new Date();
      const expiresAt = new Date(session.expires_at * 1000);
      
      if (now >= expiresAt) {
        // Session expired, try to refresh
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.log('Session refresh failed:', error);
          return false;
        }
        
        // Check if refresh succeeded
        const { data: { session: refreshedSession } } = await supabase.auth.getSession();
        return !!refreshedSession;
      }

      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Get current authenticated user
  static async getCurrentUser(): Promise<{ user: any; playerInfo?: PlayerInfo } | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      // Check if session is expired and try refresh if needed
      const now = new Date();
      const expiresAt = new Date(session.expires_at * 1000);
      
      if (now >= expiresAt) {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.log('Session refresh failed in getCurrentUser:', error);
          return null;
        }
        
        // Get refreshed session
        const { data: { session: refreshedSession } } = await supabase.auth.getSession();
        if (!refreshedSession?.user) {
          return null;
        }
      }

      // Get player info associated with this email
      const { data: playerInfo } = await supabase
        .from('player_info')
        .select('*')
        .eq('email', session.user.email)
        .eq('is_active', true)
        .single();

      return {
        user: session.user,
        playerInfo: playerInfo || undefined
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  // Listen for auth state changes
  static onAuthStateChange(callback: (session: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  }
}
