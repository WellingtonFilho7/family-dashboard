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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Separator,
} from '@/components';
import { supabase } from '@/lib/supabase';
import type { ReplenishItem } from '@/lib/types';
import type { AdminSectionProps } from './shared';
import { requireAuth, EmptyState, EditableText, DeleteConfirmButton } from './shared';

const urgencyLabels: Record<string, string> = { now: 'Agora', soon: 'Em breve' };

export function ReplenishAdmin({
  items,
  loading,
  refresh,
  disabled,
  hasSession,
}: AdminSectionProps & { items: ReplenishItem[] }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', urgency: 'now' });

  const createItem = async () => {
    if (!requireAuth(hasSession)) return;
    if (!form.title) return toast.error('Título é obrigatório');
    const { error } = await supabase!.from('replenish_items').insert({
      title: form.title,
      urgency: form.urgency,
      is_active: true,
      is_private: false,
    });
    if (error) return toast.error(error.message);
    toast.success('Item criado');
    setForm({ title: '', urgency: 'now' });
    setShowForm(false);
    refresh();
  };

  const updateItem = async (id: string, patch: Record<string, unknown>) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from('replenish_items').update(patch).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Atualizado'); refresh(); }
  };

  const deleteItem = async (id: string) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from('replenish_items').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Removido'); refresh(); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reposição</CardTitle>
            <CardDescription>Itens para comprar ou repor.</CardDescription>
          </div>
          <Button size="sm" variant={showForm ? 'outline' : 'default'} onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
            {showForm ? 'Fechar' : 'Adicionar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <>
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <Input placeholder="Ex: Leite integral" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} disabled={disabled} />
              <select className="h-11 w-full rounded-lg border bg-background text-foreground px-3 text-sm" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} disabled={disabled}>
                <option value="now">Agora</option>
                <option value="soon">Em breve</option>
              </select>
              <Button onClick={createItem} disabled={disabled || loading} className="w-full">Criar item</Button>
            </div>
            <Separator />
          </>
        )}

        {items.length === 0 ? (
          <EmptyState message="Lista de reposição vazia." />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                <div className="min-w-0">
                  <EditableText value={item.title} onSave={async (t) => updateItem(item.id, { title: t })} disabled={disabled} />
                  <p className="text-xs text-muted-foreground">
                    {urgencyLabels[item.urgency] ?? item.urgency}
                    {!item.isActive ? ' • inativo' : ''}
                    {item.isPrivate ? ' • privado' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Mais ações"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateItem(item.id, { urgency: item.urgency === 'now' ? 'soon' : 'now' })}>
                        {item.urgency === 'now' ? 'Marcar: Em breve' : 'Marcar: Agora'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateItem(item.id, { is_active: !item.isActive })}>
                        {item.isActive ? 'Desativar' : 'Ativar'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => updateItem(item.id, { is_private: !item.isPrivate })}>
                        {item.isPrivate ? 'Tornar público' : 'Tornar privado'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DeleteConfirmButton itemName={item.title} onConfirm={() => deleteItem(item.id)} disabled={disabled} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
