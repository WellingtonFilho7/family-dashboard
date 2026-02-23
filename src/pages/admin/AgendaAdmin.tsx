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
  const [recForm, setRecForm] = useState({
    title: '',
    dayOfWeek: 2,
    timeText: '',
    personId: '',
  });
  const [oneOffForm, setOneOffForm] = useState({
    title: '',
    date: '',
    timeText: '',
    personId: '',
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
        is_private: false,
      });
      if (error) return toast.error(error.message);
      toast.success('Evento recorrente criado');
      setRecForm((prev) => ({ ...prev, title: '', timeText: '' }));
      setShowRecForm(false);
      refresh();
    } catch {
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
        is_private: false,
      });
      if (error) return toast.error(error.message);
      toast.success('Evento pontual criado');
      setOneOffForm((prev) => ({ ...prev, title: '', timeText: '' }));
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

  const personName = (id: string) => people.find((p) => p.id === id)?.name ?? 'Pessoa';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agenda</CardTitle>
        <CardDescription>Eventos recorrentes e pontuais da família.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
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
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <Input placeholder="Título" value={recForm.title} onChange={(e) => setRecForm({ ...recForm, title: e.target.value })} disabled={disabled} />
              <div className="grid grid-cols-2 gap-3">
                <select className="h-11 w-full rounded-lg border bg-background text-foreground px-3 text-sm" value={recForm.dayOfWeek} onChange={(e) => setRecForm({ ...recForm, dayOfWeek: Number(e.target.value) })} disabled={disabled}>
                  {dayOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <Input placeholder="Hora (ex: 08:30)" value={recForm.timeText} onChange={(e) => setRecForm({ ...recForm, timeText: e.target.value })} disabled={disabled} />
              </div>
              <select className="h-11 w-full rounded-lg border bg-background text-foreground px-3 text-sm" value={recForm.personId} onChange={(e) => setRecForm({ ...recForm, personId: e.target.value })} disabled={disabled}>
                <option value="">Selecione a pessoa</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
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
                    <p className="text-xs text-muted-foreground">
                      {dayNames[item.dayOfWeek] ?? `Dia ${item.dayOfWeek}`}
                      {item.timeText ? ` • ${item.timeText}` : ''} • {personName(item.personId)}
                      {item.isPrivate ? ' • privado' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Mais ações"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <Input placeholder="Título" value={oneOffForm.title} onChange={(e) => setOneOffForm({ ...oneOffForm, title: e.target.value })} disabled={disabled} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={oneOffForm.date} onChange={(e) => setOneOffForm({ ...oneOffForm, date: e.target.value })} disabled={disabled} />
                <Input placeholder="Hora (ex: 14:00)" value={oneOffForm.timeText} onChange={(e) => setOneOffForm({ ...oneOffForm, timeText: e.target.value })} disabled={disabled} />
              </div>
              <select className="h-11 w-full rounded-lg border bg-background text-foreground px-3 text-sm" value={oneOffForm.personId} onChange={(e) => setOneOffForm({ ...oneOffForm, personId: e.target.value })} disabled={disabled}>
                <option value="">Selecione a pessoa</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
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
                    <p className="text-xs text-muted-foreground">
                      {item.date}{item.timeText ? ` • ${item.timeText}` : ''} • {personName(item.personId)}
                      {item.isPrivate ? ' • privado' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Mais ações"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
      </CardContent>
    </Card>
  );
}
