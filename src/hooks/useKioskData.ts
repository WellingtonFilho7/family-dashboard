import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, isSameDay, startOfWeek } from 'date-fns';
import { toast } from 'sonner';

import { getFamilyDate, getFamilyDateKey, parseDateOnly } from '@/lib/date-utils';
import { supabase } from '@/lib/supabase';
import { mockData } from '@/lib/mockData';
import { computeRoutineToggle } from '@/lib/routine-utils';
import type {
  CalendarItem,
  FamilyData,
  HomeschoolNote,
  KidRoutineCheck,
  KidRoutineTemplate,
  OneOffItem,
  Person,
  RecurringItem,
  ReplenishItem,
} from '@/lib/types';

const filterPrivate = <T extends { isPrivate?: boolean }>(
  items: T[] | undefined,
  hide: boolean
) => {
  if (!items) return [];
  return hide ? items.filter((item) => !item.isPrivate) : items;
};

const maskNames = (people: Person[], hide: boolean) =>
  people.map((person) =>
    hide && person.isPrivate
      ? { ...person, name: 'Família', color: '#94A3B8' }
      : person
  );

type UseKioskOptions = {
  bypassVisitMode?: boolean;
  requireAuth?: boolean;
  sessionToken?: string | null;
};

const supabaseUrlEnv = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonEnv = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseUrl = Boolean(supabaseUrlEnv);
const hasSupabaseAnon = Boolean(supabaseAnonEnv);
const hasSupabaseEnv = hasSupabaseUrl && hasSupabaseAnon;
const debugSupabase =
  import.meta.env.DEV || import.meta.env.VITE_DEBUG_SUPABASE === 'true';
const OFFLINE_CACHE_KEY = 'family-dashboard:offline-cache';

