import { supabase } from './supabase';
import { AuditLog } from '../types/supabase';

export class AuditService {
  // Log an action to the audit table
  static async logAction({
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    user_email,
    user_id,
  }: {
    table_name: string;
    record_id: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    old_data?: any;
    new_data?: any;
    user_email: string;
    user_id: string;
  }): Promise<void> {
    try {
      const auditEntry = {
        table_name,
        record_id,
        action,
        old_data: old_data || null,
        new_data: new_data || null,
        user_email,
        user_id,
        ip_address: this.getClientIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('audit_log')
        .insert([auditEntry]);

      if (error) {
        console.error('Failed to log audit entry:', error);
      }
    } catch (error) {
      console.error('Error in audit logging:', error);
    }
  }

  // Get audit logs for a specific record
  static async getRecordAuditLogs(table_name: string, record_id: string): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('table_name', table_name)
      .eq('record_id', record_id)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get all audit logs (for admin viewing)
  static async getAllAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Get audit logs by user
  static async getUserAuditLogs(user_email: string, limit: number = 50): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('user_email', user_email)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Helper method to get client IP (best effort)
  private static getClientIP(): string {
    // This is a basic implementation - in production you might want to use
    // a more sophisticated method or get this from your backend
    return 'unknown'; // We'll enhance this if needed
  }
}
