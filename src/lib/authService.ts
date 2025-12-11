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
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/player-info`,
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
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }

  // Get current authenticated user
  static async getCurrentUser(): Promise<{ user: any; playerInfo?: PlayerInfo } | null> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
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
