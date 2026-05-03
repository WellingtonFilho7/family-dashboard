import { cn } from '@/lib/utils';

import { withAlpha } from '../lib/colors';
import type { TimedEntry } from '../lib/timeline';
import type { MockPerson } from '../mock';
import { PersonChip } from './PersonChip';

interface TimelineEventCardProps {
  entry: TimedEntry;
  people: MockPerson[];
}

const GAP_PERCENT = 1;

export function TimelineEventCard({ entry, people }: TimelineEventCardProps) {
  const { event, lane, laneCount, topPercent, heightPercent } = entry;

  const persons = event.personIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is MockPerson => Boolean(p));

  const isFamily = persons.length >= 3;
  const primaryColor = isFamily ? null : persons[0]?.color;

  const widthPercent = (100 - GAP_PERCENT * (laneCount - 1)) / laneCount;
  const leftPercent = lane * (widthPercent + GAP_PERCENT);

  const colorStyle = primaryColor
    ? {
        backgroundColor: withAlpha(primaryColor, 0.16),
        borderLeftColor: primaryColor,
      }
    : {
        backgroundColor: 'hsl(var(--muted))',
        borderLeftColor: 'hsl(var(--muted-foreground))',
      };

  const isShort = heightPercent < 4;

  return (
    <div
      className={cn(
        'absolute overflow-hidden rounded-lg border border-border/30 border-l-[3px] px-2 py-1',
        'text-left transition-transform active:scale-[0.98]',
        entry.clippedBefore && 'rounded-t-none border-t-0',
        entry.clippedAfter && 'rounded-b-none border-b-0',
      )}
      style={{
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        ...colorStyle,
      }}
      title={`${event.title}${event.time ? ` · ${event.time}` : ''}`}
    >
      <p
        className={cn(
          'truncate font-semibold leading-tight text-foreground',
          isShort ? 'text-[10px]' : 'text-[11px]',
        )}
      >
        {event.title}
      </p>
      {!isShort && event.time && (
        <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground/90">
          {event.time}
        </p>
      )}
      {!isShort && heightPercent > 8 && persons.length > 0 && (
        <div className="mt-1 flex -space-x-1">
          {persons.slice(0, 3).map((person) => (
            <PersonChip key={person.id} person={person} size="xs" ring />
          ))}
          {persons.length > 3 && (
            <span className="ml-1 text-[9px] font-medium text-muted-foreground">
              +{persons.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
