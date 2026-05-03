import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw, Sun } from 'lucide-react';

import { cn } from '@/lib/utils';

import { mockWeather, type MockPerson } from '../mock';
import { PersonChip } from './PersonChip';

interface PanelHeaderProps {
  now: Date;
  people: MockPerson[];
  onRefresh?: () => void;
}

export function PanelHeader({ now, people, onRefresh }: PanelHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between gap-6 border-b border-border/40 bg-background/80 px-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <span className="font-display text-lg font-bold leading-none">F</span>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">
            {format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium tabular-nums">{format(now, 'HH:mm')}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Sun className="h-3 w-3" />
              {mockWeather.temperatureC}°
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex -space-x-1.5">
          {people.map((person) => (
            <PersonChip key={person.id} person={person} size="md" ring />
          ))}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors',
            'hover:bg-muted hover:text-foreground active:bg-muted/80',
          )}
          aria-label="Atualizar"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
