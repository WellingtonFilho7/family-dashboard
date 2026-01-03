import {
  CalendarRange,
  Check,
  Clock3,
  Edit3,
  QrCode,
  RefreshCcw,
  Sparkles,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { addDays, format, formatISO } from 'date-fns';
import { Toaster, toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';

import { useKioskData } from '@/hooks/useKioskData';
import {
  Badge,
  buttonVariants,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Separator,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components';
import { cn } from '@/lib/utils';
import type {
  CalendarItem,
  KidRoutineCheck,
  KidRoutineTemplate,
  OneOffItem,
  Person,
  RecurringItem,
  ReplenishItem,
  HomeschoolNote,
  WeeklyFocus,
} from '@/lib/types';
import { supabase } from '@/lib/supabase';

function App() {
  return (
    <BrowserRouter>
      <TooltipProvider delayDuration={0}>
        <Routes>
          <Route path="/painel" element={<PanelPage />} />
          <Route path="/editar" element={<EditPage />} />
          <Route path="*" element={<Navigate to="/painel" replace />} />
        </Routes>
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </BrowserRouter>
  );
}

type ViewMode = 'calendar' | 'kids';

function PanelPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [visitMode, setVisitMode] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [qrOpen, setQrOpen] = useState(false);
  const {
    data,
    loading,
    calendarByDay,
    weekDays,
    routineChecks,
    toggleRoutine,
    isMock,
    isProd,
    error,
  } = useKioskData(visitMode);

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (data?.settings.visitMode) setVisitMode(true);
  }, [data?.settings.visitMode]);

  const focus = data?.weeklyFocus.find((item) => item.isActive);
  const activeKids = data?.people.filter((p) => p.type === 'kid') ?? [];

  const handleToggleRoutine = async (templateId: string) => {
    const willComplete = await toggleRoutine(templateId);
    if (willComplete) {
      toast.success('Rotina concluída!');
      requestAnimationFrame(() => {
        confetti({
          particleCount: 80,
          spread: 70,
          ticks: 200,
          origin: { y: 0.2 },
        });
      });
    }
  };

  const visitLabel = visitMode ? 'Visitantes' : 'Família';
  const humanDate = clock.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  });

  return (
    <div className="min-h-screen px-6 py-5">
      <div className="flex gap-6">
        <Sidebar
          active={viewMode}
          onChange={setViewMode}
          visitMode={visitMode}
          onToggleVisit={() => setVisitMode((prev) => !prev)}
          onOpenQr={() => setQrOpen(true)}
        />

        <div className="grid flex-1 grid-cols-[1fr_320px] gap-6">
          <div className="flex flex-col gap-4">
            <header className="flex items-center justify-between gap-4 rounded-3xl border bg-white/70 px-6 py-4 backdrop-blur">
              <div className="space-y-1">
                <p className="text-xs uppercase text-muted-foreground tracking-[0.2em]">
                  Família
                </p>
                <h1 className="text-3xl font-bold leading-tight">Painel semanal</h1>
              </div>
              <div className="text-right">
                <p className="text-sm capitalize text-muted-foreground">{humanDate}</p>
                <p className="text-4xl font-semibold tabular-nums">{format(clock, 'HH:mm')}</p>
              </div>
            </header>

            {focus ? (
              <Card className="border-dashed bg-white/70">
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground tracking-wide">
                      Versículo / Foco da semana
                    </p>
                    <CardTitle className="text-lg font-semibold leading-snug line-clamp-2">
                      {focus.text}
                    </CardTitle>
                    {focus.reference ? (
                      <CardDescription className="mt-1 text-sm font-medium text-primary">
                        {focus.reference}
                      </CardDescription>
                    ) : null}
                  </div>
                  <Badge className="shrink-0 bg-primary/10 text-primary">
                    <Sparkles className="mr-1 h-4 w-4" />
                    Sempre visível
                  </Badge>
                </CardHeader>
              </Card>
            ) : null}

            {error && isProd && (
              <Card className="border-destructive/40 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-destructive">Aviso</CardTitle>
                  <CardDescription className="text-destructive">
                    {error}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
            {isMock && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-amber-700">Modo mock (dev)</CardTitle>
                  <CardDescription>
                    Supabase não configurado em desenvolvimento. Dados não são reais.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="muted">
                  <Clock3 className="mr-2 h-4 w-4" />
                  Semana atual • {format(weekDays[0], 'dd/MM')}–{format(addDays(weekDays[0], 6), 'dd/MM')}
                </Badge>
                <Badge variant="outline">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {visitLabel}
                </Badge>
              </div>
              <div className="flex gap-2">
                <span className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'cursor-default')}>
                  {viewMode === 'calendar' ? 'Calendário semanal' : 'Rotinas das crianças'}
                </span>
              </div>
            </div>

            <div className="flex-1">
              {viewMode === 'calendar' ? (
                <CalendarGrid
                  loading={loading}
                  days={calendarByDay}
                  people={data?.people ?? []}
                />
              ) : (
                <KidsGrid
                  people={activeKids}
                  templates={data?.kidRoutineTemplates ?? []}
                  checks={routineChecks}
                  onToggle={handleToggleRoutine}
                  visitMode={visitMode}
                />
              )}
            </div>
          </div>

          <RightColumn loading={loading} data={data} />
        </div>
      </div>

      <QrModal open={qrOpen} onOpenChange={setQrOpen} />
    </div>
  );
}

