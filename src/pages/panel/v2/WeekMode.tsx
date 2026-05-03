import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { withAlpha } from './lib/colors';
import {
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
  TIMELINE_VISIBLE_HOURS,
  buildDayTimeline,
  nowPercent,
} from './lib/timeline';
import { mockEvents, mockPeople } from './mock';
import type { MockEvent, MockPerson } from './mock';
import { TimelineEventCard } from './components/TimelineEventCard';

const HOURS = Array.from({ length: TIMELINE_VISIBLE_HOURS + 1 }, (_, i) => TIMELINE_START_HOUR + i);

export default function WeekMode() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const today = now;
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dayData = days.map((_, dayIndex) =>
    buildDayTimeline(mockEvents.filter((e) => e.dayOfWeek === dayIndex)),
  );

  const hasAnyUntimed = dayData.some((d) => d.untimed.length > 0);
  const nowOffset = nowPercent(now);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Day headers */}
      <div className="grid grid-cols-[44px_repeat(7,minmax(0,1fr))] gap-2">
        <div />
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
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
                  {format(day, 'EEE', { locale: ptBR })}
                </span>
                <span
                  className={cn(
                    'mt-1 font-display text-xl font-bold',
                    isToday ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {format(day, 'd')}
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
          {dayData.map((data, dayIndex) => (
            <div key={dayIndex} className="flex flex-col gap-1">
              {data.untimed.map((event) => (
                <AllDayPill key={event.id} event={event} people={mockPeople} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="grid min-h-0 flex-1 grid-cols-[44px_repeat(7,minmax(0,1fr))] gap-2">
        <TimeColumn />
        {dayData.map((data, dayIndex) => {
          const isToday = isSameDay(days[dayIndex], today);
          return (
            <DayTimeline
              key={dayIndex}
              data={data}
              people={mockPeople}
              isToday={isToday}
              nowOffset={isToday ? nowOffset : null}
            />
          );
        })}
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

function DayTimeline({
  data,
  people,
  isToday,
  nowOffset,
}: {
  data: ReturnType<typeof buildDayTimeline>;
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
      {/* Hour grid lines */}
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

      {/* Now indicator (only on today) */}
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

      {/* Events */}
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
