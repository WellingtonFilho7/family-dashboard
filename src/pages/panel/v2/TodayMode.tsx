import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

import { withAlpha } from './lib/colors';
import { mockEvents, mockNotes, mockPeople, mockTasks } from './mock';
import { EventCard } from './components/EventCard';
import { PersonChip } from './components/PersonChip';
import { ProgressPill } from './components/ProgressPill';
import { SectionTitle } from './components/SectionTitle';
import { TaskList } from './components/TaskList';

export default function TodayMode() {
  const today = new Date();
  const dayIndex = today.getDay();
  const todayEvents = mockEvents
    .filter((e) => e.dayOfWeek === dayIndex)
    .sort((a, b) => (a.startMinutes ?? 0) - (b.startMinutes ?? 0));

  const next = todayEvents[0];
  const rest = todayEvents.slice(1);

  const total = mockTasks.length;
  const done = mockTasks.filter((t) => t.done).length;

  const lastNote = mockNotes[0];
  const lastNoteKid = mockPeople.find((p) => p.id === lastNote?.kidId);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 pb-12">
      {next && (
        <section>
          <SectionTitle>Próximo</SectionTitle>
          <NextEventCard
            event={next}
            people={mockPeople}
          />
        </section>
      )}

      {rest.length > 0 && (
        <section>
          <SectionTitle>Resto do dia</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((event) => (
              <EventCard key={event.id} event={event} people={mockPeople} size="md" />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle className="mb-0">Tarefas do dia</SectionTitle>
          <ProgressPill done={done} total={total} />
        </div>
        <TaskList tasks={mockTasks} people={mockPeople} />
      </section>

      {lastNote && lastNoteKid && (
        <Link
          to="/painel/v2/aprendizado"
          className="-mx-2 rounded-2xl px-2 py-2 transition-colors hover:bg-muted/40 active:bg-muted/60"
        >
          <div className="flex items-start gap-3">
            <PersonChip person={lastNoteKid} size="sm" />
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Última nota de {lastNoteKid.name}
              </p>
              <p className="mt-1 text-sm italic text-foreground/80">
                “{lastNote.items[0]}”
              </p>
            </div>
            <span className="self-center text-xs font-medium text-primary">Ver diário →</span>
          </div>
        </Link>
      )}
    </div>
  );
}

function NextEventCard({
  event,
  people,
}: {
  event: (typeof mockEvents)[number];
  people: typeof mockPeople;
}) {
  const persons = event.personIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is (typeof mockPeople)[number] => Boolean(p));

  const isFamily = persons.length >= 3;
  const primaryColor = isFamily ? null : persons[0]?.color;

  const style = primaryColor
    ? {
        backgroundColor: withAlpha(primaryColor, 0.13),
        borderColor: withAlpha(primaryColor, 0.3),
      }
    : undefined;

  return (
    <div
      className="rounded-3xl border bg-card p-6 shadow-sm"
      style={style}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
          <Clock className="h-3 w-3" />
          em 38 min
        </span>
        <div className="flex -space-x-1.5">
          {persons.slice(0, 4).map((person) => (
            <PersonChip key={person.id} person={person} size="sm" ring />
          ))}
        </div>
      </div>
      <h3 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">
        {event.title}
      </h3>
      {event.time && (
        <p className="mt-1 text-base text-muted-foreground">{event.time}</p>
      )}
    </div>
  );
}
