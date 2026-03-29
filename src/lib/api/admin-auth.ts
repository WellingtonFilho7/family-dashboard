import type { Session } from '@supabase/supabase-js';

import { adminSupabase } from '@/lib/supabase';

export async function getAdminSession(): Promise<Session | null> {
  if (!adminSupabase) return null;
  const { data } = await adminSupabase.auth.getSession();
  return data.session;
}

export function subscribeAdminAuth(
  onChange: (session: Session | null) => void
) {
  if (!adminSupabase) return null;
  const { data } = adminSupabase.auth.onAuthStateChange((_event, session) => {
    onChange(session);
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

export async function signOutAdmin() {
  if (!adminSupabase) throw new Error('Supabase não configurado');
  return adminSupabase.auth.signOut();
}
