import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Supabase bağlantısı yapılandırılmış mı kontrol eder.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));
}

export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => ({
        select: () => ({ order: () => Promise.resolve({ data: null }), eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null }) }) }),
        update: () => ({ eq: () => Promise.resolve({ data: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null }) }),
        upsert: () => Promise.resolve({ data: null })
      })
    } as unknown as SupabaseClient;
