import { describe, expect, it } from 'vitest';

import { analyzeTimeline, getItemTimeLabel, parseHour } from '../timeline-utils';
import type { CalendarItem } from '../types';

const baseItem = (overrides: Partial<CalendarItem>): CalendarItem => ({
  id: overrides.id ?? 'item',
  title: overrides.title ?? 'Evento',
  timeText: overrides.timeText ?? '',
  startTime: overrides.startTime ?? null,
  endTime: overrides.endTime ?? null,
  date: overrides.date ?? new Date('2024-01-01T00:00:00'),
  personIds: overrides.personIds ?? [],
  personColors: overrides.personColors ?? [],
});

describe('timeline-utils', () => {
  it('parses hour strings with colon', () => {
    expect(parseHour('07:30')).toBe(7.5);
  });

  it('builds a readable label from structured times', () => {
    expect(
      getItemTimeLabel(baseItem({ startTime: '08:00', endTime: '09:15' })),
    ).toBe('08:00–09:15');
  });

  it('classifies before/after-window items and keeps untimed items separate', () => {
    const analysis = analyzeTimeline([
      baseItem({ id: 'before', startTime: '05:30', endTime: '06:15' }),
      baseItem({ id: 'after', startTime: '22:30', endTime: '23:10' }),
      baseItem({ id: 'untimed', timeText: '', startTime: null, endTime: null }),
    ]);

    expect(analysis.beforeWindowItems.map((item) => item.id)).toEqual(['before']);
    expect(analysis.afterWindowItems.map((item) => item.id)).toEqual(['after']);
    expect(analysis.untimedItems.map((item) => item.id)).toEqual(['untimed']);
  });

  it('assigns multiple lanes to genuinely overlapping events', () => {
    const analysis = analyzeTimeline([
      baseItem({ id: 'a', startTime: '08:00', endTime: '09:30' }),
      baseItem({ id: 'b', startTime: '08:30', endTime: '10:00' }),
      baseItem({ id: 'c', startTime: '10:15', endTime: '11:00' }),
    ]);

    const entryA = analysis.visibleEntries.find((entry) => entry.item.id === 'a');
    const entryB = analysis.visibleEntries.find((entry) => entry.item.id === 'b');
    const entryC = analysis.visibleEntries.find((entry) => entry.item.id === 'c');

    expect(entryA?.laneCount).toBe(2);
    expect(entryB?.laneCount).toBe(2);
    expect(entryA?.lane).not.toBe(entryB?.lane);
    expect(entryC?.laneCount).toBe(1);
  });
});
