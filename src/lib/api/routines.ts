import { adminSupabase } from '@/lib/supabase';

function getClient() {
  if (!adminSupabase) throw new Error('Supabase não configurado');
  return adminSupabase;
}

export async function createRoutineTemplate(title: string, personId: string) {
  return getClient().from('kid_routine_templates').insert({
    title,
    person_id: personId,
    is_active: true,
    is_private: false,
  });
}

export async function updateRoutineTemplate(
  id: string,
  patch: Partial<{ title: string; is_active: boolean; is_private: boolean }>,
) {
  return getClient().from('kid_routine_templates').update(patch).eq('id', id);
}

export async function deleteRoutineTemplate(id: string) {
  return getClient().from('kid_routine_templates').delete().eq('id', id);
}
