import { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { useKioskData } from '@/hooks/useKioskData';

import { calendarItemToEvent, personToMockPerson } from './lib/adapter';
import { mockPeople } from './mock';
import type { MockEvent, MockPerson } from './mock';
import { PanelHeader } from './components/PanelHeader';
import { SideNav } from './components/SideNav';

export interface PanelDayBucket {
  date: Date;
  events: MockEvent[];
}

export interface PanelOutletContext {
  people: MockPerson[];
  dayBuckets: PanelDayBucket[];
  loading: boolean;
  error: string | null;
  isStale: boolean;
  hasData: boolean;
  refresh: () => Promise<void>;
}

export default function PanelV2() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const { data, calendarByDay, loading, error, isStale, refresh } = useKioskData(false);

  const people = useMemo<MockPerson[]>(() => {
    if (!data) return [];
    return data.people.map(personToMockPerson);
  }, [data]);

  const dayBuckets = useMemo<PanelDayBucket[]>(() => {
    return calendarByDay.map(({ date, items }, index) => ({
      date,
      events: items.map((item) => calendarItemToEvent(item, index)),
    }));
  }, [calendarByDay]);

  const hasData = people.length > 0;
  const headerPeople = hasData ? people : mockPeople;

  const ctx: PanelOutletContext = {
    people,
    dayBuckets,
    loading,
    error,
    isStale,
    hasData,
    refresh,
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <PanelHeader now={now} people={headerPeople} onRefresh={() => void refresh()} />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet context={ctx} />
        </main>
      </div>
    </div>
  );
}
