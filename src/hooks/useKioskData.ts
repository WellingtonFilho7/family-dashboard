import { useEffect, useMemo, useState } from 'react';
import { addDays, formatISO, isSameDay, startOfWeek } from 'date-fns';
import { toast } from 'sonner';

import { mockData } from '@/lib/mockData';
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

export function useKioskData(visitMode: boolean) {
  const [rawData, setRawData] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [routineChecks, setRoutineChecks] = useState<KidRoutineCheck[]>([]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 80));
        if (!active) return;
        setRawData(mockData);
        setRoutineChecks(mockData.kidRoutineChecks);
      } catch (error) {
        if (!active) return;
        console.error(error);
        toast.error('Erro ao carregar dados do painel');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const weekStart = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 0 }),
    []
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }).map((_, idx) => addDays(weekStart, idx)),
    [weekStart]
  );

  const data = useMemo(() => {
    if (!rawData) return null;
    const hidePrivate = visitMode || rawData.settings.visitMode;
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

    const recurringItems: CalendarItem[] = data.recurringItems.map((item) => {
      const targetDate = addDays(weekStart, item.dayOfWeek);
      const person = personById.get(item.personId);
      return {
        id: item.id,
        title: item.title,
        timeText: item.timeText,
        date: targetDate,
        personId: item.personId,
        personColor: person?.color ?? '#0EA5E9',
      };
    });

    const oneOffItems: CalendarItem[] = data.oneOffItems
      .map((item) => {
        const date = new Date(item.date);
        const person = personById.get(item.personId);
        return {
          id: item.id,
          title: item.title,
          timeText: item.timeText,
          date,
          personId: item.personId,
          personColor: person?.color ?? '#0EA5E9',
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

  const toggleRoutine = (templateId: string) => {
    const todayKey = formatISO(new Date(), { representation: 'date' });
    let nextCompleted = true;
    setRoutineChecks((prev) => {
      const existing = prev.find(
        (check) => check.templateId === templateId && check.date === todayKey
      );
      if (existing) {
        nextCompleted = !existing.completed;
        return prev.map((check) =>
          check.id === existing.id ? { ...check, completed: !check.completed } : check
        );
      }
      const newCheck: KidRoutineCheck = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
        templateId,
        date: todayKey,
        completed: true,
      };
      nextCompleted = true;
      return [...prev, newCheck];
    });
    return nextCompleted;
  };

  return {
    data,
    loading,
    weekStart,
    weekDays,
    calendarByDay,
    routineChecks,
    toggleRoutine,
    refresh: () =>
      setRawData(
        typeof structuredClone !== 'undefined'
          ? structuredClone(mockData)
          : JSON.parse(JSON.stringify(mockData))
      ),
  };
}
