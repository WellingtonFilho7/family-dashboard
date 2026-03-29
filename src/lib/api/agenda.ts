import { adminSupabase } from '@/lib/supabase';

function getClient() {
  if (!adminSupabase) throw new Error('Supabase não configurado');
  return adminSupabase;
}

export type AgendaTable = 'recurring_items' | 'one_off_items';

type AgendaBasePayload = {
  title: string;
  start_time: string | null;
  end_time: string | null;
  person_ids: string[];
  is_private?: boolean;
};

export type RecurringAgendaPayload = AgendaBasePayload & {
  day_of_week: number;
};

export type OneOffAgendaPayload = AgendaBasePayload & {
  date: string;
};

export type AgendaUpdatePayload =
  | (AgendaBasePayload & { day_of_week: number })
  | (AgendaBasePayload & { date: string });

export async function createRecurringAgendaItem(payload: RecurringAgendaPayload) {
  return getClient().from('recurring_items').insert(payload);
}

export async function createOneOffAgendaItem(payload: OneOffAgendaPayload) {
  return getClient().from('one_off_items').insert(payload);
}

export async function updateAgendaItem(table: AgendaTable, id: string, payload: AgendaUpdatePayload) {
  return getClient().from(table).update(payload).eq('id', id);
}

export async function updateAgendaTitle(table: AgendaTable, id: string, title: string) {
  return getClient().from(table).update({ title }).eq('id', id);
}

export async function updateAgendaPrivacy(table: AgendaTable, id: string, isPrivate: boolean) {
  return getClient().from(table).update({ is_private: isPrivate }).eq('id', id);
}

export async function deleteAgendaItem(table: AgendaTable, id: string) {
  return getClient().from(table).delete().eq('id', id);
}
