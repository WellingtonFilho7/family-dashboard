import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { MockPerson, MockTask } from '../mock';
import { PersonChip } from './PersonChip';

interface TaskListProps {
  tasks: MockTask[];
  people: MockPerson[];
  showPerson?: boolean;
  onToggle?: (taskId: string) => void;
}

export function TaskList({ tasks, people, showPerson = true, onToggle }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
        Nada por aqui ainda.
      </p>
    );
  }

  const sorted = [...tasks].sort((a, b) => Number(a.done) - Number(b.done));

  return (
    <ul className="flex flex-col divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/40 bg-card">
      {sorted.map((task) => {
        const person = people.find((p) => p.id === task.personId);
        return (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => onToggle?.(task.id)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                'hover:bg-muted/40 active:bg-muted/60',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  task.done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/40 bg-transparent',
                )}
              >
                {task.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              {showPerson && person && <PersonChip person={person} size="xs" />}
              <span
                className={cn(
                  'flex-1 text-sm transition-colors',
                  task.done ? 'text-muted-foreground line-through decoration-muted-foreground/40' : 'text-foreground',
                )}
              >
                {task.title}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
