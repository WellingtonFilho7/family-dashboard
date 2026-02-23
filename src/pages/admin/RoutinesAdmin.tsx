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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    personId: kids[0]?.id ?? '',
  });

  const createTemplate = async () => {
    if (!requireAuth(hasSession)) return;
    if (!form.title || !form.personId) return toast.error('Título e criança são obrigatórios');
    const { error } = await supabase!.from('kid_routine_templates').insert({
      title: form.title,
      person_id: form.personId,
      is_active: true,
      is_private: false,
    });
    if (error) return toast.error(error.message);
    toast.success('Rotina criada');
    setForm((prev) => ({ ...prev, title: '' }));
    setShowForm(false);
    refresh();
  };

  const toggleTemplate = async (id: string, field: 'is_active' | 'is_private', value: boolean) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from('kid_routine_templates').update({ [field]: value }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Atualizado'); refresh(); }
  };

  const updateTitle = async (id: string, newTitle: string) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from('kid_routine_templates').update({ title: newTitle }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Atualizado'); refresh(); }
  };

  const deleteTemplate = async (id: string) => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!.from('kid_routine_templates').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Removido'); refresh(); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rotinas das crianças</CardTitle>
            <CardDescription>Tarefas diárias para cada criança.</CardDescription>
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
              <Input placeholder="Ex: Escovar os dentes" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} disabled={disabled} />
              <select className="h-11 w-full rounded-lg border bg-background text-foreground px-3 text-sm" value={form.personId} onChange={(e) => setForm({ ...form, personId: e.target.value })} disabled={disabled}>
                {kids.map((kid) => <option key={kid.id} value={kid.id}>{kid.name}</option>)}
              </select>
              <Button onClick={createTemplate} disabled={disabled || loading} className="w-full">Criar rotina</Button>
            </div>
            <Separator />
          </>
        )}

        {templates.length === 0 ? (
          <EmptyState message="Nenhuma rotina criada." />
        ) : (
          <div className="space-y-2">
            {templates.map((tpl) => (
              <div key={tpl.id} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                <div className="min-w-0">
                  <EditableText value={tpl.title} onSave={(t) => updateTitle(tpl.id, t)} disabled={disabled} />
                  <p className="text-xs text-muted-foreground">
                    {people.find((p) => p.id === tpl.personId)?.name ?? 'Criança'}
                    {!tpl.isActive ? ' • inativo' : ''}
                    {tpl.isPrivate ? ' • privado' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Mais ações"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleTemplate(tpl.id, 'is_active', !tpl.isActive)}>
                        {tpl.isActive ? 'Desativar' : 'Ativar'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggleTemplate(tpl.id, 'is_private', !tpl.isPrivate)}>
                        {tpl.isPrivate ? 'Tornar público' : 'Tornar privado'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DeleteConfirmButton itemName={tpl.title} onConfirm={() => deleteTemplate(tpl.id)} disabled={disabled} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
