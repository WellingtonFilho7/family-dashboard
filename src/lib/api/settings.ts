import { adminSupabase } from '@/lib/supabase';

export async function updateVisitMode(visitMode: boolean) {
  if (!adminSupabase) throw new Error('Supabase não configurado');
  return adminSupabase
    .from('settings')
    .upsert({ id: 1, visit_mode: visitMode }, { onConflict: 'id' });
}
