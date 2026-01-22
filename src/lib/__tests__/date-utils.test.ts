import { describe, it, expect } from 'vitest';
import { getFamilyDateKey, getFamilyDate, parseDateOnly } from '../date-utils';

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
});