export function useKioskData(
  visitMode: boolean,
  { bypassVisitMode = false, requireAuth = false, sessionToken = null }: UseKioskOptions = {}
) {
  const [rawData, setRawData] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [routineChecks, setRoutineChecks] = useState<KidRoutineCheck[]>([]);
  const routineChecksRef = useRef<KidRoutineCheck[]>([]);
  const pendingRoutineKeysRef = useRef(new Set<string>());
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [dateKey, setDateKey] = useState(() => getFamilyDateKey());
  const lastFetchRef = useRef(Date.now());
  const isProd = import.meta.env.PROD;
  const isMock = !isProd && (!supabase || !hasSupabaseEnv);
  const hasConfig = Boolean(supabase) && hasSupabaseEnv;

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    if (debugSupabase) {
      const host = hasSupabaseUrl
        ? (() => {
            try {
              return new URL(supabaseUrlEnv as string).host;
            } catch {
              return 'invalid-url';
            }
          })()
        : 'missing';
      // Diagnóstico (dev / toggle)
      console.log('[supabase-debug]', {
        isProd,
        hasSupabaseEnv,
        hasSupabaseUrl,
        hasSupabaseAnon,
        hasConfig,
        supabaseReady: Boolean(supabase),
        supabaseUrlHost: host,
      });
    }

    const missingEnv = [
      !hasSupabaseUrl ? 'VITE_SUPABASE_URL' : null,
      !hasSupabaseAnon ? 'VITE_SUPABASE_ANON_KEY' : null,
    ]
      .filter(Boolean)
      .join(', ');

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (requireAuth && (!sessionToken || sessionToken.length === 0)) {
          if (!active) return;
          setRawData(null);
          setRoutineChecks([]);
          setError('Sessão necessária para carregar dados.');
          return;
        }

        if (supabase && hasConfig) {
          const data = await fetchAll();
          if (!active) return;
          setRawData(data);
          setRoutineChecks(data.kidRoutineChecks);
          setIsStale(false);
          lastFetchRef.current = Date.now();
          try { localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(data)); } catch { /* quota */ }
        } else if (isMock) {
          await new Promise((resolve) => setTimeout(resolve, 80));
          if (!active) return;
          setRawData(mockData);
          setRoutineChecks(mockData.kidRoutineChecks);
        } else {
          setError(
            `Supabase não configurado${
              missingEnv ? ` (${missingEnv})` : ''
            }`
          );
          setRawData(null);
          setRoutineChecks([]);
        }
      } catch (err) {
        if (!active) return;
        console.error(err);
        // Offline fallback: try to load from cache
        try {
          const cached = localStorage.getItem(OFFLINE_CACHE_KEY);
          if (cached) {
            const data = JSON.parse(cached) as FamilyData;
            setRawData(data);
            setRoutineChecks(data.kidRoutineChecks);
            setIsStale(true);
            setError(null);
            toast.info('Usando dados em cache (offline)');
            return;
          }
        } catch { /* parse error */ }
        setError('Erro ao carregar dados do painel');
        toast.error('Erro ao carregar dados do painel');
      } finally {
        if (active) setLoading(false);
      }
    };
    // Em produção sem config, não tenta mock
    if (isProd && !hasConfig) {
      setLoading(false);
      setError(
        `Supabase não configurado${
          missingEnv ? ` (${missingEnv})` : ''
        }`
      );
      return;
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [hasConfig, isMock, isProd, requireAuth, sessionToken, dateKey]);

  useEffect(() => {
    routineChecksRef.current = routineChecks;
  }, [routineChecks]);

  // Midnight rollover — recalculates week and triggers refetch via dateKey dep
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime() + 1_000;
    const id = setTimeout(() => setDateKey(getFamilyDateKey()), msUntilMidnight);
    return () => clearTimeout(id);
  }, [dateKey]);

  const weekStart = useMemo(
    () => startOfWeek(getFamilyDate(), { weekStartsOn: 0 }),
    [dateKey]
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }).map((_, idx) => addDays(weekStart, idx)),
    [weekStart]
  );

    const data = useMemo(() => {
    if (!rawData) return null;
    const hidePrivate = !bypassVisitMode && (visitMode || rawData.settings.visitMode);
    const people = maskNames(rawData.people, hidePrivate);

    return {
      ...rawData,
      people,
      settings: { ...rawData.settings, visitMode: hidePrivate },
      recurringItems: filterPrivate(rawData.recurringItems, hidePrivate),
      oneOffItems: filterPrivate(rawData.oneOffItems, hidePrivate),
      replenishItems: filterPrivate(rawData.replenishItems, hidePrivate),
      kidRoutineTemplates: filterPrivate(rawData.kidRoutineTemplates, hidePrivate),
      homeschoolNotes: filterPrivate(rawData.homeschoolNotes, hidePrivate),
    };
  }, [rawData, visitMode]);

  const calendarByDay = useMemo(() => {
    if (!data) return [];
    const personById = new Map(data.people.map((p) => [p.id, p]));
    const resolvePersonIds = (item: { personId: string; personIds?: string[] }) => {
      if (item.personIds?.length) return item.personIds;
      return item.personId ? [item.personId] : [];
    };
    const resolvePersonColors = (personIds: string[]) => {
      if (personIds.length === 0) return ['#0EA5E9'];
      return personIds.map((pid) => personById.get(pid)?.color ?? '#0EA5E9');
    };

    const recurringItems: CalendarItem[] = data.recurringItems.map((item) => {
      const offset = Math.max(0, Math.min(6, item.dayOfWeek - 1));
      const targetDate = addDays(weekStart, offset);
      const personIds = resolvePersonIds(item);
      return {
        id: item.id,
        title: item.title,
        timeText: item.timeText,
        startTime: item.startTime ?? null,
        endTime: item.endTime ?? null,
        date: targetDate,
        personIds,
        personColors: resolvePersonColors(personIds),
      };
    });

    const oneOffItems: CalendarItem[] = data.oneOffItems
      .map((item) => {
        const date = parseDateOnly(item.date);
        const personIds = resolvePersonIds(item);
        return {
          id: item.id,
          title: item.title,
          timeText: item.timeText,
          startTime: item.startTime ?? null,
          endTime: item.endTime ?? null,
          date,
          personIds,
          personColors: resolvePersonColors(personIds),
        };
      })
      .filter(
        (item) =>
          item.date >= weekStart && item.date <= addDays(weekStart, 6)
      );

    return weekDays.map((day) => ({
      date: day,
      items: [...recurringItems, ...oneOffItems].filter((item) =>
        isSameDay(item.date, day)
      ),
    }));
  }, [data, weekDays, weekStart]);

  const toggleRoutine = async (templateId: string) => {
    const todayKey = getFamilyDateKey();
    const toggleKey = `${templateId}-${todayKey}`;
    const currentChecks = routineChecksRef.current;
    const existing = currentChecks.find(
      (check) => check.templateId === templateId && check.date === todayKey
    );

    if (pendingRoutineKeysRef.current.has(toggleKey)) {
      return existing?.completed ?? false;
    }

    pendingRoutineKeysRef.current.add(toggleKey);
    try {
      const { nextCompleted, updatedChecks } = computeRoutineToggle(
        currentChecks,
        templateId,
        todayKey,
        () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`)
      );

      if (supabase) {
        const { error: upsertError } = await supabase.from('kid_routine_checks').upsert(
          {
            template_id: templateId,
            date: todayKey,
            completed: nextCompleted,
          },
          { onConflict: 'template_id,date' }
        );
        if (upsertError) {
          toast.error('Erro ao salvar rotina');
          return existing?.completed ?? false;
        }
      }

      routineChecksRef.current = updatedChecks;
      setRoutineChecks(updatedChecks);
      return nextCompleted;
    } finally {
      pendingRoutineKeysRef.current.delete(toggleKey);
    }
  };

  // Silent background refresh (no loading spinner, no error toasts)
  const silentRefresh = useCallback(async () => {
    if (!supabase || !hasConfig) return;
    try {
      const freshData = await fetchAll();
      setRawData(freshData);
      setRoutineChecks(freshData.kidRoutineChecks);
      setIsStale(false);
      lastFetchRef.current = Date.now();
      try { localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(freshData)); } catch { /* quota */ }
    } catch (err) {
      console.error('[auto-refresh]', err);
    }
  }, [hasConfig]);

  // Auto-refresh: 5-min interval + refetch on tab focus if stale
  useEffect(() => {
    if (!hasConfig || requireAuth) return;
    const INTERVAL = 5 * 60 * 1_000;
    const id = setInterval(silentRefresh, INTERVAL);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastFetchRef.current;
        if (elapsed > 60_000) silentRefresh();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [hasConfig, requireAuth, silentRefresh]);

  return {
    data,
    loading,
    error,
    isStale,
    isMock,
    isProd,
    hasConfig,
    weekStart,
    weekDays,
    calendarByDay,
    routineChecks,
    toggleRoutine,
    refresh: async () => {
      if (supabase) {
        try {
          setLoading(true);
          const data = await fetchAll();
          setRawData(data);
          setRoutineChecks(data.kidRoutineChecks);
        } catch (err) {
          console.error(err);
          toast.error('Erro ao atualizar dados');
        } finally {
          setLoading(false);
        }
      } else {
        setRawData(
          typeof structuredClone !== 'undefined'
            ? structuredClone(mockData)
            : JSON.parse(JSON.stringify(mockData))
        );
      }
    },
  };
}

async function fetchAll(): Promise<FamilyData> {
  if (!supabase) throw new Error('Supabase não configurado (client não criado)');

  const [
    peopleRes,
    recurringRes,
    oneOffRes,
    replenishRes,
    templatesRes,
    checksRes,
    focusRes,
    notesRes,
    settingsRes,
  ] = await Promise.all([
    supabase.from('people').select('*').order('sort_order', { ascending: true }),
    supabase.from('recurring_items').select('*'),
    supabase.from('one_off_items').select('*'),
    supabase.from('replenish_items').select('*'),
    supabase.from('kid_routine_templates').select('*'),
    supabase.from('kid_routine_checks').select('*'),
    supabase.from('weekly_focus').select('*'),
    supabase.from('homeschool_notes').select('*'),
    supabase.from('settings').select('*').eq('id', 1),
  ]);

  const anyError =
    peopleRes.error ||
    recurringRes.error ||
    oneOffRes.error ||
    replenishRes.error ||
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
    kidRoutineTemplates,
    kidRoutineChecks,
    weeklyFocus,
    homeschoolNotes,
    settings: { visitMode: Boolean(settingsRow.visit_mode) },
  };
}

const toPerson = (row: any): Person => ({
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

const toRecurring = (row: any): RecurringItem => {
  const rowPersonIds = Array.isArray(row.person_ids)
    ? row.person_ids.filter(Boolean)
    : [];
  const personIds = rowPersonIds.length > 0
    ? rowPersonIds
    : row.person_id
      ? [row.person_id]
      : [];
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

const toOneOff = (row: any): OneOffItem => {
  const rowPersonIds = Array.isArray(row.person_ids)
    ? row.person_ids.filter(Boolean)
    : [];
  const personIds = rowPersonIds.length > 0
    ? rowPersonIds
    : row.person_id
      ? [row.person_id]
      : [];
  const personId = row.person_id ?? personIds[0] ?? '';
  const startTime = normalizeDbTime(row.start_time);
  const endTime = normalizeDbTime(row.end_time);
  const timeText = row.time_text ?? (startTime && endTime ? `${startTime}–${endTime}` : startTime ?? '');

  return {
    id: row.id,
    title: row.title,
    date: row.date,
    timeText,
    startTime,
    endTime,
    personId,
    personIds,
    isPrivate: Boolean(row.is_private),
  };
};

const toReplenish = (row: any): ReplenishItem => ({
  id: row.id,
  title: row.title,
  urgency: row.urgency,
  isActive: Boolean(row.is_active),
  isPrivate: Boolean(row.is_private),
});

const toTemplate = (row: any): KidRoutineTemplate => ({
  id: row.id,
  personId: row.person_id,
  title: row.title,
  isActive: Boolean(row.is_active),
  isPrivate: Boolean(row.is_private),
});

const toCheck = (row: any): KidRoutineCheck => ({
  id: row.id,
  templateId: row.template_id,
  date: row.date,
  completed: row.completed ?? true,
});

const toHomeschoolNote = (row: any): HomeschoolNote => ({
  id: row.id,
  kidPersonId: row.kid_person_id,
  notes: row.notes ?? [],
  createdAt: row.created_at ?? new Date().toISOString(),
  isPrivate: Boolean(row.is_private),
});
