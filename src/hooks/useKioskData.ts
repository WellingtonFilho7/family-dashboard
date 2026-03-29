import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, isSameDay, startOfWeek } from 'date-fns';
import { toast } from 'sonner';

import { getFamilyDateKey, parseDateOnly } from '@/lib/date-utils';
import { fetchFamilyData, getRelativeDateKey } from '@/lib/api/family-data';
import { adminSupabase, hasSupabaseConfig, publicSupabase } from '@/lib/supabase';
import { mockData } from '@/lib/mockData';
import { computeRoutineToggle } from '@/lib/routine-utils';
import { buildSupplyModuleData } from '@/lib/supply-module';
import type {
  CalendarItem,
  FamilyData,
  KidRoutineCheck,
  Person,
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
const hasSupabaseUrl = Boolean(supabaseUrlEnv);
const hasSupabaseEnv = hasSupabaseConfig;
const debugSupabase =
  import.meta.env.DEV || import.meta.env.VITE_DEBUG_SUPABASE === 'true';
const PUBLIC_OFFLINE_CACHE_KEY = 'family-dashboard:offline-cache:public';
const ADMIN_OFFLINE_CACHE_KEY = 'family-dashboard:offline-cache:admin';

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
  const client = requireAuth ? adminSupabase : publicSupabase;
  const offlineCacheKey = requireAuth ? ADMIN_OFFLINE_CACHE_KEY : PUBLIC_OFFLINE_CACHE_KEY;
  const isMock = !isProd && (!client || !hasSupabaseEnv);
  const hasConfig = Boolean(client) && hasSupabaseEnv;

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
        hasConfig,
        supabaseReady: Boolean(client),
        supabaseUrlHost: host,
      });
    }

    const missingEnv = [
      !hasSupabaseUrl ? 'VITE_SUPABASE_URL' : null,
      !hasSupabaseEnv ? 'VITE_SUPABASE_ANON_KEY' : null,
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

        if (client && hasConfig) {
          const data = await fetchFamilyData(client, getRelativeDateKey(dateKey, -30), getRelativeDateKey(dateKey, 30));
          if (!active) return;
          setRawData(data);
          setRoutineChecks(data.kidRoutineChecks);
          setIsStale(false);
          lastFetchRef.current = Date.now();
          try { localStorage.setItem(offlineCacheKey, JSON.stringify(data)); } catch { /* quota */ }
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
          const cached = localStorage.getItem(offlineCacheKey);
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
  }, [client, dateKey, hasConfig, isMock, isProd, offlineCacheKey, requireAuth, sessionToken]);

  useEffect(() => {
    routineChecksRef.current = routineChecks;
  }, [routineChecks]);

  // Midnight rollover — recalculates week and triggers refetch via dateKey dep
  useEffect(() => {
    const id = window.setInterval(() => {
      const nextDateKey = getFamilyDateKey();
      setDateKey((current) => (current === nextDateKey ? current : nextDateKey));
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const weekStart = useMemo(
    () => startOfWeek(parseDateOnly(dateKey), { weekStartsOn: 0 }),
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
  }, [bypassVisitMode, rawData, visitMode]);

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

  const supplyModule = useMemo(
    () => buildSupplyModuleData(data?.supplyStates ?? []),
    [data?.supplyStates],
  );

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

      if (client) {
        const { error: upsertError } = await client.from('kid_routine_checks').upsert(
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
    if (!client || !hasConfig) return;
    try {
      const freshData = await fetchFamilyData(client, getRelativeDateKey(dateKey, -30), getRelativeDateKey(dateKey, 30));
      setRawData(freshData);
      setRoutineChecks(freshData.kidRoutineChecks);
      setIsStale(false);
      lastFetchRef.current = Date.now();
      try { localStorage.setItem(offlineCacheKey, JSON.stringify(freshData)); } catch { /* quota */ }
    } catch (err) {
      console.error('[auto-refresh]', err);
    }
  }, [client, dateKey, hasConfig, offlineCacheKey]);

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
    supplyModule,
    routineChecks,
    toggleRoutine,
    refresh: async () => {
      if (client) {
        try {
          setLoading(true);
          const data = await fetchFamilyData(client, getRelativeDateKey(dateKey, -30), getRelativeDateKey(dateKey, 30));
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
