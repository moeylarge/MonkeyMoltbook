import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let browserClient = null;

export function supabaseBrowserEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabaseBrowserClient() {
  if (!supabaseBrowserEnabled()) return null;
  if (browserClient) return browserClient;
  browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  });
  return browserClient;
}
