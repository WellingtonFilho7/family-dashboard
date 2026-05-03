import type { CalendarItem, Person } from '@/lib/types';

import type { MockEvent, MockPerson } from '../mock';

export function parseTimeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const trimmed = time.trim();
  const match =
    trimmed.match(/^(\d{1,2})[:h](\d{1,2})/) ??
    trimmed.match(/^(\d{1,2})\s*h\s*$/) ??
    trimmed.match(/^(\d{1,2})$/);
  if (!match) return null;
  const hours = Number.parseInt(match[1], 10);
  const minutes = match[2] ? Number.parseInt(match[2], 10) : 0;
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function formatHM(time: string | null): string | null {
  if (!time) return null;
  const [hStr, mStr] = time.split(':');
  const hours = Number.parseInt(hStr, 10);
  const minutes = Number.parseInt(mStr ?? '0', 10);
  if (Number.isNaN(hours)) return null;
  if (Number.isNaN(minutes) || minutes === 0) return `${hours}h`;
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
}

export function buildTimeLabel(item: CalendarItem): string {
  const start = formatHM(item.startTime);
  const end = formatHM(item.endTime);
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (item.timeText) return item.timeText;
  return '';
}

function inferEndMinutes(item: CalendarItem, startMinutes: number | null): number | null {
  if (item.endTime) {
    const parsed = parseTimeToMinutes(item.endTime);
    if (parsed !== null && (startMinutes === null || parsed > startMinutes)) return parsed;
  }
  return null;
}

export function calendarItemToEvent(item: CalendarItem, dayOfWeek: number): MockEvent {
  const startMinutes =
    parseTimeToMinutes(item.startTime) ?? parseTimeToMinutes(item.timeText);
  const endMinutes = inferEndMinutes(item, startMinutes);
  return {
    id: item.id,
    dayOfWeek,
    title: item.title,
    time: buildTimeLabel(item),
    startMinutes,
    endMinutes,
    personIds: item.personIds,
  };
}

export function personToMockPerson(person: Person): MockPerson {
  const initial = (person.name.trim()[0] ?? '?').toUpperCase();
  const type: MockPerson['type'] = person.type === 'kid' ? 'kid' : 'adult';
  return {
    id: person.id,
    name: person.name,
    initial,
    color: person.color,
    type,
  };
}
