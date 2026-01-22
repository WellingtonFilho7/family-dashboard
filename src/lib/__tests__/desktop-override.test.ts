import { describe, it, expect } from 'vitest';
import { getDesktopOverrideFromSearch, resolveDesktopOverride } from '../desktop-override';

describe('desktop override', () => {
  it('enables when desktop=1', () => {
    expect(getDesktopOverrideFromSearch('?desktop=1')).toBe(true);
  });

  it('disables when desktop=0', () => {
    expect(getDesktopOverrideFromSearch('?desktop=0')).toBe(false);
  });

  it('returns null when param missing', () => {
    expect(getDesktopOverrideFromSearch('')).toBe(null);
  });

  it('prefers query param over storage', () => {
    expect(resolveDesktopOverride('?desktop=1', '0')).toBe(true);
    expect(resolveDesktopOverride('?desktop=0', '1')).toBe(false);
  });

  it('uses stored value when query missing', () => {
    expect(resolveDesktopOverride('', '1')).toBe(true);
    expect(resolveDesktopOverride('', '0')).toBe(false);
    expect(resolveDesktopOverride('', null)).toBe(false);
  });
});
