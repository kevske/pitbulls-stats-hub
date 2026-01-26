import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required. Please check your environment variables.');
}

// Check localStorage availability
const checkLocalStorage = () => {
  try {
    const testKey = 'supabase.auth.test';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    console.log('localStorage is available');
    return true;
  } catch (e) {
    console.error('localStorage is not available:', e);
    return false;
  }
};

const storage = checkLocalStorage() ? localStorage : null;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: storage,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
