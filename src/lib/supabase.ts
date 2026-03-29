import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasWindow = () => typeof window !== 'undefined';

const sessionStorageAdapter = {
  getItem(key: string) {
    if (!hasWindow()) return null;
    return window.sessionStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (!hasWindow()) return;
    window.sessionStorage.setItem(key, value);
  },
  removeItem(key: string) {
    if (!hasWindow()) return;
    window.sessionStorage.removeItem(key);
  },
};

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

export const publicSupabase =
  hasSupabaseConfig
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

export const adminSupabase =
  hasSupabaseConfig
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          storageKey: 'family-dashboard:admin-auth',
          storage: sessionStorageAdapter,
        },
      })
    : null;

// Backward-compatible alias while the admin CRUD components are migrated away
// from direct client usage.
export const supabase = adminSupabase;
