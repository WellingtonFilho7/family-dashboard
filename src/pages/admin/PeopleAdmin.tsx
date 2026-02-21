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
import type { Person } from '@/lib/types';
import type { AdminSectionProps } from './shared';
import { requireAuth, EmptyState, EditableText, DeleteConfirmButton } from './shared';

export function PeopleAdmin({
  people,
  loading,
  refresh,
  disabled,
  hasSession,
}: AdminSectionProps & { people: Person[] }) {
  const [form, setForm] = useState({
    name: '',
    color: '#2563EB',
    type: 'kid',
    sortOrder: (people?.length ?? 0) + 1,
    isPrivate: false,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (form.name.length > 50) {
      newErrors.name = 'Nome muito longo (máx. 50 caracteres)';
    }
    if (!form.color.match(/^#[0-9A-F]{6}$/i)) {
      newErrors.color = 'Cor inválida (use formato #RRGGBB)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!requireAuth(hasSession)) return;
    if (!validateForm()) return;
    setIsCreating(true);
    try {
      const { error } = await supabase!.from('people').insert({
        name: form.name,
        color: form.color,
        type: form.type,
        sort_order: form.sortOrder,
        is_private: form.isPrivate,
      });
      if (error) return toast.error(error.message);
      toast.success('Pessoa criada');
      setForm((prev) => ({ ...prev, name: '' }));
      await refresh();
    } finally {
      setIsCreating(false);
    }
  };

  const updatePerson = async (id: string, patch: Record<string, any>) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from('people').update(patch).eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Atualizado');
      refresh();
    }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pessoas</CardTitle>
        <CardDescription>Ordem controlada por sort_order.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="person-name" className="text-sm font-semibold">
              Nome
            </label>
            <Input
              id="person-name"
              placeholder="Ex: João Silva"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              disabled={disabled}
              className={errors.name ? 'border-destructive' : ''}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive" role="alert">
                {errors.name}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="person-color" className="text-sm font-semibold">
              Cor
            </label>
            <Input
              id="person-color"
              type="color"
              value={form.color}
              onChange={(e) => {
                setForm({ ...form, color: e.target.value });
                if (errors.color) setErrors({ ...errors, color: '' });
              }}
              disabled={disabled}
              className={errors.color ? 'border-destructive' : ''}
              aria-invalid={!!errors.color}
              aria-describedby={errors.color ? 'color-error' : undefined}
            />
            {errors.color && (
              <p id="color-error" className="text-sm text-destructive" role="alert">
                {errors.color}
              </p>
            )}
          </div>
          <select
            className="h-11 rounded-lg border px-3 text-sm"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            disabled={disabled}
          >
            <option value="kid">Criança</option>
            <option value="adult">Adulto</option>
            <option value="guest">Visitante</option>
          </select>
          <Input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            disabled={disabled}
          />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
              disabled={disabled}
            />
            Privado
          </label>
          <Button onClick={handleCreate} disabled={disabled || loading} isLoading={isCreating}>
            {isCreating ? 'Adicionando...' : 'Adicionar pessoa'}
          </Button>
        </div>

        <Separator />

        {people.length === 0 ? (
          <EmptyState message="Nenhuma pessoa adicionada. Use o formulário acima para começar." />
        ) : (
          <div className="space-y-2">
            {people.map((person) => (
              <div
                key={person.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: person.color }} />
                  <div>
                    <EditableText
                      value={person.name}
                      onSave={async (newName) => updatePerson(person.id, { name: newName })}
                      disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      {person.type} • ordem {person.sortOrder ?? 0} {person.isPrivate ? '• privado' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updatePerson(person.id, { is_private: !person.isPrivate })}
                    disabled={disabled}
                  >
                    {person.isPrivate ? 'Tornar público' : 'Privar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updatePerson(person.id, {
                        sort_order: (person.sortOrder ?? 0) + 1,
                      })
                    }
                    disabled={disabled}
                  >
                    + Ordem
                  </Button>
                  <DeleteConfirmButton
                    itemName={person.name}
                    onConfirm={() => deletePerson(person.id)}
                    disabled={disabled}
                    warning={`Ao remover "${person.name}", todos os eventos e rotinas associados ficarão órfãos. Esta ação não pode ser desfeita.`}
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
