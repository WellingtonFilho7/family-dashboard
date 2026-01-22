import { describe, expect, it } from 'vitest';

import { getVisibleWithOverflow } from '../list-utils';

describe('list-utils', () => {
  it('returns visible items up to the limit and overflow count', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f'];
    const result = getVisibleWithOverflow(items, 5);
    expect(result.visible).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(result.overflow).toBe(1);
  });

  it('returns zero overflow when items fit', () => {
    const items = ['a', 'b'];
    const result = getVisibleWithOverflow(items, 5);
    expect(result.visible).toEqual(['a', 'b']);
    expect(result.overflow).toBe(0);
  });
});
