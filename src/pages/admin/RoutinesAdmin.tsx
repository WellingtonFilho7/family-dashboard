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
import type { KidRoutineTemplate, Person } from '@/lib/types';
import type { AdminSectionProps } from './shared';
import { requireAuth, EmptyState, EditableText, DeleteConfirmButton } from './shared';

export function RoutinesAdmin({
  people,
  templates,
  loading,
  refresh,
  disabled,
  hasSession,
}: AdminSectionProps & { people: Person[]; templates: KidRoutineTemplate[] }) {
  const kids = people.filter((p) => p.type === 'kid');
  const [form, setForm] = useState({
    title: '',
    personId: kids[0]?.id ?? '',
    isPrivate: false,
  });

  const createTemplate = async () => {
    if (!requireAuth(hasSession)) return;
    if (!form.title || !form.personId) return toast.error('Título e criança são obrigatórios');
    const { error } = await supabase!.from('kid_routine_templates').insert({
      title: form.title,
      person_id: form.personId,
      is_active: true,
      is_private: form.isPrivate,
    });
    if (error) return toast.error(error.message);
    toast.success('Rotina criada');
    setForm((prev) => ({ ...prev, title: '' }));
    refresh();
  };

  const toggleTemplate = async (id: string, field: 'is_active' | 'is_private', value: boolean) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from('kid_routine_templates').update({ [field]: value }).eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Atualizado');
      refresh();
    }
  };

  const updateTitle = async (id: string, newTitle: string) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from('kid_routine_templates').update({ title: newTitle }).eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Atualizado');
      refresh();
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from('kid_routine_templates').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Removido');
      refresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rotinas das crianças</CardTitle>
        <CardDescription>Checks gravados com unique(template_id, date).</CardDescription>
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
            value={form.personId}
            onChange={(e) => setForm({ ...form, personId: e.target.value })}
            disabled={disabled}
          >
            {kids.map((kid) => (
              <option key={kid.id} value={kid.id}>
                {kid.name}
              </option>
            ))}
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
          <Button onClick={createTemplate} disabled={disabled || loading}>
            Criar rotina
          </Button>
        </div>

        <Separator />

        {templates.length === 0 ? (
          <EmptyState message="Nenhuma rotina criada. Adicione rotinas para as crianças acima." />
        ) : (
          <div className="space-y-2">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
              >
                <div>
                  <EditableText
                    value={tpl.title}
                    onSave={(newTitle) => updateTitle(tpl.id, newTitle)}
                    disabled={disabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    {people.find((p) => p.id === tpl.personId)?.name ?? 'Criança'}
                    {tpl.isPrivate ? ' • privado' : ''} {tpl.isActive ? '• ativo' : '• inativo'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleTemplate(tpl.id, 'is_active', !tpl.isActive)}
                    disabled={disabled}
                  >
                    {tpl.isActive ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleTemplate(tpl.id, 'is_private', !tpl.isPrivate)}
                    disabled={disabled}
                  >
                    {tpl.isPrivate ? 'Público' : 'Privar'}
                  </Button>
                  <DeleteConfirmButton
                    itemName={tpl.title}
                    onConfirm={() => deleteTemplate(tpl.id)}
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
