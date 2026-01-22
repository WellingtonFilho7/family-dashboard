import { describe, it, expect } from 'vitest';
import { computeRoutineToggle } from '../routine-utils';

const base = {
  id: 'check-1',
  templateId: 'template-1',
  date: '2024-01-01',
  completed: true,
};

describe('routine-utils', () => {
  it('toggles an existing check', () => {
    const result = computeRoutineToggle([base], 'template-1', '2024-01-01', () => 'new');
    expect(result.nextCompleted).toBe(false);
    expect(result.updatedChecks[0].completed).toBe(false);
  });

  it('creates a new check when missing', () => {
    const result = computeRoutineToggle([], 'template-1', '2024-01-01', () => 'new-id');
    expect(result.nextCompleted).toBe(true);
    expect(result.updatedChecks[0].id).toBe('new-id');
    expect(result.updatedChecks[0].completed).toBe(true);
  });
});
