import { describe, expect, it } from 'vitest';

import { buildWeeklyFocusMutation } from '../api/content';

describe('content api helpers', () => {
  it('updates the current active focus instead of clearing and reinserting', () => {
    expect(
      buildWeeklyFocusMutation('focus-1', 'Coragem', 'Josué 1:9'),
    ).toEqual({
      kind: 'update',
      id: 'focus-1',
      payload: {
        text: 'Coragem',
        reference: 'Josué 1:9',
        is_active: true,
      },
    });
  });

  it('inserts a new active focus when none exists yet', () => {
    expect(
      buildWeeklyFocusMutation(null, 'Coragem', 'Josué 1:9'),
    ).toEqual({
      kind: 'insert',
      payload: {
        text: 'Coragem',
        reference: 'Josué 1:9',
        is_active: true,
      },
    });
  });
});
