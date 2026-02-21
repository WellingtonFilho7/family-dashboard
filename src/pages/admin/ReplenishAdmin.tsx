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
import type { ReplenishItem } from '@/lib/types';
import type { AdminSectionProps } from './shared';
import { requireAuth, EmptyState, EditableText, DeleteConfirmButton } from './shared';

export function ReplenishAdmin({
  items,
  loading,
  refresh,
  disabled,
  hasSession,
}: AdminSectionProps & { items: ReplenishItem[] }) {
  const [form, setForm] = useState({
    title: '',
    urgency: 'now',
    isPrivate: false,
  });

  const createItem = async () => {
    if (!requireAuth(hasSession)) return;
    if (!form.title) return toast.error('Título é obrigatório');
    const { error } = await supabase!.from('replenish_items').insert({
      title: form.title,
      urgency: form.urgency,
      is_active: true,
      is_private: form.isPrivate,
    });
    if (error) return toast.error(error.message);
    toast.success('Item criado');
    setForm({ title: '', urgency: 'now', isPrivate: false });
    refresh();
  };

  const updateItem = async (id: string, patch: Record<string, any>) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from('replenish_items').update(patch).eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Atualizado');
      refresh();
    }
  };

  const deleteItem = async (id: string) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from('replenish_items').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Removido');
      refresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reposição</CardTitle>
        <CardDescription>Urgência: now / soon</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <Input
            placeholder="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            disabled={disabled}
          />
          <select
            className="h-11 rounded-lg border px-3 text-sm"
            value={form.urgency}
            onChange={(e) => setForm({ ...form, urgency: e.target.value })}
            disabled={disabled}
          >
            <option value="now">Agora</option>
            <option value="soon">Em breve</option>
          </select>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
              disabled={disabled}
            />
            Privado
          </label>
          <Button onClick={createItem} disabled={disabled || loading}>
            Criar item
          </Button>
        </div>

        <Separator />

        {items.length === 0 ? (
          <EmptyState message="Lista de reposição vazia." />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
              >
                <div>
                  <EditableText
                    value={item.title}
                    onSave={async (newTitle) => updateItem(item.id, { title: newTitle })}
                    disabled={disabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    {item.urgency} • {item.isActive ? 'ativo' : 'inativo'} {item.isPrivate ? '• privado' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateItem(item.id, { is_active: !item.isActive })}
                    disabled={disabled}
                  >
                    {item.isActive ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateItem(item.id, {
                        urgency: item.urgency === 'now' ? 'soon' : 'now',
                      })
                    }
                    disabled={disabled}
                  >
                    Trocar urgência
                  </Button>
                  <DeleteConfirmButton
                    itemName={item.title}
                    onConfirm={() => deleteItem(item.id)}
                    disabled={disabled}
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
