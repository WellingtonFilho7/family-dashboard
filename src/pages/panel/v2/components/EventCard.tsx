import { cn } from '@/lib/utils';
import { withAlpha } from '../lib/colors';
import type { MockEvent, MockPerson } from '../mock';
import { PersonChip } from './PersonChip';

interface EventCardProps {
  event: MockEvent;
  people: MockPerson[];
  size?: 'sm' | 'md';
}

export function EventCard({ event, people, size = 'sm' }: EventCardProps) {
  const persons = event.personIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is MockPerson => Boolean(p));

  const isFamily = persons.length >= 3;
  const primaryColor = isFamily ? null : persons[0]?.color;

  const style = primaryColor
    ? {
        backgroundColor: withAlpha(primaryColor, 0.13),
        borderColor: withAlpha(primaryColor, 0.28),
      }
    : undefined;

  const isLarge = size === 'md';

  return (
    <div
      className={cn(
        'group flex flex-col rounded-2xl border text-left transition-transform active:scale-[0.98]',
        isLarge ? 'gap-2 p-4' : 'gap-1.5 p-3',
        !primaryColor && 'border-border/50 bg-muted/40',
      )}
      style={style}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            'font-semibold leading-tight text-foreground',
            isLarge ? 'text-base' : 'text-[13px]',
          )}
        >
          {event.title}
        </p>
      </div>
      {event.time && (
        <p
          className={cn(
            'text-muted-foreground/90',
            isLarge ? 'text-sm' : 'text-[11px]',
          )}
        >
          {event.time}
        </p>
      )}
      {persons.length > 0 && (
        <div className="mt-1 flex -space-x-1.5">
          {persons.slice(0, 4).map((person) => (
            <PersonChip key={person.id} person={person} size="xs" ring />
          ))}
          {persons.length > 4 && (
            <span className="ml-1 text-[10px] font-medium text-muted-foreground">
              +{persons.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
