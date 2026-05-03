import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { withAlpha } from './lib/colors';
import { mockNotes, mockPeople, mockTasks, mockWeeklyFocus } from './mock';
import { KidPicker } from './components/KidPicker';
import { ProgressPill } from './components/ProgressPill';
import { SectionTitle } from './components/SectionTitle';
import { TaskList } from './components/TaskList';

export default function LearningMode() {
  const kids = mockPeople.filter((p) => p.type === 'kid');
  const [selectedKidId, setSelectedKidId] = useState(kids[0]?.id ?? '');

  const selected = kids.find((k) => k.id === selectedKidId);
  const focusText = mockWeeklyFocus[selectedKidId];
  const tasks = mockTasks.filter((t) => t.personId === selectedKidId);
  const notes = mockNotes.filter((n) => n.kidId === selectedKidId);

  if (!selected) return null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <KidPicker kids={kids} selectedId={selectedKidId} onSelect={setSelectedKidId} />
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-sm transition-colors hover:bg-foreground/90 active:bg-foreground/80"
        >
          <Plus className="h-4 w-4" />
          Nova nota
        </button>
      </div>

      {focusText && (
        <section>
          <SectionTitle>Foco desta semana</SectionTitle>
          <div
            className="rounded-3xl border-2 p-6"
            style={{
              backgroundColor: withAlpha(selected.color, 0.08),
              borderColor: withAlpha(selected.color, 0.3),
            }}
          >
            <p className="font-display text-xl font-medium leading-snug text-foreground">
              “{focusText}”
            </p>
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle className="mb-0">Tarefas de {selected.name}</SectionTitle>
          <ProgressPill done={tasks.filter((t) => t.done).length} total={tasks.length} />
        </div>
        <TaskList tasks={tasks} people={mockPeople} showPerson={false} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle className="mb-0">Diário</SectionTitle>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            últimos 30 dias
          </span>
        </div>
        {notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Sem notas ainda. Toque em <strong className="text-foreground">Nova nota</strong> para começar.
            </p>
          </div>
        ) : (
          <ol className="flex flex-col divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/40 bg-card">
            {notes.map((note) => (
              <li key={note.id} className="px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {format(parseISO(note.date), "d 'de' MMMM", { locale: ptBR })}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {note.items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
                      <span className="select-none text-muted-foreground/60">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
