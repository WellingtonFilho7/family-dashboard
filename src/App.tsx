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
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { addDays, format, formatISO } from 'date-fns';
import { Toaster, toast } from 'sonner';

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
  Separator,
  Skeleton,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components';
import { cn } from '@/lib/utils';
import type { CalendarItem, KidRoutineCheck, KidRoutineTemplate, Person } from '@/lib/types';
import EditPage from '@/pages/EditPage';

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
  const { data, loading, calendarByDay, weekDays, routineChecks, toggleRoutine, isMock, isProd, error } =
    useKioskData(visitMode);

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
    <div className="min-h-screen px-4 py-5 pb-24 md:px-6 md:pb-5">
      <div className="flex flex-col gap-6 lg:flex-row">
        <Sidebar
          active={viewMode}
          onChange={setViewMode}
          visitMode={visitMode}
          onToggleVisit={() => setVisitMode((prev) => !prev)}
          onOpenQr={() => setQrOpen(true)}
        />

        <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="flex flex-col gap-4">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-3xl border bg-white/70 px-4 sm:px-6 py-4 backdrop-blur">
              <div className="space-y-1">
                <p className="text-xs uppercase text-muted-foreground tracking-[0.2em]">
                  Família
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Painel semanal</h1>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm capitalize text-muted-foreground">{humanDate}</p>
                <p className="text-3xl sm:text-4xl font-semibold tabular-nums">{format(clock, 'HH:mm')}</p>
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
                  <CardDescription className="text-destructive">{error}</CardDescription>
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

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Badge variant="muted" className="text-xs">
                  <Clock3 className="mr-1.5 h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Semana atual • </span>
                  {format(weekDays[0], 'dd/MM')}–{format(addDays(weekDays[0], 6), 'dd/MM')}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                  {visitLabel}
                </Badge>
              </div>
              <div className="flex gap-2">
                <span className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'cursor-default text-xs sm:text-sm')}>
                  {viewMode === 'calendar' ? 'Calendário semanal' : 'Rotinas das crianças'}
                </span>
              </div>
            </div>

            <div className="flex-1">
              {viewMode === 'calendar' ? (
                <CalendarGrid loading={loading} days={calendarByDay} people={data?.people ?? []} />
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
    <aside className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur lg:static lg:w-20 lg:rounded-3xl lg:border lg:border-t lg:shadow-sm">
      <div className="flex justify-around px-4 py-2 lg:flex-col lg:items-center lg:gap-2 lg:px-3 lg:py-4">
        {items.map((item) => (
          <Tooltip key={item.key}>
            <TooltipTrigger asChild>
              <Button
                variant={active === item.key ? 'default' : 'ghost'}
                size="icon"
                aria-pressed={active === item.key}
                onClick={() => onChange(item.key)}
                className={cn(
                  'h-14 w-14 rounded-2xl lg:h-12 lg:w-12',
                  active === item.key ? 'shadow-lg shadow-primary/10' : 'hover:bg-muted',
                  'active:scale-95 transition-transform tap-highlight-transparent'
                )}
              >
                {item.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="lg:side-right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator className="hidden lg:block lg:my-2 lg:w-10" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-2xl lg:h-12 lg:w-12 active:scale-95 transition-transform"
            onClick={onOpenQr}
          >
            <QrCode className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="lg:side-right">Editar via QR</TooltipContent>
      </Tooltip>

      <div className="flex items-center gap-2 rounded-2xl bg-muted/50 p-2 lg:mt-auto lg:flex-col lg:p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground lg:text-[11px]">
          Visitas
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{dayName}</p>
                    <p className="text-2xl font-semibold leading-tight">{format(date, 'dd')}</p>
                  </div>
                  <Badge variant="muted">
                    {items.length} evento{items.length === 1 ? '' : 's'}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  {loading ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl border border-border/60 p-3">
                          <Skeleton className="mt-1 h-3 w-3 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </>
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
                          <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: dotColor }} />
                          <div className="space-y-1">
                            <p className="text-sm font-semibold leading-snug">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.timeText}{' '}
                              {person ? (
                                <span className="text-[11px] font-semibold text-foreground/80">• {person.name}</span>
                              ) : null}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {overflow > 0 ? (
                    <p className="text-xs font-semibold text-muted-foreground">+{overflow} restantes</p>
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
          <CardDescription>Rotinas e nomes sensíveis ocultos. Desative para marcar atividades das crianças.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {people.map((kid) => {
        const kidTemplates = templates.filter((t) => t.personId === kid.id && t.isActive);
        const completedIds = checks
          .filter((c: any) => c.date === todayKey && c.completed)
          .map((c: any) => c.templateId);

        return (
          <Card key={kid.id} className="border border-border/60 bg-white/80">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: kid.color }} aria-hidden />
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
                          done ? 'border-emerald-500 bg-white text-emerald-600' : 'border-border bg-muted text-muted-foreground'
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

function RightColumn({ data, loading }: { data: any; loading: boolean }) {
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
    <div className="flex flex-col gap-3 lg:sticky lg:top-5">
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
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border px-3 py-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
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
                <p className="text-xs text-muted-foreground">+{replenish.length - 4} itens escondidos</p>
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
            const note = data?.homeschoolNotes.find((n: any) => n.kidPersonId === kidId);
            const topics = note?.notes ?? [];
            const overflow = Math.max(topics.length - 6, 0);
            const name = data?.people.find((p: Person) => p.id === kidId)?.name || kidId.charAt(0).toUpperCase() + kidId.slice(1);

            return (
              <div key={kidId} className="mb-4 last:mb-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: homeschoolColors[kidId] }} />
                  <p className="text-sm font-semibold">{name}</p>
                </div>
                {loading ? (
                  <ul className="space-y-1">
                    {[1, 2, 3].map((i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Skeleton className="mt-1 h-1.5 w-1.5 rounded-full" />
                        <Skeleton className="h-4 flex-1" />
                      </li>
                    ))}
                  </ul>
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
                      <li className="text-xs font-semibold text-muted-foreground">+{overflow} itens adicionais</li>
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

function QrModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const editLink = `${window.location.origin}/editar`;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const qrSize = isMobile ? 280 : 220;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar pelo celular</DialogTitle>
          <DialogDescription>
            Aponte a câmera para o QR ou abra o link para acessar /editar com login Supabase.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-3xl border bg-white p-4 shadow-inner">
            <QRCodeCanvas value={editLink} size={qrSize} className="w-full h-auto max-w-[280px]" />
          </div>
          <a
            href="/editar"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full justify-center')}
          >
            <Edit3 className="mr-2 h-5 w-5" />
            Abrir /editar
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default App;
