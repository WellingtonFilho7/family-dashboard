import { MoreVertical, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Separator,
} from '@/components';
import { supabase } from '@/lib/supabase';
import type { OneOffItem, Person, RecurringItem } from '@/lib/types';
import type { AdminSectionProps } from './shared';
import { requireAuth, EmptyState, EditableText, DeleteConfirmButton } from './shared';

const dayNames: Record<number, string> = {
  1: 'Domingo', 2: 'Segunda', 3: 'Terça', 4: 'Quarta', 5: 'Quinta', 6: 'Sexta', 7: 'Sábado',
};

type AgendaEditForm = {
  table: 'recurring_items' | 'one_off_items';
  id: string;
  title: string;
  dayOfWeek: number;
  date: string;
  startTime: string;
  endTime: string;
  personIds: string[];
};

export function AgendaAdmin({
  people,
  recurring,
  oneOff,
  loading,
  refresh,
  disabled,
  hasSession,
}: AdminSectionProps & { people: Person[]; recurring: RecurringItem[]; oneOff: OneOffItem[] }) {
  const [showRecForm, setShowRecForm] = useState(false);
  const [showOneOffForm, setShowOneOffForm] = useState(false);
  const [editForm, setEditForm] = useState<AgendaEditForm | null>(null);
  const [recForm, setRecForm] = useState({
    title: '',
    dayOfWeek: 2,
    startTime: '',
    endTime: '',
    personIds: [] as string[],
  });
  const [oneOffForm, setOneOffForm] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    personIds: [] as string[],
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

  const togglePerson = (ids: string[], id: string) =>
    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  const personIdsFromItem = (item: { personId: string; personIds?: string[] }) =>
    item.personIds?.length ? item.personIds : item.personId ? [item.personId] : [];

  const normalizeTimeText = (rawValue: string): string | null => {
    const value = rawValue.trim().toLowerCase();
    if (!value) return null;

    const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!match) return null;

    const hour = Number.parseInt(match[1], 10);
    const minute = Number.parseInt(match[2], 10);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const buildTimeLabel = (startTime: string | null, endTime: string | null): string | null => {
    if (startTime && endTime) return `${startTime}–${endTime}`;
    return startTime ?? null;
  };

  const isEndAfterStart = (startTime: string, endTime: string) => endTime > startTime;

  const openRecurringEditor = (item: RecurringItem) => {
    setEditForm({
      table: 'recurring_items',
      id: item.id,
      title: item.title,
      dayOfWeek: item.dayOfWeek,
      date: '',
      startTime: item.startTime ?? '',
      endTime: item.endTime ?? '',
      personIds: personIdsFromItem(item),
    });
  };

  const openOneOffEditor = (item: OneOffItem) => {
    setEditForm({
      table: 'one_off_items',
      id: item.id,
      title: item.title,
      dayOfWeek: 1,
      date: item.date,
      startTime: item.startTime ?? '',
      endTime: item.endTime ?? '',
      personIds: personIdsFromItem(item),
    });
  };

  const saveEditedItem = async () => {
    if (!editForm) return;
    if (!requireAuth(hasSession)) return;
    if (!editForm.title.trim() || editForm.personIds.length === 0) {
      return toast.error('Título e pelo menos uma pessoa são obrigatórios');
    }
    if (editForm.table === 'one_off_items' && !editForm.date) {
      return toast.error('Data é obrigatória para evento pontual');
    }

    const normalizedStartTime = normalizeTimeText(editForm.startTime);
    const normalizedEndTime = normalizeTimeText(editForm.endTime);
    if (editForm.startTime.trim() && !normalizedStartTime) {
      return toast.error('Hora inicial inválida. Use o formato HH:mm.');
    }
    if (editForm.endTime.trim() && !normalizedEndTime) {
      return toast.error('Hora final inválida. Use o formato HH:mm.');
    }
    if (normalizedEndTime && !normalizedStartTime) {
      return toast.error('Informe a hora inicial para usar hora final.');
    }
    if (normalizedStartTime && normalizedEndTime && !isEndAfterStart(normalizedStartTime, normalizedEndTime)) {
      return toast.error('A hora final deve ser depois da hora inicial.');
    }

    const payload = {
      title: editForm.title.trim(),
      time_text: buildTimeLabel(normalizedStartTime, normalizedEndTime),
      start_time: normalizedStartTime,
      end_time: normalizedEndTime,
      person_id: editForm.personIds[0],
      person_ids: editForm.personIds,
      ...(editForm.table === 'recurring_items'
        ? { day_of_week: editForm.dayOfWeek }
        : { date: editForm.date }),
    };

    const { error } = await supabase!
      .from(editForm.table)
      .update(payload)
      .eq('id', editForm.id);
    if (error) return toast.error(error.message);

    toast.success('Evento atualizado');
    setEditForm(null);
    refresh();
  };

  const createRecurring = async () => {
    if (!requireAuth(hasSession)) return;
    if (!recForm.title || recForm.personIds.length === 0) return toast.error('Título e pelo menos uma pessoa são obrigatórios');
    const normalizedStartTime = normalizeTimeText(recForm.startTime);
    const normalizedEndTime = normalizeTimeText(recForm.endTime);

    if (recForm.startTime.trim() && !normalizedStartTime) {
      return toast.error('Hora inicial inválida. Use o formato HH:mm.');
    }
    if (recForm.endTime.trim() && !normalizedEndTime) {
      return toast.error('Hora final inválida. Use o formato HH:mm.');
    }
    if (normalizedEndTime && !normalizedStartTime) {
      return toast.error('Informe a hora inicial para usar hora final.');
    }
    if (normalizedStartTime && normalizedEndTime && !isEndAfterStart(normalizedStartTime, normalizedEndTime)) {
      return toast.error('A hora final deve ser depois da hora inicial.');
    }

    const timeLabel = buildTimeLabel(normalizedStartTime, normalizedEndTime);
    try {
      const payload = {
        title: recForm.title,
        day_of_week: recForm.dayOfWeek,
        time_text: timeLabel,
        start_time: normalizedStartTime,
        end_time: normalizedEndTime,
        person_id: recForm.personIds[0],
        person_ids: recForm.personIds,
        is_private: false,
      };
      const { error } = await supabase!.from('recurring_items').insert(payload);
      if (error) return toast.error(error.message);
      toast.success('Evento recorrente criado');
      setRecForm((prev) => ({ ...prev, title: '', startTime: '', endTime: '', personIds: [] }));
      setShowRecForm(false);
      refresh();
    } catch {
      toast.error('Erro de rede ao criar evento');
    }
  };

  const createOneOff = async () => {
    if (!requireAuth(hasSession)) return;
    if (!oneOffForm.title || oneOffForm.personIds.length === 0 || !oneOffForm.date) {
      return toast.error('Título, pelo menos uma pessoa e data são obrigatórios');
    }
    const normalizedStartTime = normalizeTimeText(oneOffForm.startTime);
    const normalizedEndTime = normalizeTimeText(oneOffForm.endTime);

    if (oneOffForm.startTime.trim() && !normalizedStartTime) {
      return toast.error('Hora inicial inválida. Use o formato HH:mm.');
    }
    if (oneOffForm.endTime.trim() && !normalizedEndTime) {
      return toast.error('Hora final inválida. Use o formato HH:mm.');
    }
    if (normalizedEndTime && !normalizedStartTime) {
      return toast.error('Informe a hora inicial para usar hora final.');
    }
    if (normalizedStartTime && normalizedEndTime && !isEndAfterStart(normalizedStartTime, normalizedEndTime)) {
      return toast.error('A hora final deve ser depois da hora inicial.');
    }

    const timeLabel = buildTimeLabel(normalizedStartTime, normalizedEndTime);
    try {
      const payload = {
        title: oneOffForm.title,
        date: oneOffForm.date,
        time_text: timeLabel,
        start_time: normalizedStartTime,
        end_time: normalizedEndTime,
        person_id: oneOffForm.personIds[0],
        person_ids: oneOffForm.personIds,
        is_private: false,
      };
      const { error } = await supabase!.from('one_off_items').insert(payload);
      if (error) return toast.error(error.message);
      toast.success('Evento pontual criado');
      setOneOffForm((prev) => ({ ...prev, title: '', startTime: '', endTime: '', personIds: [] }));
      setShowOneOffForm(false);
      refresh();
    } catch {
      toast.error('Erro de rede ao criar evento');
    }
  };

  const updateTitle = async (table: 'recurring_items' | 'one_off_items', id: string, newTitle: string) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from(table).update({ title: newTitle }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Atualizado'); refresh(); }
  };

  const togglePrivacy = async (table: 'recurring_items' | 'one_off_items', id: string, currentValue: boolean) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from(table).update({ is_private: !currentValue }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Atualizado'); refresh(); }
  };

  const deleteItem = async (table: 'recurring_items' | 'one_off_items', id: string) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from(table).delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Removido'); refresh(); }
  };

  const personLabel = (ids: string[]) => {
    const names = ids.map((id) => people.find((p) => p.id === id)?.name ?? 'Pessoa');
    return names.join(' + ');
  };

  const eventTimeLabel = (item: { startTime?: string | null; endTime?: string | null; timeText?: string | null }) =>
    buildTimeLabel(item.startTime ?? null, item.endTime ?? null) ?? item.timeText ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agenda</CardTitle>
        <CardDescription>Eventos recorrentes e pontuais da família.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 overflow-hidden">
        {/* Recorrentes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Recorrentes</p>
            <Button size="sm" variant={showRecForm ? 'outline' : 'default'} onClick={() => setShowRecForm(!showRecForm)}>
              {showRecForm ? <X className="mr-1.5 h-3.5 w-3.5" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
              {showRecForm ? 'Fechar' : 'Adicionar'}
            </Button>
          </div>

          {showRecForm && (
            <div className="space-y-3 overflow-hidden rounded-lg border bg-muted/30 p-3 sm:p-4">
              <Input placeholder="Título" value={recForm.title} onChange={(e) => setRecForm({ ...recForm, title: e.target.value })} disabled={disabled} />
              <select
                className="h-11 w-full min-w-0 rounded-lg border bg-background px-3 text-base text-foreground"
                value={recForm.dayOfWeek}
                onChange={(e) => setRecForm({ ...recForm, dayOfWeek: Number(e.target.value) })}
                disabled={disabled}
              >
                {dayOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2 min-w-0 overflow-hidden">
                <Input
                  type="time"
                  step={60}
                  min="00:00"
                  max="23:59"
                  placeholder="Início"
                  value={recForm.startTime}
                  onChange={(e) => setRecForm({ ...recForm, startTime: e.target.value })}
                  disabled={disabled}
                />
                <Input
                  type="time"
                  step={60}
                  min="00:00"
                  max="23:59"
                  placeholder="Fim"
                  value={recForm.endTime}
                  onChange={(e) => setRecForm({ ...recForm, endTime: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Pessoas</p>
                <div className="flex flex-wrap gap-2">
                  {people.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setRecForm({ ...recForm, personIds: togglePerson(recForm.personIds, p.id) })}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${recForm.personIds.includes(p.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'}`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={createRecurring} disabled={disabled || loading} className="w-full">Criar recorrente</Button>
            </div>
          )}

          {recurring.length === 0 ? (
            <EmptyState message="Nenhum evento recorrente." />
          ) : (
            <div className="space-y-2">
              {recurring.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                  <div className="min-w-0">
                    <EditableText value={item.title} onSave={(t) => updateTitle('recurring_items', item.id, t)} disabled={disabled} />
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {personIdsFromItem(item).map((pid) => {
                          const person = people.find((p) => p.id === pid);
                          return (
                            <span
                              key={`${item.id}-${pid}`}
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: person?.color ?? '#0EA5E9' }}
                            />
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dayNames[item.dayOfWeek] ?? `Dia ${item.dayOfWeek}`}
                        {eventTimeLabel(item) ? ` • ${eventTimeLabel(item)}` : ''} • {personLabel(personIdsFromItem(item))}
                        {item.isPrivate ? ' • privado' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Mais ações"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openRecurringEditor(item)}>
                          Editar evento
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePrivacy('recurring_items', item.id, item.isPrivate ?? false)}>
                          {item.isPrivate ? 'Tornar público' : 'Tornar privado'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DeleteConfirmButton itemName={item.title} onConfirm={() => deleteItem('recurring_items', item.id)} disabled={disabled} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Pontuais */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Pontuais</p>
            <Button size="sm" variant={showOneOffForm ? 'outline' : 'default'} onClick={() => setShowOneOffForm(!showOneOffForm)}>
              {showOneOffForm ? <X className="mr-1.5 h-3.5 w-3.5" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
              {showOneOffForm ? 'Fechar' : 'Adicionar'}
            </Button>
          </div>

          {showOneOffForm && (
            <div className="space-y-3 overflow-hidden rounded-lg border bg-muted/30 p-3 sm:p-4">
              <Input placeholder="Título" value={oneOffForm.title} onChange={(e) => setOneOffForm({ ...oneOffForm, title: e.target.value })} disabled={disabled} />
              <Input
                type="date"
                value={oneOffForm.date}
                onChange={(e) => setOneOffForm({ ...oneOffForm, date: e.target.value })}
                disabled={disabled}
              />
              <div className="grid grid-cols-2 gap-2 min-w-0 overflow-hidden">
                <Input
                  type="time"
                  step={60}
                  min="00:00"
                  max="23:59"
                  placeholder="Início"
                  value={oneOffForm.startTime}
                  onChange={(e) => setOneOffForm({ ...oneOffForm, startTime: e.target.value })}
                  disabled={disabled}
                />
                <Input
                  type="time"
                  step={60}
                  min="00:00"
                  max="23:59"
                  placeholder="Fim"
                  value={oneOffForm.endTime}
                  onChange={(e) => setOneOffForm({ ...oneOffForm, endTime: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Pessoas</p>
                <div className="flex flex-wrap gap-2">
                  {people.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setOneOffForm({ ...oneOffForm, personIds: togglePerson(oneOffForm.personIds, p.id) })}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${oneOffForm.personIds.includes(p.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'}`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={createOneOff} disabled={disabled || loading} className="w-full">Criar pontual</Button>
            </div>
          )}

          {oneOff.length === 0 ? (
            <EmptyState message="Nenhum evento pontual." />
          ) : (
            <div className="space-y-2">
              {oneOff.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                  <div className="min-w-0">
                    <EditableText value={item.title} onSave={(t) => updateTitle('one_off_items', item.id, t)} disabled={disabled} />
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {personIdsFromItem(item).map((pid) => {
                          const person = people.find((p) => p.id === pid);
                          return (
                            <span
                              key={`${item.id}-${pid}`}
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: person?.color ?? '#0EA5E9' }}
                            />
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.date}{eventTimeLabel(item) ? ` • ${eventTimeLabel(item)}` : ''} • {personLabel(personIdsFromItem(item))}
                        {item.isPrivate ? ' • privado' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Mais ações"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openOneOffEditor(item)}>
                          Editar evento
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePrivacy('one_off_items', item.id, item.isPrivate ?? false)}>
                          {item.isPrivate ? 'Tornar público' : 'Tornar privado'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DeleteConfirmButton itemName={item.title} onConfirm={() => deleteItem('one_off_items', item.id)} disabled={disabled} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Dialog open={Boolean(editForm)} onOpenChange={(open) => !open && setEditForm(null)}>
          <DialogContent className="w-[min(96vw,600px)] max-h-[90dvh] overflow-x-hidden overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar evento</DialogTitle>
              <DialogDescription>
                Atualize título, horário e participantes do evento.
              </DialogDescription>
            </DialogHeader>

            {editForm ? (
              <div className="min-w-0 space-y-3">
                <Input
                  placeholder="Título"
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                  disabled={disabled}
                />

                {editForm.table === 'recurring_items' ? (
                  <select
                    className="h-11 w-full rounded-lg border bg-background text-foreground px-3 text-base"
                    value={editForm.dayOfWeek}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, dayOfWeek: Number(e.target.value) } : prev
                      )
                    }
                    disabled={disabled}
                  >
                    {dayOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm((prev) => (prev ? { ...prev, date: e.target.value } : prev))}
                    disabled={disabled}
                  />
                )}

                <div className="grid grid-cols-2 gap-2 min-w-0 overflow-hidden">
                  <Input
                    type="time"
                    step={60}
                    min="00:00"
                    max="23:59"
                    value={editForm.startTime}
                    onChange={(e) =>
                      setEditForm((prev) => (prev ? { ...prev, startTime: e.target.value } : prev))
                    }
                    disabled={disabled}
                  />
                  <Input
                    type="time"
                    step={60}
                    min="00:00"
                    max="23:59"
                    value={editForm.endTime}
                    onChange={(e) =>
                      setEditForm((prev) => (prev ? { ...prev, endTime: e.target.value } : prev))
                    }
                    disabled={disabled}
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Pessoas</p>
                  <div className="flex flex-wrap gap-2">
                    {people.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          setEditForm((prev) =>
                            prev ? { ...prev, personIds: togglePerson(prev.personIds, p.id) } : prev
                          )
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${editForm.personIds.includes(p.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'}`}
                      >
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditForm(null)} disabled={disabled}>
                Cancelar
              </Button>
              <Button onClick={saveEditedItem} disabled={disabled || loading}>
                Salvar alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
