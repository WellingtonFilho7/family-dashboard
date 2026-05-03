import { cn } from '@/lib/utils';
import type { MockPerson } from '../mock';

type Size = 'xs' | 'sm' | 'md' | 'lg';

const sizeClasses: Record<Size, string> = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function PersonChip({
  person,
  size = 'sm',
  ring = false,
}: {
  person: MockPerson;
  size?: Size;
  ring?: boolean;
}) {
  return (
    <div
      className={cn(
        'inline-flex select-none items-center justify-center rounded-full font-semibold leading-none text-white shadow-sm',
        ring && 'ring-2 ring-background',
        sizeClasses[size],
      )}
      style={{ backgroundColor: person.color }}
      title={person.name}
    >
      {person.initial}
    </div>
  );
}
