import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { cn } from '@/lib/utils';

import { withAlpha } from './lib/colors';
import {
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
  TIMELINE_VISIBLE_HOURS,
  buildDayTimeline,
  nowPercent,
} from './lib/timeline';
import type { DayTimelineData } from './lib/timeline';
import type { MockEvent, MockPerson } from './mock';
import type { PanelDayBucket, PanelOutletContext } from './PanelV2';
import { TimelineEventCard } from './components/TimelineEventCard';

const HOURS = Array.from({ length: TIMELINE_VISIBLE_HOURS + 1 }, (_, i) => TIMELINE_START_HOUR + i);

interface AnalyzedBucket {
  bucket: PanelDayBucket;
  data: DayTimelineData;
}

export default function WeekMode() {
  const { people, dayBuckets, loading, hasData, error } = useOutletContext<PanelOutletContext>();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const analyzed = useMemo<AnalyzedBucket[]>(
    () => dayBuckets.map((bucket) => ({ bucket, data: buildDayTimeline(bucket.events) })),
    [dayBuckets],
  );

  if (loading && !hasData) {
    return <WeekSkeleton />;
  }

  if (error && !hasData) {
    return <WeekError message={error} />;
  }

  if (analyzed.length === 0) {
    return <WeekSkeleton />;
  }

  const today = now;
  const hasAnyUntimed = analyzed.some(({ data }) => data.untimed.length > 0);
  const nowOffset = nowPercent(now);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Day headers */}
      <div className="grid grid-cols-[44px_repeat(7,minmax(0,1fr))] gap-2">
        <div />
        {analyzed.map(({ bucket }) => {
          const isToday = isSameDay(bucket.date, today);
          return (
            <div
              key={bucket.date.toISOString()}
              className={cn(
                'flex items-center justify-between rounded-xl px-2 py-1.5',
                isToday ? 'bg-primary/10' : 'bg-transparent',
              )}
            >
              <div className="flex flex-col leading-none">
                <span
                  className={cn(
                    'text-[10px] font-semibold uppercase tracking-[0.18em]',
                    isToday ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {format(bucket.date, 'EEE', { locale: ptBR })}
                </span>
                <span
                  className={cn(
                    'mt-1 font-display text-xl font-bold',
                    isToday ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {format(bucket.date, 'd')}
                </span>
              </div>
              {isToday && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-widest text-primary-foreground">
                  Hoje
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* All-day pills */}
      {hasAnyUntimed && (
        <div className="grid grid-cols-[44px_repeat(7,minmax(0,1fr))] gap-2">
          <div className="flex items-center justify-end pr-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Dia
          </div>
          {analyzed.map(({ bucket, data }) => (
            <div key={bucket.date.toISOString()} className="flex flex-col gap-1">
              {data.untimed.map((event) => (
                <AllDayPill key={event.id} event={event} people={people} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="grid min-h-0 flex-1 grid-cols-[44px_repeat(7,minmax(0,1fr))] gap-2">
        <TimeColumn />
        {analyzed.map(({ bucket, data }) => (
          <DayTimelineColumn
            key={bucket.date.toISOString()}
            data={data}
            people={people}
            isToday={isSameDay(bucket.date, today)}
            nowOffset={isSameDay(bucket.date, today) ? nowOffset : null}
          />
        ))}
      </div>
    </div>
  );
}

function TimeColumn() {
  return (
    <div className="relative">
      {HOURS.slice(0, -1).map((hour, i) => {
        const top = (i / TIMELINE_VISIBLE_HOURS) * 100;
        return (
          <span
            key={hour}
            className="absolute right-1 -translate-y-1/2 text-[10px] font-medium tabular-nums text-muted-foreground/70"
            style={{ top: `${top}%` }}
          >
            {hour}h
          </span>
        );
      })}
      <span
        className="absolute right-1 -translate-y-full text-[10px] font-medium tabular-nums text-muted-foreground/70"
        style={{ top: '100%' }}
      >
        {TIMELINE_END_HOUR}h
      </span>
    </div>
  );
}

function DayTimelineColumn({
  data,
  people,
  isToday,
  nowOffset,
}: {
  data: DayTimelineData;
  people: MockPerson[];
  isToday: boolean;
  nowOffset: number | null;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/30',
        isToday ? 'bg-primary/[0.04]' : 'bg-card/40',
      )}
    >
      {HOURS.slice(1, -1).map((_, i) => {
        const top = ((i + 1) / TIMELINE_VISIBLE_HOURS) * 100;
        return (
          <div
            key={i}
            className="pointer-events-none absolute inset-x-0 border-t border-border/20"
            style={{ top: `${top}%` }}
          />
        );
      })}

      {nowOffset !== null && (
        <div
          className="pointer-events-none absolute inset-x-0 z-10"
          style={{ top: `${nowOffset}%` }}
        >
          <div className="relative">
            <span className="absolute -left-1 -top-[5px] h-2.5 w-2.5 rounded-full bg-destructive shadow" />
            <div className="h-px bg-destructive/80" />
          </div>
        </div>
      )}

      {data.timed.map((entry) => (
        <TimelineEventCard key={entry.event.id} entry={entry} people={people} />
      ))}
    </div>
  );
}

function AllDayPill({ event, people }: { event: MockEvent; people: MockPerson[] }) {
  const persons = event.personIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is MockPerson => Boolean(p));

  const isFamily = persons.length >= 3;
  const primaryColor = isFamily ? null : persons[0]?.color;

  const style = primaryColor
    ? {
        backgroundColor: withAlpha(primaryColor, 0.18),
        borderColor: withAlpha(primaryColor, 0.35),
      }
    : undefined;

  return (
    <div
      className="flex items-center gap-1.5 truncate rounded-md border border-border/40 bg-muted/40 px-2 py-1 text-[10px] font-semibold leading-none text-foreground"
      style={style}
      title={event.title}
    >
      <span className="truncate">{event.title}</span>
    </div>
  );
}

function WeekSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="grid grid-cols-[44px_repeat(7,minmax(0,1fr))] gap-2">
        <div />
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-xl bg-muted/40"
          />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[44px_repeat(7,minmax(0,1fr))] gap-2">
        <div />
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-border/30 bg-muted/30"
          />
        ))}
      </div>
    </div>
  );
}

function WeekError({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-semibold text-destructive">Não foi possível carregar a agenda</p>
        <p className="mt-2 text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
