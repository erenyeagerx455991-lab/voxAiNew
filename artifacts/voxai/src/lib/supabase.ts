import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jjxqvriyfjhvvaixjvwe.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqeHF2cml5ZmpodnZhaXhqdndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTQ1ODYsImV4cCI6MjA5MzgzMDU4Nn0.Dyk8AqmKMx-VoDw9sunAjGNZ2NzLfwT251vosKlOsqg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
