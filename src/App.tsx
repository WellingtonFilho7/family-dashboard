import {
  Check,
  Clock3,
  Edit3,
  Moon,
  QrCode,
  Sun,
  WifiOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRCodeCanvas } from 'qrcode.react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
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
  Skeleton,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components';
import { getDesktopOverrideFromSearch, resolveDesktopOverride } from '@/lib/desktop-override';
import { isDebugEnabled } from '@/lib/debug-utils';
import { getFamilyDateKey } from '@/lib/date-utils';
import { getVisibleWithOverflow } from '@/lib/list-utils';
import { cn } from '@/lib/utils';
import type { CalendarItem, KidRoutineCheck, KidRoutineTemplate, Person } from '@/lib/types';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useDarkMode } from '@/hooks/useDarkMode';
import EditPage from '@/pages/EditPage';

function App() {
  return (
    <BrowserRouter>
      <DesktopOverrideProvider>
        <TooltipProvider delayDuration={0}>
          <Routes>
            <Route path="/painel" element={<PanelPage />} />
            <Route path="/editar" element={<EditPage />} />
            <Route path="*" element={<Navigate to="/painel" replace />} />
          </Routes>
          <DebugOverlay />
          <Toaster position="top-right" richColors closeButton />
        </TooltipProvider>
      </DesktopOverrideProvider>
    </BrowserRouter>
  );
}

const DESKTOP_OVERRIDE_STORAGE_KEY = 'family-dashboard:desktop-override';
const DesktopOverrideContext = createContext(false);

const useDesktopOverride = () => {
  const location = useLocation();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromSearch = getDesktopOverrideFromSearch(location.search);
    const stored = window.localStorage.getItem(DESKTOP_OVERRIDE_STORAGE_KEY);
    const nextEnabled = resolveDesktopOverride(location.search, stored);
    setEnabled(nextEnabled);

    if (fromSearch !== null) {
      window.localStorage.setItem(
        DESKTOP_OVERRIDE_STORAGE_KEY,
        nextEnabled ? '1' : '0'
      );
    }
  }, [location.search]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (enabled) {
      document.documentElement.dataset.desktop = '1';
    } else {
      delete document.documentElement.dataset.desktop;
    }
  }, [enabled]);

  return enabled;
};

const useDesktopOverrideValue = () => useContext(DesktopOverrideContext);

function DesktopOverrideProvider({ children }: { children: ReactNode }) {
  const enabled = useDesktopOverride();
  return (
    <DesktopOverrideContext.Provider value={enabled}>
      {children}
    </DesktopOverrideContext.Provider>
  );
}

const getDebugInfo = () => {
  if (typeof window === 'undefined') {
    return {
      innerWidth: 0,
      innerHeight: 0,
      screenWidth: 0,
      screenHeight: 0,
      dpr: 1,
      vvWidth: null as number | null,
      vvHeight: null as number | null,
      vvScale: null as number | null,
      userAgent: 'unknown',
    };
  }

  const vv = window.visualViewport;
  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    screenWidth: window.screen?.width ?? 0,
    screenHeight: window.screen?.height ?? 0,
    dpr: window.devicePixelRatio ?? 1,
    vvWidth: vv?.width ?? null,
    vvHeight: vv?.height ?? null,
    vvScale: vv?.scale ?? null,
    userAgent: navigator.userAgent,
  };
};

function DebugOverlay() {
  const location = useLocation();
  const enabled = useMemo(
    () => isDebugEnabled(location.search),
    [location.search]
  );
  const [info, setInfo] = useState(getDebugInfo);

  useEffect(() => {
    if (!enabled) return;
    const update = () => setInfo(getDebugInfo());
    update();

    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);

    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-[92vw] pointer-events-none rounded-xl bg-black/80 p-3 text-xs text-white shadow-xl">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Debug</p>
      <div className="mt-2 space-y-1 font-mono">
        <p>
          viewport: {Math.round(info.innerWidth)}x{Math.round(info.innerHeight)}
        </p>
        <p>
          screen: {info.screenWidth}x{info.screenHeight}
        </p>
        <p>dpr: {info.dpr}</p>
        {info.vvWidth && info.vvHeight ? (
          <p>
            visualViewport: {Math.round(info.vvWidth)}x{Math.round(info.vvHeight)} scale {info.vvScale}
          </p>
        ) : null}
        <p className="break-all text-white/70">ua: {info.userAgent}</p>
      </div>
    </div>
  );
}

