import type { Session } from '@supabase/supabase-js';

import { adminSupabase } from '@/lib/supabase';

type LocationLike = {
  search: string;
  hash: string;
};

export function isPasswordRecoveryLocation(location: LocationLike) {
  const searchParams = new URLSearchParams(location.search);
  if (searchParams.get('mode') === 'recovery') return true;
  if (searchParams.get('type') === 'recovery') return true;

  const hashValue = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
  const hashParams = new URLSearchParams(hashValue);
  return hashParams.get('type') === 'recovery';
}

export async function getAdminSession(): Promise<Session | null> {
  if (!adminSupabase) return null;
  const { data } = await adminSupabase.auth.getSession();
  return data.session;
}

export function subscribeAdminAuth(
  onChange: (session: Session | null, event: string) => void
) {
  if (!adminSupabase) return null;
  const { data } = adminSupabase.auth.onAuthStateChange((event, session) => {
    onChange(session, event);
  });
  return data.subscription;
}

export async function signInAdmin(email: string, password: string) {
  if (!adminSupabase) throw new Error('Supabase não configurado');
  return adminSupabase.auth.signInWithPassword({ email, password });
}

export async function sendAdminPasswordReset(email: string, redirectTo: string) {
  if (!adminSupabase) throw new Error('Supabase não configurado');
  return adminSupabase.auth.resetPasswordForEmail(email, { redirectTo });
}

export async function updateAdminPassword(password: string) {
  if (!adminSupabase) throw new Error('Supabase não configurado');
  return adminSupabase.auth.updateUser({ password });
}

export async function signOutAdmin() {
  if (!adminSupabase) throw new Error('Supabase não configurado');
  return adminSupabase.auth.signOut();
}
