import type { MockEvent } from '../mock';

export const TIMELINE_START_HOUR = 7;
export const TIMELINE_END_HOUR = 22;
export const TIMELINE_VISIBLE_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
const TIMELINE_VISIBLE_MINUTES = TIMELINE_VISIBLE_HOURS * 60;
const TIMELINE_START_MIN = TIMELINE_START_HOUR * 60;
const TIMELINE_END_MIN = TIMELINE_END_HOUR * 60;
const DEFAULT_DURATION_MINUTES = 60;

export interface TimedEntry {
  event: MockEvent;
  startMinutes: number;
  endMinutes: number;
  topPercent: number;
  heightPercent: number;
  lane: number;
  laneCount: number;
  clippedBefore: boolean;
  clippedAfter: boolean;
}

export interface DayTimelineData {
  timed: TimedEntry[];
  untimed: MockEvent[];
}

export function buildDayTimeline(events: MockEvent[]): DayTimelineData {
  const timedCandidates: Omit<TimedEntry, 'lane' | 'laneCount' | 'topPercent' | 'heightPercent'>[] = [];
  const untimed: MockEvent[] = [];

  for (const event of events) {
    if (event.startMinutes === null) {
      untimed.push(event);
      continue;
    }

    const rawEnd = event.endMinutes ?? event.startMinutes + DEFAULT_DURATION_MINUTES;
    if (rawEnd <= TIMELINE_START_MIN || event.startMinutes >= TIMELINE_END_MIN) {
      untimed.push(event);
      continue;
    }

    const startMinutes = Math.max(TIMELINE_START_MIN, event.startMinutes);
    const endMinutes = Math.min(TIMELINE_END_MIN, Math.max(rawEnd, startMinutes + 15));

    timedCandidates.push({
      event,
      startMinutes,
      endMinutes,
      clippedBefore: event.startMinutes < TIMELINE_START_MIN,
      clippedAfter: rawEnd > TIMELINE_END_MIN,
    });
  }

  const sorted = timedCandidates.sort(
    (a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes,
  );

  const timed: TimedEntry[] = [];
  let cluster: typeof sorted = [];
  let clusterEnd = 0;

  const flush = () => {
    if (cluster.length === 0) return;
    const laneEnds: number[] = [];
    const withLanes = cluster.map((entry) => {
      let lane = laneEnds.findIndex((end) => end <= entry.startMinutes);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(entry.endMinutes);
      } else {
        laneEnds[lane] = entry.endMinutes;
      }
      return { ...entry, lane };
    });
    const laneCount = Math.max(1, laneEnds.length);
    for (const entry of withLanes) {
      timed.push({
        ...entry,
        laneCount,
        topPercent: ((entry.startMinutes - TIMELINE_START_MIN) / TIMELINE_VISIBLE_MINUTES) * 100,
        heightPercent: ((entry.endMinutes - entry.startMinutes) / TIMELINE_VISIBLE_MINUTES) * 100,
      });
    }
    cluster = [];
    clusterEnd = 0;
  };

  for (const entry of sorted) {
    if (cluster.length === 0 || entry.startMinutes < clusterEnd) {
      cluster.push(entry);
      clusterEnd = Math.max(clusterEnd, entry.endMinutes);
      continue;
    }
    flush();
    cluster.push(entry);
    clusterEnd = entry.endMinutes;
  }
  flush();

  return { timed, untimed };
}

export function nowPercent(now: Date): number | null {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < TIMELINE_START_MIN || minutes > TIMELINE_END_MIN) return null;
  return ((minutes - TIMELINE_START_MIN) / TIMELINE_VISIBLE_MINUTES) * 100;
}