function PanelPage() {
  const desktopOverride = useDesktopOverrideValue();
  const [visitMode, setVisitMode] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [qrOpen, setQrOpen] = useState(false);
  const { data, loading, calendarByDay, weekDays, routineChecks, toggleRoutine, isMock, isProd, isStale, error } =
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
    <div className={cn(
      'min-h-screen px-3 py-3 pb-24 md:px-4 md:pb-4 xl:h-screen xl:overflow-hidden xl:pb-3',
      desktopOverride && 'h-screen overflow-hidden pb-3'
    )}>
      <div
        className={cn(
          'flex flex-col gap-4 lg:flex-row xl:gap-2 xl:h-full',
          desktopOverride && 'flex-row gap-2 h-full'
        )}
      >
        <Sidebar
          visitMode={visitMode}
          onToggleVisit={() => setVisitMode((prev) => !prev)}
          onOpenQr={() => setQrOpen(true)}
        />

        <div
          className={cn(
            'grid flex-1 grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 xl:gap-2',
            desktopOverride && 'grid-cols-[1fr_280px] gap-2'
          )}
        >
          <div className={cn(
            'flex flex-col gap-3 xl:gap-2 xl:min-h-0',
            desktopOverride && 'gap-2 min-h-0'
          )}>
            {/* Header — compact, with verse merged on xl */}
            <header className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-2.5 xl:py-2">
              <div className="space-y-0.5 shrink-0">
                <p className="text-[10px] uppercase text-muted-foreground tracking-[0.2em]">
                  Família
                </p>
                <h1 className="text-xl xl:text-2xl font-bold leading-tight">Painel semanal</h1>
              </div>
              {focus ? (
                <div className={cn(
                  'hidden xl:flex flex-col items-center max-w-[45%] text-center px-3',
                  desktopOverride && 'flex'
                )}>
                  <p className="text-sm font-medium text-foreground/80 line-clamp-1">{focus.text}</p>
                  {focus.reference ? (
                    <p className="text-xs text-primary font-medium">{focus.reference}</p>
                  ) : null}
                </div>
              ) : null}
              <div className="text-right shrink-0">
                <p className="text-xs capitalize text-muted-foreground">{humanDate}</p>
                <p className="text-2xl xl:text-4xl font-semibold tabular-nums leading-tight">{format(clock, 'HH:mm')}</p>
              </div>
            </header>

            {/* Verse card — mobile/tablet only */}
            {focus ? (
              <Card className={cn(
                'border-dashed bg-card xl:hidden',
                desktopOverride && 'hidden'
              )}>
                <CardHeader className="flex flex-row items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground tracking-wide">
                      Versículo / Foco da semana
                    </p>
                    <CardTitle className="text-lg font-medium leading-snug line-clamp-2">
                      {focus.text}
                    </CardTitle>
                    {focus.reference ? (
                      <CardDescription className="mt-1 text-sm font-medium text-primary">
                        {focus.reference}
                      </CardDescription>
                    ) : null}
                  </div>
                </CardHeader>
              </Card>
            ) : null}

            {error && isProd && (
              <Card className="border-destructive/60 bg-destructive/10">
                <CardHeader className="py-2">
                  <CardDescription className="text-destructive">{error}</CardDescription>
                </CardHeader>
              </Card>
            )}
            {isMock && (
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <CardHeader className="py-2">
                  <CardDescription className="text-amber-700 dark:text-amber-400">
                    Modo mock — dados não são reais.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
            {isStale && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-800 dark:bg-amber-950">
                <WifiOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-700 dark:text-amber-400">Dados em cache — offline</p>
              </div>
            )}

            {/* Week badges — mobile only */}
            <div className={cn(
              'flex flex-wrap items-center gap-2 xl:hidden',
              desktopOverride && 'hidden'
            )}>
              <Badge variant="muted" className="text-xs">
                <Clock3 className="mr-1.5 h-3.5 w-3.5" />
                {format(weekDays[0], 'dd/MM')}–{format(addDays(weekDays[0], 6), 'dd/MM')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {visitLabel}
              </Badge>
            </div>

            <ErrorBoundary sectionName="Calendário">
              <CalendarGrid loading={loading} days={calendarByDay} people={data?.people ?? []} />
            </ErrorBoundary>

            <ErrorBoundary sectionName="Rotinas">
              <KidsGrid
                people={activeKids}
                templates={data?.kidRoutineTemplates ?? []}
                checks={routineChecks}
                onToggle={handleToggleRoutine}
                visitMode={visitMode}
              />
            </ErrorBoundary>
          </div>

          <ErrorBoundary sectionName="Coluna lateral">
            <RightColumn loading={loading} data={data} />
          </ErrorBoundary>
        </div>
      </div>

      <QrModal open={qrOpen} onOpenChange={setQrOpen} />
    </div>
  );
}

function Sidebar({
  visitMode,
  onToggleVisit,
  onOpenQr,
}: {
  visitMode: boolean;
  onToggleVisit: () => void;
  onOpenQr: () => void;
}) {
  const desktopOverride = useDesktopOverrideValue();
  const [dark, toggleDark] = useDarkMode();

  return (
    <aside
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t bg-card lg:static lg:w-20 lg:rounded-lg lg:border lg:border-t',
        desktopOverride && 'static w-20 rounded-lg border border-t'
      )}
    >
      <div
        className={cn(
          'flex justify-around items-center px-4 py-2 lg:flex-col lg:items-center lg:gap-2 lg:px-3 lg:py-4',
          desktopOverride && 'flex-col items-center gap-2 px-3 py-4 justify-start'
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-14 w-14 rounded-lg lg:h-12 lg:w-12 active:scale-95 transition-transform',
                desktopOverride && 'h-12 w-12'
              )}
              onClick={onOpenQr}
            >
              <QrCode className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="lg:side-right">Editar via QR</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-14 w-14 rounded-lg lg:h-12 lg:w-12 active:scale-95 transition-transform',
                desktopOverride && 'h-12 w-12'
              )}
              onClick={toggleDark}
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="lg:side-right">{dark ? 'Modo claro' : 'Modo escuro'}</TooltipContent>
        </Tooltip>

        <div
          className={cn(
            'flex items-center gap-2 rounded-lg bg-muted/50 p-2 lg:mt-auto lg:flex-col lg:p-3',
            desktopOverride && 'mt-auto flex-col p-3'
          )}
        >
          <p
            className={cn(
              'text-[10px] font-medium uppercase tracking-wide text-muted-foreground lg:text-[11px]',
              desktopOverride && 'text-[11px]'
            )}
          >
            Visitas
          </p>
          <Switch checked={visitMode} onCheckedChange={onToggleVisit} />
        </div>
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
  const desktopOverride = useDesktopOverrideValue();
  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const fallbackColor = '#0EA5E9';

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7',
        desktopOverride && 'grid-cols-7'
      )}
    >
      {days.map(({ date, items }) => {
        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        const maxEvents = 3;
        const overflow = Math.max(items.length - maxEvents, 0);
        return (
          <div
            key={formatISO(date)}
            className="rounded-lg border bg-card p-3 xl:p-2"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-baseline gap-1.5">
                <p className="text-[10px] xl:text-xs uppercase tracking-wide text-muted-foreground">{dayName}</p>
                <p className="text-xl xl:text-2xl font-semibold leading-tight">{format(date, 'dd')}</p>
              </div>
              {items.length > 0 && (
                <span className="text-[10px] text-muted-foreground">{items.length}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              {loading ? (
                <Skeleton className="h-4 w-full" />
              ) : items.length === 0 ? (
                <p className="text-xs text-muted-foreground">—</p>
              ) : (
                items.slice(0, maxEvents).map((item) => {
                  const person = personById.get(item.personId);
                  const dotColor = person?.color ?? item.personColor ?? fallbackColor;
                  return (
                    <div key={item.id} className="flex items-center gap-1.5 min-w-0">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
                      <p className="text-xs xl:text-sm truncate">
                        <span className="font-medium">{item.title}</span>
                        {item.timeText ? (
                          <span className="text-muted-foreground"> · {item.timeText}</span>
                        ) : null}
                      </p>
                    </div>
                  );
                })
              )}
              {overflow > 0 ? (
                <p className="text-[10px] text-muted-foreground">+{overflow}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
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
  const desktopOverride = useDesktopOverrideValue();
  const todayKey = getFamilyDateKey();

  if (visitMode) {
    return (
      <Card className="border-dashed bg-card">
        <CardHeader>
          <CardTitle>Modo visitas</CardTitle>
          <CardDescription>Rotinas e nomes sensíveis ocultos. Desative para marcar atividades das crianças.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className={cn(
      'grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] xl:grid-cols-4 gap-2',
      desktopOverride && 'grid-cols-4'
    )}>
      {people.map((kid) => {
        const kidTemplates = templates.filter((t) => t.personId === kid.id && t.isActive);
        const completedIds = checks
          .filter((c: any) => c.date === todayKey && c.completed)
          .map((c: any) => c.templateId);
        const { visible: visibleRoutines, overflow: routineOverflow } = getVisibleWithOverflow(kidTemplates, 5);

        return (
          <Card key={kid.id} className="border bg-card">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-3 xl:py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: kid.color }} aria-hidden />
                <CardTitle className="text-sm xl:text-base">{kid.name}</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">
                {completedIds.length}/{kidTemplates.length || 1}
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 px-3 pb-3 xl:gap-1 xl:pb-2">
              {kidTemplates.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem rotinas</p>
              ) : (
                visibleRoutines.map((routine) => {
                  const done = completedIds.includes(routine.id);
                  return (
                    <button
                      key={routine.id}
                      type="button"
                      onClick={() => onToggle(routine.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-md border px-2.5 py-2 xl:py-1.5 text-left text-sm xl:text-base font-medium transition-all active:scale-[0.98]',
                        done
                          ? 'border-emerald-500/50 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'border-border bg-card hover:bg-muted/30 active:bg-muted/50'
                      )}
                    >
                      <span
                        className={cn(
                          'grid h-6 w-6 xl:h-7 xl:w-7 shrink-0 place-items-center rounded-full border-2',
                          done ? 'border-emerald-500 bg-white text-emerald-600 dark:bg-emerald-900' : 'border-border bg-muted text-muted-foreground'
                        )}
                      >
                        <Check className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
                      </span>
                      <span className="truncate">{routine.title}</span>
                    </button>
                  );
                })
              )}
              {kidTemplates.length > 0 && routineOverflow > 0 ? (
                <p className="text-[10px] text-muted-foreground">+{routineOverflow}</p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RightColumn({ data, loading }: { data: any; loading: boolean }) {
  const desktopOverride = useDesktopOverrideValue();
  const replenish = useMemo(() => {
    if (!data) return [];
    const urgentFirst = [...data.replenishItems].sort((a, b) =>
      a.urgency === b.urgency ? 0 : a.urgency === 'now' ? -1 : 1
    );
    return urgentFirst.filter((item) => item.isActive);
  }, [data]);

  const kids = useMemo(
    () => (data?.people ?? []).filter((p: Person) => p.type === 'kid'),
    [data?.people]
  );

  return (
    <div
      className={cn(
        'flex flex-col gap-2 lg:sticky lg:top-3 xl:overflow-auto xl:max-h-full',
        desktopOverride && 'sticky top-3 overflow-auto max-h-full'
      )}
    >
      <Card className="bg-card">
        <CardHeader className="py-2.5 px-3 xl:py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm xl:text-base">Reposição</CardTitle>
            <span className="text-xs text-muted-foreground">{replenish.length}</span>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 xl:pb-2">
          {loading ? (
            <Skeleton className="h-4 w-full" />
          ) : replenish.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nada pendente.</p>
          ) : (
            <div className="space-y-1">
              {replenish.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center justify-between rounded-md border px-2.5 py-1.5',
                    item.urgency === 'now'
                      ? 'border-destructive/60 bg-destructive/10 text-destructive'
                      : 'border-amber-400/60 bg-amber-50 text-amber-700 dark:border-amber-600/60 dark:bg-amber-950 dark:text-amber-400'
                  )}
                >
                  <span className="text-sm font-medium truncate">{item.title}</span>
                  <Badge variant="outline" className="border-current text-[10px] px-1.5 py-0">
                    {item.urgency === 'now' ? 'Agora' : 'Breve'}
                  </Badge>
                </div>
              ))}
              {replenish.length > 8 ? (
                <p className="text-[10px] text-muted-foreground">+{replenish.length - 8} mais</p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="py-2.5 px-3 xl:py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm xl:text-base">Homeschool</CardTitle>
            <span className="text-xs text-muted-foreground">{kids.length} kids</span>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 xl:pb-2">
          {kids.map((kid: Person) => {
            const note = data?.homeschoolNotes.find((n: any) => n.kidPersonId === kid.id);
            const topics = note?.notes ?? [];
            const overflow = Math.max(topics.length - 6, 0);

            return (
              <div key={kid.id} className="mb-2.5 last:mb-0">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: kid.color }} />
                  <p className="text-sm font-medium">{kid.name}</p>
                </div>
                {loading ? (
                  <Skeleton className="h-3 w-full" />
                ) : topics.length === 0 ? (
                  <p className="text-xs text-muted-foreground">—</p>
                ) : (
                  <ul className="space-y-0.5 text-xs xl:text-sm text-foreground">
                    {topics.slice(0, 6).map((topic: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                        <span className="leading-snug">{topic}</span>
                      </li>
                    ))}
                    {overflow > 0 ? (
                      <li className="text-[10px] text-muted-foreground">+{overflow}</li>
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
          <div className="rounded-lg border bg-card p-4">
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