function Sidebar({
  active,
  onChange,
  visitMode,
  onToggleVisit,
  onOpenQr,
}: {
  active: ViewMode;
  onChange: (view: ViewMode) => void;
  visitMode: boolean;
  onToggleVisit: () => void;
  onOpenQr: () => void;
}) {
  const items: Array<{ key: ViewMode; icon: React.ReactNode; label: string }> = [
    { key: 'calendar', icon: <CalendarRange className="h-5 w-5" />, label: 'Calendário' },
    { key: 'kids', icon: <Users className="h-5 w-5" />, label: 'Crianças' },
  ];

  return (
    <aside className="flex w-20 flex-col items-center gap-4 rounded-3xl border bg-white/80 px-3 py-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Tooltip key={item.key}>
            <TooltipTrigger asChild>
              <Button
                variant={active === item.key ? 'default' : 'ghost'}
                size="icon"
                aria-pressed={active === item.key}
                onClick={() => onChange(item.key)}
                className={cn(
                  'h-12 w-12 rounded-2xl',
                  active === item.key
                    ? 'shadow-lg shadow-primary/10'
                    : 'hover:bg-muted'
                )}
              >
                {item.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator className="my-2 w-10" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-2xl"
            onClick={onOpenQr}
          >
            <QrCode className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar via QR</TooltipContent>
      </Tooltip>

      <div className="mt-auto flex flex-col items-center gap-2 rounded-2xl bg-muted/50 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Modo visitas
        </p>
        <Switch checked={visitMode} onCheckedChange={onToggleVisit} />
      </div>
    </aside>
  );
}

function CalendarGrid({
  loading,
  days,
  people,
}: {
  loading: boolean;
  days: { date: Date; items: CalendarItem[] }[];
  people: Person[];
}) {
  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const fallbackColor = '#0EA5E9';

  return (
    <Card className="border-none bg-transparent shadow-none">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {days.map(({ date, items }) => {
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
            const overflow = Math.max(items.length - 4, 0);
            return (
              <div
                key={formatISO(date)}
                className="rounded-2xl border border-border/60 bg-white/70 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {dayName}
                    </p>
                    <p className="text-2xl font-semibold leading-tight">
                      {format(date, 'dd')}
                    </p>
                  </div>
                  <Badge variant="muted">
                    {items.length} evento{items.length === 1 ? '' : 's'}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  {loading ? (
                    <div className="h-24 rounded-xl bg-muted/60 animate-pulse" />
                  ) : items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nada por aqui</p>
                  ) : (
                    items.slice(0, 4).map((item) => {
                      const person = personById.get(item.personId);
                      const dotColor = person?.color ?? item.personColor ?? fallbackColor;
                      return (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 rounded-xl border border-border/60 bg-gradient-to-r from-muted/60 to-white/80 p-3 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.4)]"
                        >
                          <span
                            className="mt-1 h-3 w-3 rounded-full"
                            style={{ backgroundColor: dotColor }}
                          />
                          <div className="space-y-1">
                            <p className="text-sm font-semibold leading-snug">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.timeText}{' '}
                              {person ? (
                                <span className="text-[11px] font-semibold text-foreground/80">
                                  • {person.name}
                                </span>
                              ) : null}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {overflow > 0 ? (
                    <p className="text-xs font-semibold text-muted-foreground">
                      +{overflow} restantes
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function KidsGrid({
  people,
  templates,
  checks,
  onToggle,
  visitMode,
}: {
  people: Person[];
  templates: KidRoutineTemplate[];
  checks: KidRoutineCheck[];
  onToggle: (templateId: string) => Promise<void> | void;
  visitMode: boolean;
}) {
  const todayKey = formatISO(new Date(), { representation: 'date' });

  if (visitMode) {
    return (
      <Card className="border-dashed bg-white/60">
        <CardHeader>
          <CardTitle>Modo visitas</CardTitle>
          <CardDescription>
            Rotinas e nomes sensíveis ocultos. Desative para marcar atividades das crianças.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {people.map((kid) => {
        const kidTemplates = templates.filter(
          (t) => t.personId === kid.id && t.isActive
        );
        const completedIds = checks
          .filter((c: any) => c.date === todayKey && c.completed)
          .map((c: any) => c.templateId);

        return (
          <Card key={kid.id} className="border border-border/60 bg-white/80">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: kid.color }}
                  aria-hidden
                />
                <CardTitle>{kid.name}</CardTitle>
              </div>
              <Badge variant="muted">
                {completedIds.length}/{kidTemplates.length || 1}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {kidTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem rotinas ativas</p>
              ) : (
                kidTemplates.map((routine) => {
                  const done = completedIds.includes(routine.id);
                  return (
                    <button
                      key={routine.id}
                      type="button"
                      onClick={() => onToggle(routine.id)}
                      className={cn(
                        'flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-base font-semibold transition',
                        done
                          ? 'border-emerald-500/50 bg-emerald-50 text-emerald-800 shadow-[0_15px_40px_-25px_rgba(16,185,129,0.9)]'
                          : 'border-border bg-white hover:border-primary/50 hover:shadow-md'
                      )}
                    >
                      <span className="pr-3">{routine.title}</span>
                      <span
                        className={cn(
                          'grid h-9 w-9 place-items-center rounded-full border-2',
                          done
                            ? 'border-emerald-500 bg-white text-emerald-600'
                            : 'border-border bg-muted text-muted-foreground'
                        )}
                      >
                        <Check className="h-5 w-5" />
                      </span>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RightColumn({
  data,
  loading,
}: {
  data: any;
  loading: boolean;
}) {
  const replenish = useMemo(() => {
    if (!data) return [];
    const urgentFirst = [...data.replenishItems].sort((a, b) =>
      a.urgency === b.urgency ? 0 : a.urgency === 'now' ? -1 : 1
    );
    return urgentFirst.filter((item) => item.isActive);
  }, [data]);

  const homeschoolOrder = ['benjamin', 'jose', 'judah'];
  const homeschoolColors: Record<string, string> = {
    benjamin: '#2563EB',
    jose: '#16A34A',
    judah: '#DC2626',
  };

  return (
    <div className="sticky top-5 flex flex-col gap-3">
      <Card className="bg-white/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reposição</CardTitle>
            <Badge variant="muted">{replenish.length || 0} itens</Badge>
          </div>
          <CardDescription>Urgências visíveis mesmo fora do calendário.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-24 rounded-xl bg-muted/60 animate-pulse" />
          ) : replenish.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada pendente.</p>
          ) : (
            <div className="space-y-2">
              {replenish.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center justify-between rounded-xl border px-3 py-2',
                    item.urgency === 'now'
                      ? 'border-destructive/40 bg-destructive/5 text-destructive'
                      : 'border-amber-400/60 bg-amber-50 text-amber-700'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{item.title}</span>
                  </div>
                  <Badge variant="outline" className="border-current">
                    {item.urgency === 'now' ? 'Agora' : 'Em breve'}
                  </Badge>
                </div>
              ))}
              {replenish.length > 4 ? (
                <p className="text-xs text-muted-foreground">
                  +{replenish.length - 4} itens escondidos
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Homeschool da semana</CardTitle>
            <Badge variant="outline">Ordem fixa</Badge>
          </div>
          <CardDescription>Até 6 tópicos por criança; demais aparecem em +N.</CardDescription>
        </CardHeader>
        <CardContent>
          {homeschoolOrder.map((kidId) => {
            const note = data?.homeschoolNotes.find(
              (n: any) => n.kidPersonId === kidId
            );
            const topics = note?.notes ?? [];
            const overflow = Math.max(topics.length - 6, 0);
            const name =
              data?.people.find((p: Person) => p.id === kidId)?.name ||
              kidId.charAt(0).toUpperCase() + kidId.slice(1);

            return (
              <div key={kidId} className="mb-4 last:mb-0">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: homeschoolColors[kidId] }}
                  />
                  <p className="text-sm font-semibold">{name}</p>
                </div>
                {loading ? (
                  <div className="h-16 rounded-lg bg-muted/60 animate-pulse" />
                ) : topics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem tópicos</p>
                ) : (
                  <ul className="space-y-1 text-sm text-foreground">
                    {topics.slice(0, 6).map((topic: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                        <span className="leading-snug">{topic}</span>
                      </li>
                    ))}
                    {overflow > 0 ? (
                      <li className="text-xs font-semibold text-muted-foreground">
                        +{overflow} itens adicionais
                      </li>
                    ) : null}
                  </ul>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function QrModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const editLink = `${window.location.origin}/editar`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar pelo celular</DialogTitle>
          <DialogDescription>
            Aponte a câmera para o QR ou abra o link para acessar /editar com login Supabase.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-3xl border bg-white p-4 shadow-inner">
            <QRCodeCanvas value={editLink} size={220} />
          </div>
          <a
            href="/editar"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'w-full justify-center'
            )}
          >
            <Edit3 className="mr-2 h-5 w-5" />
            Abrir /editar
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type AdminCategory =
  | 'people'
  | 'agenda'
  | 'routines'
  | 'replenish'
  | 'content'
  | 'config';

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
            <p className="text-xs uppercase text-muted-foreground tracking-[0.2em]">
              Administração
            </p>
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
                  onClick={() =>
                    updatePerson(person.id, { is_private: !person.isPrivate })
                  }
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
                      {item.date} • {item.timeText}{' '}
                      • {people.find((p) => p.id === item.personId)?.name ?? 'Pessoa'}
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
                  {item.urgency} • {item.isActive ? 'ativo' : 'inativo'}{' '}
                  {item.isPrivate ? '• privado' : ''}
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
    // desativar todos e ativar novo
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

export default App;
