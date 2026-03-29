import { addDays, format } from 'date-fns';

import { parseDateOnly } from '@/lib/date-utils';
import { publicSupabase } from '@/lib/supabase';
import type {
  FamilyData,
  HomeschoolNote,
  KidRoutineCheck,
  KidRoutineTemplate,
  OneOffItem,
  Person,
  RecurringItem,
  ReplenishItem,
  SupplyItemState,
} from '@/lib/types';

type PersonRow = {
  id: string;
  name: string;
  color: string;
  type: Person['type'];
  is_private?: boolean | null;
  sort_order?: number | null;
};

type AgendaRow = {
  id: string;
  title: string;
  day_of_week?: number | null;
  date?: string | null;
  time_text?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  person_id?: string | null;
  person_ids?: string[] | null;
  is_private?: boolean | null;
};

type ReplenishRow = {
  id: string;
  title: string;
  urgency: ReplenishItem['urgency'];
  is_active?: boolean | null;
  is_private?: boolean | null;
};

type SupplyItemStateRow = {
  item_id: string;
  current_stock?: number | string | null;
  estimated_unit_price?: number | string | null;
  updated_at?: string | null;
};

type TemplateRow = {
  id: string;
  person_id: string;
  title: string;
  is_active?: boolean | null;
  is_private?: boolean | null;
};

type CheckRow = {
  id: string;
  template_id: string;
  date: string;
  completed?: boolean | null;
};

type HomeschoolNoteRow = {
  id: string;
  kid_person_id: string;
  notes?: string[] | null;
  created_at?: string | null;
  is_private?: boolean | null;
};

type SupabaseClient = NonNullable<typeof publicSupabase>;
type RelationError = {
  code?: string | null;
  message?: string | null;
  status?: number | null;
};

export async function fetchFamilyData(
  client: SupabaseClient,
  windowStart: string,
  windowEnd: string,
): Promise<FamilyData> {
  const [
    peopleRes,
    recurringRes,
    oneOffRes,
    replenishRes,
    supplyRes,
    templatesRes,
    checksRes,
    focusRes,
    notesRes,
    settingsRes,
  ] = await Promise.all([
    client.from('people').select('*').order('sort_order', { ascending: true }),
    client.from('recurring_items').select('*'),
    client.from('one_off_items').select('*').gte('date', windowStart).lte('date', windowEnd),
    client.from('replenish_items').select('*'),
    client.from('supply_item_state').select('*'),
    client.from('kid_routine_templates').select('*'),
    client.from('kid_routine_checks').select('*').gte('date', windowStart).lte('date', windowEnd),
    client.from('weekly_focus').select('*').eq('is_active', true).limit(1),
    client.from('homeschool_notes').select('*'),
    client.from('settings').select('*').eq('id', 1).limit(1),
  ]);

  const anyError =
    peopleRes.error ||
    recurringRes.error ||
    oneOffRes.error ||
    replenishRes.error ||
    getOptionalRelationError('supply_item_state', supplyRes.error) ||
    templatesRes.error ||
    checksRes.error ||
    focusRes.error ||
    notesRes.error ||
    settingsRes.error;
  if (anyError) throw anyError;

  const people = (peopleRes.data ?? [])
    .map(toPerson)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const recurringItems = (recurringRes.data ?? []).map(toRecurring);
  const oneOffItems = (oneOffRes.data ?? []).map(toOneOff);
  const replenishItems = (replenishRes.data ?? []).map(toReplenish);
  const supplyStates = (supplyRes.data ?? []).map(toSupplyItemState);
  const kidRoutineTemplates = (templatesRes.data ?? []).map(toTemplate);
  const kidRoutineChecks = (checksRes.data ?? []).map(toCheck);
  const weeklyFocus = (focusRes.data ?? []).map((item) => ({
    id: item.id,
    text: item.text,
    reference: item.reference ?? undefined,
    isActive: Boolean(item.is_active),
  }));
  const homeschoolNotes = (notesRes.data ?? []).map(toHomeschoolNote);
  const settingsRow = settingsRes.data?.[0] ?? { id: 1, visit_mode: false };

  return {
    people,
    recurringItems,
    oneOffItems,
    replenishItems,
    supplyStates,
    kidRoutineTemplates,
    kidRoutineChecks,
    weeklyFocus,
    homeschoolNotes,
    settings: { visitMode: Boolean(settingsRow.visit_mode) },
  };
}

