import { adminSupabase } from '@/lib/supabase';

function getClient() {
  if (!adminSupabase) throw new Error('Supabase não configurado');
  return adminSupabase;
}

type WeeklyFocusPayload = {
  text: string;
  reference: string;
  is_active: true;
};

export function buildWeeklyFocusMutation(
  existingId: string | null,
  text: string,
  reference: string,
): { kind: 'update'; id: string; payload: WeeklyFocusPayload } | { kind: 'insert'; payload: WeeklyFocusPayload } {
  const payload: WeeklyFocusPayload = {
    text,
    reference,
    is_active: true,
  };

  if (existingId) {
    return {
      kind: 'update',
      id: existingId,
      payload,
    };
  }

  return {
    kind: 'insert',
    payload,
  };
}

export async function setWeeklyFocus(existingId: string | null, text: string, reference: string) {
  const client = getClient();
  const mutation = buildWeeklyFocusMutation(existingId, text, reference);

  if (mutation.kind === 'update') {
    return client.from('weekly_focus').update(mutation.payload).eq('id', mutation.id);
  }

  return client.from('weekly_focus').insert(mutation.payload);
}

export async function upsertHomeschoolNote(
  noteId: string | null,
  kidPersonId: string,
  notes: string[],
  isPrivate: boolean,
) {
  const client = getClient();
  const payload = { kid_person_id: kidPersonId, notes, is_private: isPrivate };

  if (noteId) {
    return client.from('homeschool_notes').update(payload).eq('id', noteId);
  }

  return client.from('homeschool_notes').insert(payload);
}
