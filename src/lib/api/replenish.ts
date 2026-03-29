import { adminSupabase } from '@/lib/supabase';

function getClient() {
  if (!adminSupabase) throw new Error('Supabase não configurado');
  return adminSupabase;
}

export type ReplenishPatch = Partial<{
  title: string;
  urgency: 'now' | 'soon';
  is_active: boolean;
  is_private: boolean;
}>;

export async function createReplenishItem(title: string, urgency: 'now' | 'soon') {
  return getClient().from('replenish_items').insert({
    title,
    urgency,
    is_active: true,
    is_private: false,
  });
}

export async function updateReplenishItem(id: string, patch: ReplenishPatch) {
  return getClient().from('replenish_items').update(patch).eq('id', id);
}

export async function deleteReplenishItem(id: string) {
  return getClient().from('replenish_items').delete().eq('id', id);
}
