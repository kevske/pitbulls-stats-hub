import { supabase } from '@/lib/supabase';
import { PlayerInfo } from '@/types/supabase';
import { AuthService } from './authService';
import { AuditService } from './auditService';

export class PlayerInfoService {
  // Get all players
  static async getAllPlayers(): Promise<PlayerInfo[]> {
    const { data, error } = await supabase
      .from('player_info')
      .select('*')
      .order('last_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get player by slug
  static async getPlayerBySlug(slug: string): Promise<PlayerInfo | null> {
    const { data, error } = await supabase
      .from('player_info')
      .select('*')
      .eq('player_slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }

  // Create new player
  static async createPlayer(player: Omit<PlayerInfo, 'id' | 'created_at' | 'updated_at'>): Promise<PlayerInfo> {
    const { data, error } = await supabase
      .from('player_info')
      .insert([player])
      .select()
      .single();

    if (error) throw error;

    // Log the creation (non-blocking)
    (async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser && data) {
          await AuditService.logAction({
            table_name: 'player_info',
            record_id: data.id,
            action: 'CREATE',
            new_data: data,
            user_email: currentUser.user.email || 'unknown',
            user_id: currentUser.user.id,
          });
        }
      } catch (error) {
        console.error('Background audit logging failed:', error);
      }
    })();

    return data;
  }

  // Update player
  static async updatePlayer(id: string, updates: Partial<Omit<PlayerInfo, 'id' | 'created_at' | 'updated_at'>>): Promise<PlayerInfo> {
    // Get old data for audit
    const { data: oldData } = await supabase
      .from('player_info')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('player_info')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log the update (non-blocking)
    (async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser && data) {
          await AuditService.logAction({
            table_name: 'player_info',
            record_id: id,
            action: 'UPDATE',
            old_data: oldData,
            new_data: data,
            user_email: currentUser.user.email || 'unknown',
            user_id: currentUser.user.id,
          });
        }
      } catch (error) {
        console.error('Background audit logging failed:', error);
      }
    })();

    return data;
  }

  // Delete player
  static async deletePlayer(id: string): Promise<void> {
    // Get data for audit before deletion
    const { data: oldData } = await supabase
      .from('player_info')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('player_info')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log the deletion (non-blocking)
    (async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser && oldData) {
          await AuditService.logAction({
            table_name: 'player_info',
            record_id: id,
            action: 'DELETE',
            old_data: oldData,
            user_email: currentUser.user.email || 'unknown',
            user_id: currentUser.user.id,
          });
        }
      } catch (error) {
        console.error('Background audit logging failed:', error);
      }
    })();
  }

  // Get active players only
  static async getActivePlayers(): Promise<PlayerInfo[]> {
    const { data, error } = await supabase
      .from('player_info')
      .select('*')
      .eq('is_active', true)
      .order('last_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}
