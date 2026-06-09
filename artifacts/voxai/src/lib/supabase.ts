import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jjxqvriyfjhvvaixjvwe.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_URL;

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase anon key environment variable');
}

export const supabase = createClient(SUPABASE_URL, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
