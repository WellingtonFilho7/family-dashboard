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
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { addDays, format, formatISO, isSameDay } from 'date-fns';
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
        <Routes>
          <Route path="/painel" element={<PanelPage />} />
          <Route path="/editar" element={<EditPage />} />
          <Route path="*" element={<Navigate to="/painel" replace />} />
        </Routes>
        <DebugOverlay />
        <Toaster position="top-right" richColors />
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
  const hour = clock.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const humanDate = clock.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <div className={cn(
      'min-h-screen px-3 py-3 pb-24 md:px-4 md:pb-4 xl:h-screen xl:overflow-hidden xl:p-4',
      desktopOverride && 'h-screen overflow-hidden p-4 pb-4'
    )}>
      {/* Mobile: col, xl: row with sidebar */}
      <div className={cn(
        'flex flex-col gap-3 lg:flex-row xl:h-full xl:gap-4',
        desktopOverride && 'flex-row h-full gap-4'
      )}>
        <Sidebar
          visitMode={visitMode}
          onToggleVisit={() => setVisitMode((prev) => !prev)}
          onOpenQr={() => setQrOpen(true)}
        />

        {/* Content: header + body */}
        <div className={cn(
          'flex flex-1 flex-col gap-3 xl:min-h-0',
          desktopOverride && 'min-h-0'
        )}>
          {/* Header */}
          <header className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 shrink-0">
            <div className="shrink-0">
              <p className="text-sm xl:text-lg font-medium text-muted-foreground">{greeting}</p>
              <h1 className="text-base xl:text-xl font-bold capitalize leading-tight">{humanDate}</h1>
            </div>
            {focus ? (
              <div className={cn(
                'hidden xl:flex flex-col items-center max-w-[50%] text-center px-4',
                desktopOverride && 'flex'
              )}>
                <p className="text-sm xl:text-base font-medium text-foreground/80 line-clamp-2">{focus.text}</p>
                {focus.reference ? (
                  <p className="text-xs xl:text-sm text-primary font-medium">{focus.reference}</p>
                ) : null}
              </div>
            ) : null}
            <div className="text-right shrink-0">
              <p className="text-2xl xl:text-5xl font-semibold tabular-nums leading-tight">{format(clock, 'HH:mm')}</p>
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

          {/* Status banners */}
          {error && isProd && (
            <Card className="border-destructive/60 bg-destructive/10 shrink-0">
              <CardHeader className="py-2">
                <CardDescription className="text-destructive">{error}</CardDescription>
              </CardHeader>
            </Card>
          )}
          {isMock && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 shrink-0">
              <CardHeader className="py-2">
                <CardDescription className="text-amber-700 dark:text-amber-400">
                  Modo mock — dados não são reais.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          {isStale && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-800 dark:bg-amber-950 shrink-0">
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

          {/* Body: calendar + right panel side by side on xl */}
          <div className={cn(
            'flex flex-col gap-3 xl:flex-row xl:flex-1 xl:min-h-0 xl:gap-4',
            desktopOverride && 'flex-row flex-1 min-h-0 gap-4'
          )}>
            {/* Calendar: fills available width and height on xl */}
            <div className={cn(
              'xl:flex-1 xl:min-w-0 xl:flex xl:flex-col',
              desktopOverride && 'flex-1 min-w-0 flex flex-col'
            )}>
              <ErrorBoundary sectionName="Calendário">
                <CalendarGrid loading={loading} days={calendarByDay} people={data?.people ?? []} />
              </ErrorBoundary>
            </div>

            {/* Right panel: kids + replenish + homeschool */}
            <div className={cn(
              'flex flex-col gap-3 xl:w-[360px] xl:shrink-0 xl:overflow-y-auto',
              desktopOverride && 'w-[360px] shrink-0 overflow-y-auto'
            )}>
              <ErrorBoundary sectionName="Rotinas">
                <KidsGrid
                  people={activeKids}
                  templates={data?.kidRoutineTemplates ?? []}
                  checks={routineChecks}
                  onToggle={handleToggleRoutine}
                  visitMode={visitMode}
                />
              </ErrorBoundary>

              <ErrorBoundary sectionName="Coluna lateral">
                <RightColumn loading={loading} data={data} />
              </ErrorBoundary>
            </div>
          </div>
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
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-14 w-14 rounded-lg lg:h-12 lg:w-12 active:scale-95 transition-transform',
            desktopOverride && 'h-12 w-12'
          )}
          onClick={onOpenQr}
          aria-label="Editar via QR"
        >
          <QrCode className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-14 w-14 rounded-lg lg:h-12 lg:w-12 active:scale-95 transition-transform',
            desktopOverride && 'h-12 w-12'
          )}
          onClick={toggleDark}
          aria-label={dark ? 'Modo claro' : 'Modo escuro'}
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

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

