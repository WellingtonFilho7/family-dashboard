import { describe, it, expect } from 'vitest';
import { isDebugEnabled } from '../debug-utils';

describe('isDebugEnabled', () => {
  it('returns true when debug=1', () => {
    expect(isDebugEnabled('?debug=1')).toBe(true);
  });

  it('returns false when debug is missing or different', () => {
    expect(isDebugEnabled('')).toBe(false);
    expect(isDebugEnabled('?debug=0')).toBe(false);
    expect(isDebugEnabled('?foo=bar&debug=true')).toBe(false);
  });
});
