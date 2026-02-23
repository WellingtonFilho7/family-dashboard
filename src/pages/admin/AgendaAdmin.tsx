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
import type { OneOffItem, Person, RecurringItem } from '@/lib/types';
import type { AdminSectionProps } from './shared';
import { requireAuth, EmptyState, EditableText, DeleteConfirmButton } from './shared';

export function AgendaAdmin({
  people,
  recurring,
  oneOff,
  loading,
  refresh,
  disabled,
  hasSession,
}: AdminSectionProps & { people: Person[]; recurring: RecurringItem[]; oneOff: OneOffItem[] }) {
  const [recForm, setRecForm] = useState({
    title: '',
    dayOfWeek: 1,
    timeText: '',
    personId: '',
    isPrivate: false,
  });
  const [oneOffForm, setOneOffForm] = useState({
    title: '',
    date: '',
    timeText: '',
    personId: '',
    isPrivate: false,
  });

  const dayOptions = [
    { value: 1, label: 'Domingo' },
    { value: 2, label: 'Segunda' },
    { value: 3, label: 'Terça' },
    { value: 4, label: 'Quarta' },
    { value: 5, label: 'Quinta' },
    { value: 6, label: 'Sexta' },
    { value: 7, label: 'Sábado' },
  ];

  const createRecurring = async () => {
    if (!requireAuth(hasSession)) return;
    if (!recForm.title || !recForm.personId) return toast.error('Título e pessoa são obrigatórios');
    try {
      const { error } = await supabase!.from('recurring_items').insert({
        title: recForm.title,
        day_of_week: recForm.dayOfWeek,
        time_text: recForm.timeText || null,
        person_id: recForm.personId,
        is_private: recForm.isPrivate,
      });
      if (error) return toast.error(error.message);
      toast.success('Evento recorrente criado');
      setRecForm((prev) => ({ ...prev, title: '', timeText: '' }));
      refresh();
    } catch (err) {
      toast.error('Erro de rede ao criar evento');
    }
  };

  const createOneOff = async () => {
    if (!requireAuth(hasSession)) return;
    if (!oneOffForm.title || !oneOffForm.personId || !oneOffForm.date) {
      return toast.error('Título, pessoa e data são obrigatórios');
    }
    try {
      const { error } = await supabase!.from('one_off_items').insert({
        title: oneOffForm.title,
        date: oneOffForm.date,
        time_text: oneOffForm.timeText || null,
        person_id: oneOffForm.personId,
        is_private: oneOffForm.isPrivate,
      });
      if (error) return toast.error(error.message);
      toast.success('Evento pontual criado');
      setOneOffForm((prev) => ({ ...prev, title: '', timeText: '' }));
      refresh();
    } catch (err) {
      toast.error('Erro de rede ao criar evento');
    }
  };

  const updateTitle = async (table: 'recurring_items' | 'one_off_items', id: string, newTitle: string) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from(table).update({ title: newTitle }).eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Atualizado');
      refresh();
    }
  };

  const togglePrivacy = async (table: 'recurring_items' | 'one_off_items', id: string, currentValue: boolean) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from(table).update({ is_private: !currentValue }).eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Atualizado');
      refresh();
    }
  };

  const deleteItem = async (table: 'recurring_items' | 'one_off_items', id: string) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from(table).delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Removido');
      refresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agenda</CardTitle>
        <CardDescription>Eventos recorrentes e pontuais da família.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold">Recorrente</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <Input
              placeholder="Título"
              value={recForm.title}
              onChange={(e) => setRecForm({ ...recForm, title: e.target.value })}
              disabled={disabled}
            />
            <select
              className="h-11 rounded-lg border bg-background text-foreground px-3 text-sm"
              value={recForm.dayOfWeek}
              onChange={(e) => setRecForm({ ...recForm, dayOfWeek: Number(e.target.value) })}
              disabled={disabled}
            >
              {dayOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Input
              placeholder="Hora (texto)"
              value={recForm.timeText}
              onChange={(e) => setRecForm({ ...recForm, timeText: e.target.value })}
              disabled={disabled}
            />
            <select
              className="h-11 rounded-lg border bg-background text-foreground px-3 text-sm"
              value={recForm.personId}
              onChange={(e) => setRecForm({ ...recForm, personId: e.target.value })}
              disabled={disabled}
            >
              <option value="">Pessoa</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={recForm.isPrivate}
                onChange={(e) => setRecForm({ ...recForm, isPrivate: e.target.checked })}
                disabled={disabled}
              />
              Privado
            </label>
            <Button onClick={createRecurring} disabled={disabled || loading}>
              Criar recorrente
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-semibold">Pontual</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <Input
              placeholder="Título"
              value={oneOffForm.title}
              onChange={(e) => setOneOffForm({ ...oneOffForm, title: e.target.value })}
              disabled={disabled}
            />
            <Input
              type="date"
              value={oneOffForm.date}
              onChange={(e) => setOneOffForm({ ...oneOffForm, date: e.target.value })}
              disabled={disabled}
            />
            <Input
              placeholder="Hora (texto)"
              value={oneOffForm.timeText}
              onChange={(e) => setOneOffForm({ ...oneOffForm, timeText: e.target.value })}
              disabled={disabled}
            />
            <select
              className="h-11 rounded-lg border bg-background text-foreground px-3 text-sm"
              value={oneOffForm.personId}
              onChange={(e) => setOneOffForm({ ...oneOffForm, personId: e.target.value })}
              disabled={disabled}
            >
              <option value="">Pessoa</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={oneOffForm.isPrivate}
                onChange={(e) => setOneOffForm({ ...oneOffForm, isPrivate: e.target.checked })}
                disabled={disabled}
              />
              Privado
            </label>
            <Button onClick={createOneOff} disabled={disabled || loading}>
              Criar pontual
            </Button>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold">Recorrentes</p>
            {recurring.length === 0 ? (
              <EmptyState message="Nenhum evento recorrente." />
            ) : (
              <div className="space-y-2">
                {recurring.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
                  >
                    <div>
                      <EditableText
                        value={item.title}
                        onSave={(newTitle) => updateTitle('recurring_items', item.id, newTitle)}
                        disabled={disabled}
                      />
                      <p className="text-xs text-muted-foreground">
                        Dia {item.dayOfWeek} • {item.timeText} • {people.find((p) => p.id === item.personId)?.name ?? 'Pessoa'}
                        {item.isPrivate ? ' • privado' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePrivacy('recurring_items', item.id, item.isPrivate ?? false)}
                        disabled={disabled}
                      >
                        {item.isPrivate ? 'Público' : 'Privar'}
                      </Button>
                      <DeleteConfirmButton
                        itemName={item.title}
                        onConfirm={() => deleteItem('recurring_items', item.id)}
                        disabled={disabled}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Pontuais</p>
            {oneOff.length === 0 ? (
              <EmptyState message="Nenhum evento pontual." />
            ) : (
              <div className="space-y-2">
                {oneOff.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
                  >
                    <div>
                      <EditableText
                        value={item.title}
                        onSave={(newTitle) => updateTitle('one_off_items', item.id, newTitle)}
                        disabled={disabled}
                      />
                      <p className="text-xs text-muted-foreground">
                        {item.date} • {item.timeText} • {people.find((p) => p.id === item.personId)?.name ?? 'Pessoa'}
                        {item.isPrivate ? ' • privado' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePrivacy('one_off_items', item.id, item.isPrivate ?? false)}
                        disabled={disabled}
                      >
                        {item.isPrivate ? 'Público' : 'Privar'}
                      </Button>
                      <DeleteConfirmButton
                        itemName={item.title}
                        onConfirm={() => deleteItem('one_off_items', item.id)}
                        disabled={disabled}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