const CALENDAR_AUTO_RESET_MS = 60_000;
const TIMELINE_START_HOUR = 7;
const TIMELINE_END_HOUR = 22;
const TIMELINE_VISIBLE_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
const TIMELINE_HEIGHT_PX = 300;
const TIMELINE_ITEM_HEIGHT_PX = 34;
const TIMELINE_STACK_GAP_PX = 6;

function parseHour(timeText: string | null): number | null {
  if (!timeText) return null;

  const normalized = timeText.trim().toLowerCase();
  const match =
    normalized.match(/(?:^|[^0-9])(\d{1,2})\s*(?:h|:)\s*(\d{0,2})(?:\b|[^0-9])/) ??
    normalized.match(/^(\d{1,2})$/);
  if (!match) return null;

  const hour = Number.parseInt(match[1], 10);
  const minute = match[2] ? Number.parseInt(match[2], 10) : 0;
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return hour + minute / 60;
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
  const fallbackColor = '#0EA5E9';
  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const todayInWeek = useMemo(
    () => days.find(({ date }) => isSameDay(date, new Date()))?.date ?? days[0]?.date ?? new Date(),
    [days]
  );
  const [selectedDay, setSelectedDay] = useState<Date>(todayInWeek);
  const resetTimerRef = useRef<number | null>(null);

  const resolveItemColors = useCallback((item: CalendarItem) => {
    if (item.personColors.length > 0) return item.personColors;
    if (item.personIds.length > 0) {
      return item.personIds.map((pid) => personById.get(pid)?.color ?? fallbackColor);
    }
    return [fallbackColor];
  }, [personById, fallbackColor]);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const startResetTimer = useCallback(() => {
    clearResetTimer();
    resetTimerRef.current = window.setTimeout(() => {
      setSelectedDay(todayInWeek);
    }, CALENDAR_AUTO_RESET_MS);
  }, [clearResetTimer, todayInWeek]);

  const selectDay = useCallback((date: Date) => {
    setSelectedDay(date);
    startResetTimer();
  }, [startResetTimer]);

  useEffect(() => {
    startResetTimer();
    return clearResetTimer;
  }, [startResetTimer, clearResetTimer]);

  const selectedDayInView = useMemo(() => {
    const stillVisible = days.some(({ date }) => isSameDay(date, selectedDay));
    return stillVisible ? selectedDay : todayInWeek;
  }, [days, selectedDay, todayInWeek]);

  return (
    <div
      className={desktopOverride
        ? 'flex flex-1 gap-2 overflow-hidden xl:h-full'
        : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:h-full xl:flex-1 xl:gap-2 xl:overflow-hidden'}
    >
      {days.map(({ date, items }) => {
        const isToday = isSameDay(date, todayInWeek);
        const isSelected = isSameDay(date, selectedDayInView);
        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        const maxEvents = 8;
        const overflow = Math.max(items.length - maxEvents, 0);
        const compactDots = items.flatMap((item) =>
          resolveItemColors(item).map((color, index) => ({
            key: `${item.id}-compact-${index}`,
            color,
          }))
        );
        const itemHours = items.map((item) => ({ item, hour: parseHour(item.timeText) }));
        const untimedItems = itemHours.filter(({ hour }) => hour === null).map(({ item }) => item);
        const timedGroupsMap = new Map<string, { item: CalendarItem; hour: number }[]>();
        itemHours
          .filter((entry): entry is { item: CalendarItem; hour: number } => entry.hour !== null)
          .sort((a, b) => a.hour - b.hour)
          .forEach((entry) => {
            const key = entry.hour.toFixed(3);
            const existing = timedGroupsMap.get(key) ?? [];
            existing.push(entry);
            timedGroupsMap.set(key, existing);
          });
        const timedGroups = Array.from(timedGroupsMap.values()).sort((a, b) => a[0].hour - b[0].hour);

        return (
          <div
            key={formatISO(date)}
            onClick={() => selectDay(date)}
            className={cn(
              'flex min-h-[160px] cursor-pointer flex-col rounded-lg border bg-card p-3',
              isToday && 'ring-1 ring-primary/40',
              desktopOverride && isSelected && 'ring-2 ring-primary/40 bg-primary/5 dark:bg-primary/10',
              !desktopOverride && isSelected && 'xl:ring-2 xl:ring-primary/40 xl:bg-primary/5 dark:xl:bg-primary/10',
              desktopOverride
                ? (isSelected ? 'flex-[3]' : 'flex-[1] overflow-hidden')
                : (isSelected ? 'xl:flex-[3]' : 'xl:flex-[1] xl:overflow-hidden'),
              'xl:min-w-0 xl:h-full'
            )}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectDay(date);
              }
            }}
          >
            <div className="flex items-baseline gap-1.5 mb-2">
              <p className={cn(
                'text-xs xl:text-sm uppercase tracking-wide',
                isSelected ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}>{dayName}</p>
              <p className={cn(
                'text-2xl xl:text-3xl font-semibold leading-tight',
                isSelected && 'text-primary'
              )}>{format(date, 'dd')}</p>
            </div>

            {!desktopOverride && (
              <div className="flex flex-1 flex-col gap-1.5 xl:hidden">
                {loading ? (
                  <Skeleton className="h-4 w-full" />
                ) : items.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50">—</p>
                ) : (
                  items.slice(0, maxEvents).map((item) => (
                    <div key={item.id} className="flex items-center gap-1.5 min-w-0">
                      <div className="flex shrink-0 items-center gap-1">
                        {resolveItemColors(item).map((color, index) => (
                          <span
                            key={`${item.id}-mobile-${index}`}
                            className="h-2 w-2 xl:h-3 xl:w-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <p className="text-sm xl:text-base truncate">
                        <span className="font-medium">{item.title}</span>
                        {item.timeText ? (
                          <span className="text-muted-foreground"> · {item.timeText}</span>
                        ) : null}
                      </p>
                    </div>
                  ))
                )}
                {overflow > 0 ? (
                  <p className="text-xs text-muted-foreground">+{overflow}</p>
                ) : null}
              </div>
            )}

            {isSelected ? (
              <div className={cn('flex-1 space-y-2', !desktopOverride && 'hidden xl:block')}>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-[180px] w-full" />
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50">—</p>
                ) : (
                  <>
                    {untimedItems.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Sem horário
                        </p>
                        {untimedItems.map((item) => (
                          <div key={`${item.id}-untimed`} className="flex items-center gap-1.5 min-w-0">
                            <div className="flex shrink-0 items-center gap-1">
                              {resolveItemColors(item).map((color, index) => (
                                <span
                                  key={`${item.id}-untimed-${index}`}
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <p className="truncate text-sm">
                              <span className="font-medium">{item.title}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {(() => {
                      const timedLayouts = timedGroups.map((group, groupIndex) => {
                        const groupHour = group[0]?.hour ?? TIMELINE_START_HOUR;
                        const relativeHour = Math.max(
                          0,
                          Math.min(TIMELINE_VISIBLE_HOURS, groupHour - TIMELINE_START_HOUR)
                        );
                        const topPx =
                          (relativeHour / TIMELINE_VISIBLE_HOURS) * TIMELINE_HEIGHT_PX;
                        const groupHeight =
                          group.length * TIMELINE_ITEM_HEIGHT_PX +
                          Math.max(0, group.length - 1) * TIMELINE_STACK_GAP_PX;

                        return {
                          group,
                          groupHour,
                          groupIndex,
                          topPx,
                          groupHeight,
                        };
                      });

                      const positionedLayouts = timedLayouts.map((layout) => ({ ...layout, topPx: layout.topPx }));
                      const betweenGroupsGap = 4;
                      let cursorBottom = 0;
                      positionedLayouts.forEach((layout) => {
                        const minTop = cursorBottom > 0 ? cursorBottom + betweenGroupsGap : 0;
                        layout.topPx = Math.max(layout.topPx, minTop);
                        cursorBottom = layout.topPx + layout.groupHeight;
                      });

                      const lastBottom = positionedLayouts.length
                        ? positionedLayouts[positionedLayouts.length - 1].topPx +
                          positionedLayouts[positionedLayouts.length - 1].groupHeight
                        : TIMELINE_HEIGHT_PX;
                      const overflowDelta = Math.max(0, lastBottom - TIMELINE_HEIGHT_PX);
                      const canShiftWithoutScroll =
                        positionedLayouts.length === 0 ||
                        positionedLayouts[0].topPx - overflowDelta >= 0;

                      if (overflowDelta > 0 && canShiftWithoutScroll) {
                        positionedLayouts.forEach((layout) => {
                          layout.topPx -= overflowDelta;
                        });
                      }

                      const lastBottomAfterShift = positionedLayouts.length
                        ? positionedLayouts[positionedLayouts.length - 1].topPx +
                          positionedLayouts[positionedLayouts.length - 1].groupHeight
                        : TIMELINE_HEIGHT_PX;
                      const needsScroll = lastBottomAfterShift > TIMELINE_HEIGHT_PX;
                      const requiredHeight = needsScroll
                        ? Math.max(TIMELINE_HEIGHT_PX, lastBottomAfterShift + 8)
                        : TIMELINE_HEIGHT_PX;

                      return (
                        <div className={cn(
                          'h-[300px] rounded-md border bg-muted/20',
                          needsScroll ? 'overflow-y-auto' : 'overflow-hidden'
                        )}>
                          <div className="relative min-h-[300px]" style={{ height: `${requiredHeight}px` }}>
                            <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-border/50" />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-dashed border-border/50" />
                            <p className="pointer-events-none absolute left-2 top-1 text-[10px] uppercase text-muted-foreground">
                              07:00
                            </p>
                            <p className="pointer-events-none absolute left-2 bottom-1 text-[10px] uppercase text-muted-foreground">
                              22:00
                            </p>

                            {positionedLayouts.length === 0 ? (
                              <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                Sem eventos com horário
                              </p>
                            ) : (
                              positionedLayouts.map((layout) => (
                                <div
                                  key={`timed-group-${layout.groupIndex}-${layout.groupHour}`}
                                  className="absolute left-2 right-2 space-y-1.5"
                                  style={{ top: `${layout.topPx}px` }}
                                >
                                  {layout.group.map(({ item }, stackIndex) => (
                                    <div
                                      key={`${item.id}-timed-${stackIndex}`}
                                      className="rounded-md border bg-card/95 px-2 py-1 shadow-sm min-h-[34px]"
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="flex shrink-0 items-center gap-1">
                                          {resolveItemColors(item).map((color, index) => (
                                            <span
                                              key={`${item.id}-timed-${index}`}
                                              className="h-2.5 w-2.5 rounded-full"
                                              style={{ backgroundColor: color }}
                                            />
                                          ))}
                                        </div>
                                        <p className="truncate text-xs xl:text-sm">
                                          <span className="font-medium">{item.title}</span>
                                          {item.timeText ? (
                                            <span className="text-muted-foreground"> · {item.timeText}</span>
                                          ) : null}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            ) : (
              <div className={cn('flex-1 overflow-hidden', !desktopOverride && 'hidden xl:block')}>
                {loading ? (
                  <Skeleton className="h-7 w-full" />
                ) : compactDots.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50">—</p>
                ) : (
                  <div className="flex max-h-full flex-wrap content-start gap-1 overflow-hidden pt-1">
                    {compactDots.map((dot) => (
                      <span
                        key={dot.key}
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: dot.color }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      {people.map((kid) => {
        const kidTemplates = templates.filter((t) => t.personId === kid.id && t.isActive);
        const completedIds = checks
          .filter((c: any) => c.date === todayKey && c.completed)
          .map((c: any) => c.templateId);
        const completedCount = kidTemplates.filter((t) => completedIds.includes(t.id)).length;
        const { visible: visibleRoutines, overflow: routineOverflow } = getVisibleWithOverflow(kidTemplates, 6);

        return (
          <Card key={kid.id} className="border bg-card">
            <CardHeader className="flex flex-row items-center justify-between py-2.5 px-3 xl:px-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 xl:h-4 xl:w-4 rounded-full" style={{ backgroundColor: kid.color }} aria-hidden />
                <CardTitle className="text-base xl:text-lg">{kid.name}</CardTitle>
              </div>
              {kidTemplates.length > 0 && (
                <div className="flex items-center gap-1">
                  {kidTemplates.map((t, i) => (
                    <span
                      key={t.id}
                      className={cn(
                        'h-2 w-2 xl:h-2.5 xl:w-2.5 rounded-full',
                        i < completedCount ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                      )}
                    />
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 xl:gap-2.5 px-3 pb-3 xl:px-4 xl:pb-4">
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
                        'flex items-center gap-2.5 rounded-md border px-3 py-2 xl:py-3 text-left text-sm xl:text-base font-medium transition-all active:scale-[0.98]',
                        done
                          ? 'border-emerald-500/50 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'border-border bg-card hover:bg-muted/30 active:bg-muted/50'
                      )}
                    >
                      <span
                        className={cn(
                          'grid h-6 w-6 xl:h-8 xl:w-8 shrink-0 place-items-center rounded-full border-2',
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
                <p className="text-xs text-muted-foreground">+{routineOverflow}</p>
              ) : null}
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

  const kids = useMemo(
    () => (data?.people ?? []).filter((p: Person) => p.type === 'kid'),
    [data?.people]
  );

  return (
    <div className="flex flex-col gap-3">
      <Card className="bg-card">
        <CardHeader className="py-2.5 px-3 xl:px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base xl:text-lg">Reposição</CardTitle>
            <span className="text-xs xl:text-sm text-muted-foreground">{replenish.length}</span>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 xl:px-4 xl:pb-4">
          {loading ? (
            <Skeleton className="h-4 w-full" />
          ) : replenish.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada pendente.</p>
          ) : (
            <div className="space-y-1.5">
              {replenish.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center justify-between rounded-md border px-3 py-1.5',
                    item.urgency === 'now'
                      ? 'border-destructive/60 bg-destructive/10 text-destructive'
                      : 'border-amber-400/60 bg-amber-50 text-amber-700 dark:border-amber-600/60 dark:bg-amber-950 dark:text-amber-400'
                  )}
                >
                  <span className="text-sm xl:text-base font-medium truncate">{item.title}</span>
                  <Badge variant="outline" className="border-current text-[10px] xl:text-xs px-1.5 py-0">
                    {item.urgency === 'now' ? 'Agora' : 'Breve'}
                  </Badge>
                </div>
              ))}
              {replenish.length > 8 ? (
                <p className="text-xs text-muted-foreground">+{replenish.length - 8} mais</p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="py-2.5 px-3 xl:px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base xl:text-lg">Homeschool</CardTitle>
            <span className="text-xs xl:text-sm text-muted-foreground">{kids.length} crianças</span>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 xl:px-4 xl:pb-4">
          {kids.map((kid: Person) => {
            const note = data?.homeschoolNotes.find((n: any) => n.kidPersonId === kid.id);
            const topics = note?.notes ?? [];
            const overflow = Math.max(topics.length - 6, 0);

            return (
              <div key={kid.id} className="mb-3 last:mb-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 xl:h-3.5 xl:w-3.5 rounded-full" style={{ backgroundColor: kid.color }} />
                  <p className="text-sm xl:text-base font-medium">{kid.name}</p>
                </div>
                {loading ? (
                  <Skeleton className="h-3 w-full" />
                ) : topics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">—</p>
                ) : (
                  <ul className="space-y-0.5 text-sm xl:text-base text-foreground">
                    {topics.slice(0, 6).map((topic: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                        <span className="leading-snug">{topic}</span>
                      </li>
                    ))}
                    {overflow > 0 ? (
                      <li className="text-xs text-muted-foreground">+{overflow}</li>
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
