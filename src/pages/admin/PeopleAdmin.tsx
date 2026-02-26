import { ChevronDown, ChevronUp, MoreVertical, Plus, X } from 'lucide-react';
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
import type { Person } from '@/lib/types';
import type { AdminSectionProps } from './shared';
import { requireAuth, EmptyState, EditableText, DeleteConfirmButton } from './shared';

const typeLabels: Record<string, string> = { kid: 'Criança', adult: 'Adulto', guest: 'Visitante' };

export function PeopleAdmin({
  people,
  loading,
  refresh,
  disabled,
  hasSession,
}: AdminSectionProps & { people: Person[] }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    color: '#2563EB',
    type: 'kid',
    isPrivate: false,
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!requireAuth(hasSession)) return;
    if (!form.name.trim()) return toast.error('Nome é obrigatório');
    setIsCreating(true);
    try {
      const { error } = await supabase!.from('people').insert({
        name: form.name.trim(),
        color: form.color,
        type: form.type,
        sort_order: (people?.length ?? 0) + 1,
        is_private: form.isPrivate,
      });
      if (error) return toast.error(error.message);
      toast.success('Pessoa criada');
      setForm({ name: '', color: '#2563EB', type: 'kid', isPrivate: false });
      setShowForm(false);
      await refresh();
    } finally {
      setIsCreating(false);
    }
  };

  const updatePerson = async (id: string, patch: Record<string, unknown>) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from('people').update(patch).eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Atualizado');
      refresh();
    }
  };

  const movePerson = async (person: Person, direction: 'up' | 'down') => {
    if (!requireAuth(hasSession)) return;
    const sorted = [...people].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const idx = sorted.findIndex((p) => p.id === person.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await Promise.all([
      supabase!.from('people').update({ sort_order: other.sortOrder ?? 0 }).eq('id', person.id),
      supabase!.from('people').update({ sort_order: person.sortOrder ?? 0 }).eq('id', other.id),
    ]);
    toast.success('Ordem alterada');
    refresh();
  };

  const deletePerson = async (id: string) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from('people').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Removido');
      await refresh();
    }
  };

  const sorted = [...people].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pessoas</CardTitle>
            <CardDescription>Membros da família e visitantes.</CardDescription>
          </div>
          <Button
            size="sm"
            variant={showForm ? 'outline' : 'default'}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
            {showForm ? 'Fechar' : 'Adicionar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <>
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  placeholder="Ex: João Silva"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Cor</label>
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tipo</label>
                  <select
                    className="h-11 w-full rounded-lg border bg-background text-foreground px-3 text-base"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    disabled={disabled}
                  >
                    <option value="kid">Criança</option>
                    <option value="adult">Adulto</option>
                    <option value="guest">Visitante</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={disabled || loading} className="w-full" isLoading={isCreating}>
                {isCreating ? 'Adicionando...' : 'Adicionar pessoa'}
              </Button>
            </div>
            <Separator />
          </>
        )}

        {sorted.length === 0 ? (
          <EmptyState message="Nenhuma pessoa adicionada." />
        ) : (
          <div className="space-y-2">
            {sorted.map((person, idx) => (
              <div
                key={person.id}
                className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: person.color }} />
                  <div className="min-w-0">
                    <EditableText
                      value={person.name}
                      onSave={async (newName) => updatePerson(person.id, { name: newName })}
                      disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      {typeLabels[person.type] ?? person.type}
                      {person.isPrivate ? ' • privado' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => movePerson(person, 'up')}
                    disabled={disabled || idx === 0}
                    aria-label="Subir"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => movePerson(person, 'down')}
                    disabled={disabled || idx === sorted.length - 1}
                    aria-label="Descer"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Mais ações">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updatePerson(person.id, { is_private: !person.isPrivate })}>
                        {person.isPrivate ? 'Tornar público' : 'Tornar privado'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DeleteConfirmButton
                    itemName={person.name}
                    onConfirm={() => deletePerson(person.id)}
                    disabled={disabled}
                    warning={`Ao remover "${person.name}", todos os eventos e rotinas associados ficarão órfãos.`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
