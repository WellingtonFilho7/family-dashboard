import { RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Separator,
  Switch,
} from '@/components';
import { useKioskData } from '@/hooks/useKioskData';
import { supabase } from '@/lib/supabase';
import type {
  HomeschoolNote,
  KidRoutineTemplate,
  OneOffItem,
  Person,
  RecurringItem,
  ReplenishItem,
  WeeklyFocus,
} from '@/lib/types';

type AdminCategory = 'people' | 'agenda' | 'routines' | 'replenish' | 'content' | 'config';

function EditPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [category, setCategory] = useState<AdminCategory>('people');

  const { data, loading, refresh, isMock, hasConfig } = useKioskData(false, {
    bypassVisitMode: true,
    requireAuth: true,
    sessionToken: session?.access_token ?? null,
  });

  const supabaseReady = Boolean(supabase) && hasConfig;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground tracking-[0.2em]">Administração</p>
            <h1 className="text-2xl font-bold">Family Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/painel')}>
              Voltar ao painel
            </Button>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>

        {!supabaseReady ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Configurar Supabase</CardTitle>
              <CardDescription>
                Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para habilitar o CRUD direto aqui.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {isMock ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-700">Modo mock</CardTitle>
              <CardDescription>Sem credenciais Supabase; dados não serão salvos.</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {session ? (
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'people', label: 'Pessoas' },
              { key: 'agenda', label: 'Agenda' },
              { key: 'routines', label: 'Rotinas' },
              { key: 'replenish', label: 'Reposição' },
              { key: 'content', label: 'Conteúdo' },
              { key: 'config', label: 'Config' },
            ].map((item) => (
              <Button
                key={item.key}
                variant={category === item.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(item.key as AdminCategory)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        ) : null}

        {!session ? (
          <LoginCard supabaseReady={supabaseReady} />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {category === 'people' && (
              <PeopleAdmin
                people={data?.people ?? []}
                loading={loading}
                refresh={refresh}
                disabled={!supabaseReady || !session}
                hasSession={Boolean(session)}
              />
            )}
            {category === 'agenda' && (
              <AgendaAdmin
                people={data?.people ?? []}
                recurring={data?.recurringItems ?? []}
                oneOff={data?.oneOffItems ?? []}
                loading={loading}
                refresh={refresh}
                disabled={!supabaseReady || !session}
                hasSession={Boolean(session)}
              />
            )}
            {category === 'routines' && (
              <RoutinesAdmin
                people={data?.people ?? []}
                templates={data?.kidRoutineTemplates ?? []}
                loading={loading}
                refresh={refresh}
                disabled={!supabaseReady || !session}
                hasSession={Boolean(session)}
              />
            )}
            {category === 'replenish' && (
              <ReplenishAdmin
                items={data?.replenishItems ?? []}
                loading={loading}
                refresh={refresh}
                disabled={!supabaseReady || !session}
                hasSession={Boolean(session)}
              />
            )}
            {category === 'content' && (
              <ContentAdmin
                people={data?.people ?? []}
                focus={data?.weeklyFocus ?? []}
                notes={data?.homeschoolNotes ?? []}
                loading={loading}
                refresh={refresh}
                disabled={!supabaseReady || !session}
                hasSession={Boolean(session)}
              />
            )}
            {category === 'config' && (
              <ConfigAdmin
                visitMode={data?.settings.visitMode ?? false}
                loading={loading}
                refresh={refresh}
                disabled={!supabaseReady || !session}
                hasSession={Boolean(session)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PeopleAdmin({
  people,
  loading,
  refresh,
  disabled,
  hasSession,
}: {
  people: Person[];
  loading: boolean;
  refresh: () => Promise<void>;
  disabled: boolean;
  hasSession: boolean;
}) {
  const [form, setForm] = useState({
    name: '',
    color: '#2563EB',
    type: 'kid',
    sortOrder: (people?.length ?? 0) + 1,
    isPrivate: false,
  });

  const handleCreate = async () => {
    if (!supabase || !hasSession) {
      toast.error('Faça login para editar');
      return;
    }
    if (!form.name) {
      toast.error('Nome é obrigatório');
      return;
    }
    const { error } = await supabase.from('people').insert({
      name: form.name,
      color: form.color,
      type: form.type,
      sort_order: form.sortOrder,
      is_private: form.isPrivate,
    });
    if (error) return toast.error(error.message);
    toast.success('Pessoa criada');
    setForm((prev) => ({ ...prev, name: '' }));
    refresh();
  };

  const updatePerson = async (id: string, patch: Record<string, any>) => {
    if (!supabase || !hasSession) {
      toast.error('Faça login para editar');
      return;
    }
    const { error } = await supabase.from('people').update(patch).eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Atualizado');
      refresh();
    }
  };

  const deletePerson = async (id: string) => {
    if (!supabase || !hasSession) {
      toast.error('Faça login para editar');
      return;
    }
    const { error } = await supabase.from('people').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Removido');
      refresh();
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
          <Input
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={disabled}
          />
          <Input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            disabled={disabled}
          />
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
          <Button onClick={handleCreate} disabled={disabled || loading}>
            Adicionar pessoa
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          {people.map((person) => (
            <div
              key={person.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: person.color }} />
                <div>
                  <p className="text-sm font-semibold">{person.name}</p>
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
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deletePerson(person.id)}
                  disabled={disabled}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AgendaAdmin({
  people,
  recurring,
  oneOff,
  loading,
  refresh,
  disabled,
  hasSession,
}: {
  people: Person[];
  recurring: RecurringItem[];
  oneOff: OneOffItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  disabled: boolean;
  hasSession: boolean;
}) {
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
    if (!supabase || !hasSession) {
      toast.error('Faça login para editar');
      return;
    }
    if (!recForm.title || !recForm.personId) return toast.error('Título e pessoa são obrigatórios');
    const { error } = await supabase.from('recurring_items').insert({
      title: recForm.title,
      day_of_week: recForm.dayOfWeek,
      time_text: recForm.timeText,
      person_id: recForm.personId,
      is_private: recForm.isPrivate,
    });
    if (error) return toast.error(error.message);
    toast.success('Evento recorrente criado');
    setRecForm((prev) => ({ ...prev, title: '', timeText: '' }));
    refresh();
  };

  const createOneOff = async () => {
    if (!supabase || !hasSession) {
      toast.error('Faça login para editar');
      return;
    }
    if (!oneOffForm.title || !oneOffForm.personId || !oneOffForm.date) {
      return toast.error('Título, pessoa e data são obrigatórios');
    }
    const { error } = await supabase.from('one_off_items').insert({
      title: oneOffForm.title,
      date: oneOffForm.date,
      time_text: oneOffForm.timeText,
      person_id: oneOffForm.personId,
      is_private: oneOffForm.isPrivate,
    });
    if (error) return toast.error(error.message);
    toast.success('Evento pontual criado');
    setOneOffForm((prev) => ({ ...prev, title: '', timeText: '' }));
    refresh();
  };

  const deleteItem = async (table: 'recurring_items' | 'one_off_items', id: string) => {
    if (!supabase || !hasSession) {
      toast.error('Faça login para editar');
      return;
    }
    const { error } = await supabase.from(table).delete().eq('id', id);
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
        <CardDescription>Recorrentes (day_of_week 1=Dom...7=Sáb) e pontuais.</CardDescription>
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
              className="h-11 rounded-lg border px-3 text-sm"
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
              className="h-11 rounded-lg border px-3 text-sm"
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
              className="h-11 rounded-lg border px-3 text-sm"
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
            <div className="space-y-2">
              {recurring.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Dia {item.dayOfWeek} • {item.timeText} • {people.find((p) => p.id === item.personId)?.name ?? 'Pessoa'}
                      {item.isPrivate ? ' • privado' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        supabase &&
                        supabase
                          .from('recurring_items')
                          .update({ is_private: !item.isPrivate })
                          .eq('id', item.id)
                          .then(({ error }) => {
                            if (error) toast.error(error.message);
                            else {
                              toast.success('Atualizado');
                              refresh();
                            }
                          })
                      }
                      disabled={disabled}
                    >
                      {item.isPrivate ? 'Público' : 'Privar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteItem('recurring_items', item.id)}
                      disabled={disabled}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Pontuais</p>
            <div className="space-y-2">
              {oneOff.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.date} • {item.timeText} • {people.find((p) => p.id === item.personId)?.name ?? 'Pessoa'}
                      {item.isPrivate ? ' • privado' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        supabase &&
                        supabase
                          .from('one_off_items')
                          .update({ is_private: !item.isPrivate })
                          .eq('id', item.id)
                          .then(({ error }) => {
                            if (error) toast.error(error.message);
                            else {
                              toast.success('Atualizado');
                              refresh();
                            }
                          })
                      }
                      disabled={disabled}
                    >
                      {item.isPrivate ? 'Público' : 'Privar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteItem('one_off_items', item.id)}
                      disabled={disabled}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RoutinesAdmin({
  people,
  templates,
  loading,
  refresh,
  disabled,
  hasSession,
}: {
  people: Person[];
  templates: KidRoutineTemplate[];
  loading: boolean;
  refresh: () => Promise<void>;
  disabled: boolean;
  hasSession: boolean;
}) {
  const kids = people.filter((p) => p.type === 'kid');
  const [form, setForm] = useState({
    title: '',
    personId: kids[0]?.id ?? '',
    isPrivate: false,
  });

  const createTemplate = async () => {
    if (!supabase || !hasSession) {
      toast.error('Faça login para editar');
      return;
    }
    if (!form.title || !form.personId) return toast.error('Título e criança são obrigatórios');
    const { error } = await supabase.from('kid_routine_templates').insert({
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
    if (!supabase || !hasSession) {
      toast.error('Faça login para editar');
      return;
    }
    const { error } = await supabase.from('kid_routine_templates').update({ [field]: value }).eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Atualizado');
      refresh();
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!supabase || !hasSession) {
      toast.error('Faça login para editar');
      return;
    }
    const { error } = await supabase.from('kid_routine_templates').delete().eq('id', id);
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

        <div className="space-y-2">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
            >
              <div>
                <p className="text-sm font-semibold">{tpl.title}</p>
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
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteTemplate(tpl.id)}
                  disabled={disabled}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ReplenishAdmin({
  items,
  loading,
  refresh,
  disabled,
  hasSession,
}: {
  items: ReplenishItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  disabled: boolean;
  hasSession: boolean;
}) {
  const [form, setForm] = useState({
    title: '',
    urgency: 'now',
    isPrivate: false,
  });

  const createItem = async () => {
    if (!supabase || !hasSession) {
      toast.error('Faça login para editar');
      return;
    }
    if (!form.title) return toast.error('Título é obrigatório');
    const { error } = await supabase.from('replenish_items').insert({
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
    if (!supabase || !hasSession) {
      toast.error('Faça login para editar');
      return;
    }
    const { error } = await supabase.from('replenish_items').update(patch).eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Atualizado');
      refresh();
    }
  };

  const deleteItem = async (id: string) => {
    if (!supabase || !hasSession) {
      toast.error('Faça login para editar');
      return;
    }
    const { error } = await supabase.from('replenish_items').delete().eq('id', id);
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

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
            >
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
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
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteItem(item.id)}
                  disabled={disabled}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ContentAdmin({
  people,
  focus,
  notes,
  loading,
  refresh,
  disabled,
  hasSession,
}: {
  people: Person[];
  focus: WeeklyFocus[];
  notes: HomeschoolNote[];
  loading: boolean;
  refresh: () => Promise<void>;
  disabled: boolean;
  hasSession: boolean;
}) {
  const [focusForm, setFocusForm] = useState({
    text: focus.find((f) => f.isActive)?.text ?? '',
    reference: focus.find((f) => f.isActive)?.reference ?? '',
  });
  const [noteKid, setNoteKid] = useState(people.find((p) => p.type === 'kid')?.id ?? '');
  const [noteContent, setNoteContent] = useState('');

  const saveFocus = async () => {
    if (!supabase || !hasSession) {
      toast.error('Faça login para editar');
      return;
    }
    if (!focusForm.text) return toast.error('Texto é obrigatório');
    await supabase.from('weekly_focus').update({ is_active: false });
    const { error } = await supabase.from('weekly_focus').insert({
      text: focusForm.text,
      reference: focusForm.reference,
      is_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success('Foco atualizado');
    refresh();
  };

  const saveNotes = async () => {
    if (!supabase || !noteKid || !hasSession) {
      toast.error('Faça login para editar');
      return;
    }
    const list = noteContent
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const existing = notes.find((n) => n.kidPersonId === noteKid);
    const payload = { kid_person_id: noteKid, notes: list, is_private: existing?.isPrivate ?? false };
    let error;
    if (existing) {
      ({ error } = await supabase.from('homeschool_notes').update(payload).eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('homeschool_notes').insert(payload));
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
        <CardDescription>Versículo/foco e homeschool por criança.</CardDescription>
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
            className="h-11 rounded-lg border px-3 text-sm"
            value={noteKid}
            onChange={(e) => setNoteKid(e.target.value)}
            disabled={disabled}
          >
            {people
              .filter((p) => p.type === 'kid')
              .map((kid) => (
                <option key={kid.id} value={kid.id}>
                  {kid.name}
                </option>
              ))}
          </select>
          <textarea
            className="min-h-[140px] w-full rounded-lg border px-3 py-2 text-sm"
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

function ConfigAdmin({
  visitMode,
  loading,
  refresh,
  disabled,
  hasSession,
}: {
  visitMode: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  disabled: boolean;
  hasSession: boolean;
}) {
  const toggleVisit = async () => {
    if (!supabase || !hasSession) {
      toast.error('Faça login para editar');
      return;
    }
    const { error } = await supabase
      .from('settings')
      .upsert({ id: 1, visit_mode: !visitMode }, { onConflict: 'id' });
    if (error) toast.error(error.message);
    else {
      toast.success('Configuração salva');
      refresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
        <CardDescription>Visit_mode singleton id=1.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <span className="text-sm font-semibold">Modo visitas</span>
        <Switch checked={visitMode} onCheckedChange={toggleVisit} disabled={disabled || loading} />
      </CardContent>
    </Card>
  );
}

function LoginCard({ supabaseReady }: { supabaseReady: boolean }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      toast.error('Configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
      return;
    }
    if (!email) {
      toast.error('Informe um e-mail');
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/editar` },
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Link de login enviado');
    }
  };

  return (
    <Card className="w-full max-w-md border border-border/60 bg-white/90">
      <CardHeader>
        <CardTitle>Área administrativa</CardTitle>
        <CardDescription>Login via Supabase Auth (OTP por e-mail).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
          {supabaseReady
            ? 'Insira seu e-mail para receber um link de acesso seguro.'
            : 'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para ativar o login.'}
        </div>
        <form className="space-y-3" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">E-mail</label>
            <Input
              type="email"
              placeholder="admin@familia.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={!supabaseReady || sending}
            />
          </div>
          <Button type="submit" disabled={!supabaseReady || sending} className="w-full">
            {sending ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Receber link'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default EditPage;
