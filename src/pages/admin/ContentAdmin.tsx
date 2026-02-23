import { useState } from 'react';
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
import { supabase } from '@/lib/supabase';
import type { HomeschoolNote, Person, WeeklyFocus } from '@/lib/types';
import type { AdminSectionProps } from './shared';
import { requireAuth, EmptyState } from './shared';

export function ContentAdmin({
  people,
  focus,
  notes,
  loading,
  refresh,
  disabled,
  hasSession,
}: AdminSectionProps & { people: Person[]; focus: WeeklyFocus[]; notes: HomeschoolNote[] }) {
  const [focusForm, setFocusForm] = useState({
    text: focus.find((f) => f.isActive)?.text ?? '',
    reference: focus.find((f) => f.isActive)?.reference ?? '',
  });
  const kids = people.filter((p) => p.type === 'kid');
  const [noteKid, setNoteKid] = useState(kids[0]?.id ?? '');
  const [noteContent, setNoteContent] = useState('');

  const selectedNote = notes.find((n) => n.kidPersonId === noteKid);

  const saveFocus = async () => {
    if (!requireAuth(hasSession)) return;
    if (!focusForm.text) return toast.error('Texto é obrigatório');
    await supabase!.from('weekly_focus').update({ is_active: false });
    const { error } = await supabase!.from('weekly_focus').insert({
      text: focusForm.text,
      reference: focusForm.reference,
      is_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success('Foco atualizado');
    refresh();
  };

  const saveNotes = async () => {
    if (!requireAuth(hasSession)) return;
    if (!noteKid) return;
    const list = noteContent
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const existing = notes.find((n) => n.kidPersonId === noteKid);
    const payload = { kid_person_id: noteKid, notes: list, is_private: existing?.isPrivate ?? false };
    let error;
    if (existing) {
      ({ error } = await supabase!.from('homeschool_notes').update(payload).eq('id', existing.id));
    } else {
      ({ error } = await supabase!.from('homeschool_notes').insert(payload));
    }
    if (error) return toast.error(error.message);
    toast.success('Notas salvas');
    setNoteContent('');
    refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conteúdo da semana</CardTitle>
        <CardDescription>Versículo da semana e tópicos de homeschool.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold">Foco da semana</p>
          <Input
            placeholder="Texto"
            value={focusForm.text}
            onChange={(e) => setFocusForm({ ...focusForm, text: e.target.value })}
            disabled={disabled}
          />
          <Input
            placeholder="Referência"
            value={focusForm.reference}
            onChange={(e) => setFocusForm({ ...focusForm, reference: e.target.value })}
            disabled={disabled}
          />
          <Button onClick={saveFocus} disabled={disabled || loading}>
            Salvar foco ativo
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-semibold">Homeschool</p>
          <select
            className="h-11 rounded-lg border bg-background text-foreground px-3 text-sm"
            value={noteKid}
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

          <textarea
            className="min-h-[140px] w-full rounded-lg border bg-background text-foreground px-3 py-2 text-sm"
            placeholder="Uma linha por tópico"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            disabled={disabled}
          />
          <Button onClick={saveNotes} disabled={disabled || loading}>
            Salvar notas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
