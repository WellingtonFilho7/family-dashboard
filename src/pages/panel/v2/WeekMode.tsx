import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { cn } from '@/lib/utils';

import { mockEvents, mockPeople } from './mock';
import { EventCard } from './components/EventCard';

export default function WeekMode() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="grid h-full grid-cols-7 gap-2">
        {days.map((day, dayIndex) => {
          const isToday = isSameDay(day, today);
          const dayEvents = mockEvents.filter((e) => e.dayOfWeek === dayIndex);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'flex min-h-0 flex-col gap-2 rounded-2xl border border-transparent p-2 transition',
                isToday && 'border-primary/20 bg-primary/[0.04]',
              )}
            >
              <div className="flex items-baseline justify-between px-1.5 pb-1 pt-1">
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
                      'mt-1 font-display text-2xl font-bold',
                      isToday ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                {isToday && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-primary-foreground">
                    Hoje
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2 overflow-hidden">
                {dayEvents.map((event) => (
                  <EventCard key={event.id} event={event} people={mockPeople} />
                ))}
                {dayEvents.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/30">
                    <span className="text-[11px] text-muted-foreground/60">Livre</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
