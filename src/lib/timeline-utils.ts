import type { CalendarItem } from '@/lib/types';

export const TIMELINE_START_HOUR = 7;
export const TIMELINE_END_HOUR = 22;
export const TIMELINE_VISIBLE_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
const DEFAULT_EVENT_DURATION_HOURS = 1;

export type TimelineEntry = {
  item: CalendarItem;
  startHour: number;
  endHour: number;
  lane: number;
  laneCount: number;
  clippedBefore: boolean;
  clippedAfter: boolean;
};

export type TimelineAnalysis = {
  visibleEntries: TimelineEntry[];
  untimedItems: CalendarItem[];
  beforeWindowItems: CalendarItem[];
  afterWindowItems: CalendarItem[];
};

export function parseHour(timeText: string | null): number | null {
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

export function getItemTimeLabel(item: Pick<CalendarItem, 'startTime' | 'endTime' | 'timeText'>): string | null {
  if (item.startTime && item.endTime) return `${item.startTime}–${item.endTime}`;
  if (item.startTime) return item.startTime;
  if (item.timeText) return item.timeText;
  return null;
}

export function analyzeTimeline(items: CalendarItem[]): TimelineAnalysis {
  const visibleCandidates: Omit<TimelineEntry, 'lane' | 'laneCount'>[] = [];
  const untimedItems: CalendarItem[] = [];
  const beforeWindowItems: CalendarItem[] = [];
  const afterWindowItems: CalendarItem[] = [];

  for (const item of items) {
    const parsedStart = parseHour(item.startTime ?? item.timeText ?? null);
    if (parsedStart === null) {
      untimedItems.push(item);
      continue;
    }

    const parsedEnd = parseHour(item.endTime ?? null);
    const rawEnd =
      parsedEnd !== null && parsedEnd > parsedStart
        ? parsedEnd
        : parsedStart + DEFAULT_EVENT_DURATION_HOURS;

    if (rawEnd <= TIMELINE_START_HOUR) {
      beforeWindowItems.push(item);
      continue;
    }

    if (parsedStart >= TIMELINE_END_HOUR) {
      afterWindowItems.push(item);
      continue;
    }

    const startHour = Math.max(TIMELINE_START_HOUR, Math.min(TIMELINE_END_HOUR, parsedStart));
    const endHour = Math.max(
      startHour + 0.25,
      Math.min(TIMELINE_END_HOUR, rawEnd),
    );

    visibleCandidates.push({
      item,
      startHour,
      endHour,
      clippedBefore: parsedStart < TIMELINE_START_HOUR,
      clippedAfter: rawEnd > TIMELINE_END_HOUR,
    });
  }

  const sortedVisible = visibleCandidates.sort(
    (a, b) => a.startHour - b.startHour || a.endHour - b.endHour,
  );
  const visibleEntries: TimelineEntry[] = [];

  let cluster: Omit<TimelineEntry, 'lane' | 'laneCount'>[] = [];
  let clusterMaxEnd = 0;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const laneEnds: number[] = [];
    const clusterWithLanes = cluster.map((entry) => {
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= entry.startHour);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(entry.endHour);
      } else {
        laneEnds[lane] = entry.endHour;
      }

      return {
        ...entry,
        lane,
      };
    });

    const laneCount = Math.max(laneEnds.length, 1);
    visibleEntries.push(
      ...clusterWithLanes.map((entry) => ({
        ...entry,
        laneCount,
      })),
    );

    cluster = [];
    clusterMaxEnd = 0;
  };

  for (const entry of sortedVisible) {
    if (cluster.length === 0 || entry.startHour < clusterMaxEnd) {
      cluster.push(entry);
      clusterMaxEnd = Math.max(clusterMaxEnd, entry.endHour);
      continue;
    }

    flushCluster();
    cluster.push(entry);
    clusterMaxEnd = entry.endHour;
  }

  flushCluster();

  return {
    visibleEntries,
    untimedItems,
    beforeWindowItems,
    afterWindowItems,
  };
}
