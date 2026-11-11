import { describe, it, expect } from 'vitest';
import {
  formatFamilyDateTime,
  getFamilyDate,
  getFamilyDateKey,
  getFamilyHour,
  parseDateOnly,
} from '../date-utils';

describe('date-utils', () => {
  it('computes family date key using timezone (can shift day)', () => {
    const date = new Date('2024-01-01T02:30:00Z');
    const key = getFamilyDateKey(date, 'America/Sao_Paulo');
    expect(key).toBe('2023-12-31');
  });

  it('returns a local Date for a date-only string', () => {
    const parsed = parseDateOnly('2024-02-10');
    expect(parsed.getFullYear()).toBe(2024);
    expect(parsed.getMonth()).toBe(1);
    expect(parsed.getDate()).toBe(10);
  });

  it('builds a Date from family timezone parts', () => {
    const date = new Date('2024-01-01T02:30:00Z');
    const familyDate = getFamilyDate(date, 'America/Sao_Paulo');
    expect(familyDate.getFullYear()).toBe(2023);
    expect(familyDate.getMonth()).toBe(11);
    expect(familyDate.getDate()).toBe(31);
  });

  it('formats family date/time using the configured timezone', () => {
    const date = new Date('2024-01-01T02:30:00Z');
    const formatted = formatFamilyDateTime(
      date,
      { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false },
      'pt-BR',
      'America/Sao_Paulo',
    );
    expect(formatted).toBe('31/12, 23:30');
  });

  it('returns the family hour instead of the device-local hour', () => {
    const date = new Date('2024-01-01T02:30:00Z');
    expect(getFamilyHour(date, 'America/Sao_Paulo')).toBe(23);
  });
});
