import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Separator,
} from '@/components';
import { setWeeklyFocus, upsertHomeschoolNote } from '@/lib/api/content';
import type { HomeschoolNote, Person, WeeklyFocus } from '@/lib/types';
import type { AdminSectionProps } from './shared';
import { requireAuth } from './auth';
import { EmptyState } from './shared';

function FocusEditor({
  initialText,
  initialReference,
  disabled,
  loading,
  onSave,
}: {
  initialText: string;
  initialReference: string;
  disabled: boolean;
  loading: boolean;
  onSave: (payload: { text: string; reference: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    text: initialText,
    reference: initialReference,
  });

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Foco da semana</p>
      <Input
        placeholder="Texto do versículo ou foco"
        value={form.text}
        onChange={(e) => setForm({ ...form, text: e.target.value })}
        disabled={disabled}
      />
      <Input
        placeholder="Referência (ex: João 3:16)"
        value={form.reference}
        onChange={(e) => setForm({ ...form, reference: e.target.value })}
        disabled={disabled}
      />
      <Button
        onClick={() => onSave({ text: form.text, reference: form.reference })}
        disabled={disabled || loading}
        className="w-full"
      >
        Salvar foco
      </Button>
    </div>
  );
}

function HomeschoolEditor({
  initialContent,
  disabled,
  loading,
  onSave,
}: {
  initialContent: string;
  disabled: boolean;
  loading: boolean;
  onSave: (content: string) => Promise<void>;
}) {
  const [content, setContent] = useState(initialContent);

  return (
    <>
      <textarea
        className="min-h-[100px] w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground"
        placeholder="Uma linha por tópico"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={disabled}
      />
      <Button onClick={() => onSave(content)} disabled={disabled || loading} className="w-full">
        Salvar notas
      </Button>
    </>
  );
}

export function ContentAdmin({
  people,
  focus,
  notes,
  loading,
  refresh,
  disabled,
  hasSession,
}: AdminSectionProps & { people: Person[]; focus: WeeklyFocus[]; notes: HomeschoolNote[] }) {
  const activeFocus = useMemo(() => focus.find((item) => item.isActive) ?? null, [focus]);
  const kids = people.filter((p) => p.type === 'kid');
  const [noteKid, setNoteKid] = useState(kids[0]?.id ?? '');
  const selectedKidId = noteKid || kids[0]?.id || '';
  const selectedNote = notes.find((n) => n.kidPersonId === selectedKidId);

  const saveFocus = async ({ text, reference }: { text: string; reference: string }): Promise<void> => {
    if (!requireAuth(hasSession)) return;
    if (!text) {
      toast.error('Texto é obrigatório');
      return;
    }
    const { error } = await setWeeklyFocus(activeFocus?.id ?? null, text, reference);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Foco atualizado');
    await refresh();
  };

  const saveNotes = async (content: string): Promise<void> => {
    if (!requireAuth(hasSession)) return;
    if (!selectedKidId) return;
    const list = content
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const existing = notes.find((n) => n.kidPersonId === selectedKidId);
    const { error } = await upsertHomeschoolNote(
      existing?.id ?? null,
      selectedKidId,
      list,
      existing?.isPrivate ?? false,
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Notas salvas');
    await refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conteúdo da semana</CardTitle>
        <CardDescription>Versículo da semana e tópicos de homeschool.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FocusEditor
          key={activeFocus?.id ?? 'new-focus'}
          initialText={activeFocus?.text ?? ''}
          initialReference={activeFocus?.reference ?? ''}
          disabled={disabled}
          loading={loading}
          onSave={saveFocus}
        />

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-semibold">Homeschool</p>
          <select
            className="h-11 w-full rounded-lg border bg-background text-foreground px-3 text-base"
            value={selectedKidId}
            onChange={(e) => setNoteKid(e.target.value)}
            disabled={disabled}
          >
            {kids.map((kid) => (
              <option key={kid.id} value={kid.id}>
                {kid.name}
              </option>
            ))}
          </select>

          {selectedNote && selectedNote.notes.length > 0 ? (
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Tópicos atuais:</p>
              <ul className="space-y-0.5 text-sm">
                {selectedNote.notes.map((topic, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyState message="Sem notas de homeschool para esta criança." />
          )}

          <HomeschoolEditor
            key={`${selectedKidId}:${selectedNote?.id ?? 'new-note'}`}
            initialContent={selectedNote?.notes.join('\n') ?? ''}
            disabled={disabled}
            loading={loading}
            onSave={saveNotes}
          />
        </div>
      </CardContent>
    </Card>
  );
}
