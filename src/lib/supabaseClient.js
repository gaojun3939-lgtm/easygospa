import { createClient } from '@supabase/supabase-js';

// Public, browser-safe values. If they're absent (not configured yet), the
// "My orders" feature simply stays hidden instead of erroring.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let cachedClient = null;

export function isCustomerAuthConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseClient() {
  if (!isCustomerAuthConfigured()) return null;
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });
  }
  return cachedClient;
}