export function getRelativeDateKey(dateKey: string, offsetDays: number) {
  const base = parseDateOnly(dateKey);
  return format(addDays(base, offsetDays), 'yyyy-MM-dd');
}

const toPerson = (row: PersonRow): Person => ({
  id: row.id,
  name: row.name,
  color: row.color,
  type: row.type,
  isPrivate: Boolean(row.is_private),
  sortOrder: row.sort_order ?? 0,
});

const normalizeDbTime = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)/);
  if (!match) return null;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
};

const getAgendaPersonIds = (row: AgendaRow) => {
  const rowPersonIds = Array.isArray(row.person_ids)
    ? row.person_ids.filter(Boolean)
    : [];
  if (rowPersonIds.length > 0) return rowPersonIds;
  return row.person_id ? [row.person_id] : [];
};

const toRecurring = (row: AgendaRow): RecurringItem => {
  const personIds = getAgendaPersonIds(row);
  const personId = row.person_id ?? personIds[0] ?? '';
  const startTime = normalizeDbTime(row.start_time);
  const endTime = normalizeDbTime(row.end_time);
  const timeText = row.time_text ?? (startTime && endTime ? `${startTime}–${endTime}` : startTime ?? '');

  return {
    id: row.id,
    title: row.title,
    dayOfWeek: Number(row.day_of_week ?? 1),
    timeText,
    startTime,
    endTime,
    personId,
    personIds,
    isPrivate: Boolean(row.is_private),
  };
};

const toOneOff = (row: AgendaRow): OneOffItem => {
  const personIds = getAgendaPersonIds(row);
  const personId = row.person_id ?? personIds[0] ?? '';
  const startTime = normalizeDbTime(row.start_time);
  const endTime = normalizeDbTime(row.end_time);
  const timeText = row.time_text ?? (startTime && endTime ? `${startTime}–${endTime}` : startTime ?? '');

  return {
    id: row.id,
    title: row.title,
    date: row.date ?? '',
    timeText,
    startTime,
    endTime,
    personId,
    personIds,
    isPrivate: Boolean(row.is_private),
  };
};

const toReplenish = (row: ReplenishRow): ReplenishItem => ({
  id: row.id,
  title: row.title,
  urgency: row.urgency,
  isActive: Boolean(row.is_active),
  isPrivate: Boolean(row.is_private),
});

const toSupplyItemState = (row: SupplyItemStateRow): SupplyItemState => ({
  itemId: row.item_id,
  currentStock: normalizeDbNumber(row.current_stock) ?? 0,
  estimatedUnitPrice: normalizeDbNumber(row.estimated_unit_price),
  updatedAt: row.updated_at ?? null,
});

const toTemplate = (row: TemplateRow): KidRoutineTemplate => ({
  id: row.id,
  personId: row.person_id,
  title: row.title,
  isActive: Boolean(row.is_active),
  isPrivate: Boolean(row.is_private),
});

const toCheck = (row: CheckRow): KidRoutineCheck => ({
  id: row.id,
  templateId: row.template_id,
  date: row.date,
  completed: row.completed ?? true,
});

const toHomeschoolNote = (row: HomeschoolNoteRow): HomeschoolNote => ({
  id: row.id,
  kidPersonId: row.kid_person_id,
  notes: row.notes ?? [],
  createdAt: row.created_at ?? new Date().toISOString(),
  isPrivate: Boolean(row.is_private),
});

const normalizeDbNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const getOptionalRelationError = (relationName: string, error: RelationError | null) => {
  if (!error) return null;
  const code = error.code ?? null;
  const message = error.message ?? '';
  const missingRelation =
    code === '42P01' ||
    code === 'PGRST205' ||
    error.status === 404 ||
    message.includes(`'${relationName}'`) ||
    message.includes(`"${relationName}"`);

  return missingRelation ? null : error;
};
