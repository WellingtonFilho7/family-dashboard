import { adminSupabase } from '@/lib/supabase';
import type { PersonType } from '@/lib/types';

function getClient() {
  if (!adminSupabase) throw new Error('Supabase não configurado');
  return adminSupabase;
}

export type CreatePersonInput = {
  name: string;
  color: string;
  type: PersonType;
  sortOrder: number;
  isPrivate: boolean;
};

export type UpdatePersonInput = Partial<{
  name: string;
  color: string;
  type: PersonType;
  sort_order: number;
  is_private: boolean;
}>;

export async function createPerson(input: CreatePersonInput) {
  return getClient().from('people').insert({
    name: input.name,
    color: input.color,
    type: input.type,
    sort_order: input.sortOrder,
    is_private: input.isPrivate,
  });
}

export async function updatePerson(id: string, patch: UpdatePersonInput) {
  return getClient().from('people').update(patch).eq('id', id);
}

export async function swapPeopleSortOrder(
  firstId: string,
  firstSortOrder: number,
  secondId: string,
  secondSortOrder: number,
) {
  return Promise.all([
    updatePerson(firstId, { sort_order: secondSortOrder }),
    updatePerson(secondId, { sort_order: firstSortOrder }),
  ]);
}

export async function deletePerson(id: string) {
  return getClient().from('people').delete().eq('id', id);
}
