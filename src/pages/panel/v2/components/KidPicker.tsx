import { cn } from '@/lib/utils';

import { withAlpha } from '../lib/colors';
import type { MockPerson } from '../mock';

interface KidPickerProps {
  kids: MockPerson[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function KidPicker({ kids, selectedId, onSelect }: KidPickerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {kids.map((kid) => {
        const active = kid.id === selectedId;
        const style = active
          ? {
              backgroundColor: withAlpha(kid.color, 0.15),
              borderColor: kid.color,
              color: kid.color,
            }
          : undefined;

        return (
          <button
            key={kid.id}
            type="button"
            onClick={() => onSelect(kid.id)}
            className={cn(
              'flex items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-left transition-all',
              active
                ? 'shadow-sm'
                : 'border-transparent bg-muted/40 text-muted-foreground hover:bg-muted',
            )}
            style={style}
          >
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white shadow-sm transition-transform',
                active && 'scale-105',
              )}
              style={{ backgroundColor: kid.color }}
            >
              {kid.initial}
            </div>
            <span className="text-sm font-semibold">{kid.name}</span>
          </button>
        );
      })}
    </div>
  );
}
