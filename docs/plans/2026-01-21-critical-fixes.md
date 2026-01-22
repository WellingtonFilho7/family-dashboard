# Critical Fixes (Routine Toggle + Family Timezone) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent routine toggle race conditions and ensure date calculations are aligned to a consistent family timezone.

**Architecture:** Add a small date utility module that computes family-local date keys and parses date-only strings without timezone drift. Add a routine-toggle helper to compute next state deterministically and introduce a pending-key guard to avoid double-click races.

**Tech Stack:** React, TypeScript, Vite, date-fns, Vitest (new for unit tests).

---

### Task 1: Add family date utilities + tests

**Files:**
- Create: `src/lib/date-utils.ts`
- Create: `src/lib/__tests__/date-utils.test.ts`
- Modify: `package.json` (add test script, add vitest dev dependency)

**Step 1: Write the failing test**

Create `src/lib/__tests__/date-utils.test.ts`:

```ts
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
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run`

Expected: FAIL (module not found `date-utils` / no test script yet).

**Step 3: Write minimal implementation**

Create `src/lib/date-utils.ts`:

```ts
const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

const getTimeZone = (override?: string) => {
  return override ?? import.meta.env?.VITE_FAMILY_TIMEZONE ?? DEFAULT_TIMEZONE;
};

const getParts = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  };
};

export const getFamilyDate = (date: Date = new Date(), timeZone?: string) => {
  const tz = getTimeZone(timeZone);
  const { year, month, day } = getParts(date, tz);
  return new Date(year, month - 1, day);
};

export const getFamilyDateKey = (date: Date = new Date(), timeZone?: string) => {
  const tz = getTimeZone(timeZone);
  const { year, month, day } = getParts(date, tz);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

export const parseDateOnly = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return new Date(NaN);
  return new Date(year, month - 1, day);
};
```

Update `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run"
},
"devDependencies": {
  "vitest": "^2.1.9"
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run`

Expected: PASS for `date-utils` tests.

**Step 5: Commit**

```bash
git add src/lib/date-utils.ts src/lib/__tests__/date-utils.test.ts package.json package-lock.json
git commit -m "test: add family date utils"
```

---

### Task 2: Routine toggle guard + date usage updates

**Files:**
- Create: `src/lib/routine-utils.ts`
- Create: `src/lib/__tests__/routine-utils.test.ts`
- Modify: `src/hooks/useKioskData.ts`
- Modify: `src/App.tsx`

**Step 1: Write the failing test**

Create `src/lib/__tests__/routine-utils.test.ts`:

```ts
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
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run`

Expected: FAIL (module not found `routine-utils`).

**Step 3: Write minimal implementation**

Create `src/lib/routine-utils.ts`:

```ts
import type { KidRoutineCheck } from '@/lib/types';

type ToggleResult = {
  nextCompleted: boolean;
  updatedChecks: KidRoutineCheck[];
};

type IdFactory = () => string;

export const computeRoutineToggle = (
  checks: KidRoutineCheck[],
  templateId: string,
  dateKey: string,
  createId: IdFactory
): ToggleResult => {
  const existing = checks.find(
    (check) => check.templateId === templateId && check.date === dateKey
  );
  const nextCompleted = existing ? !existing.completed : true;
  if (existing) {
    return {
      nextCompleted,
      updatedChecks: checks.map((check) =>
        check.id === existing.id ? { ...check, completed: nextCompleted } : check
      ),
    };
  }
  const newCheck: KidRoutineCheck = {
    id: createId(),
    templateId,
    date: dateKey,
    completed: nextCompleted,
  };
  return { nextCompleted, updatedChecks: [...checks, newCheck] };
};
```

Update `src/hooks/useKioskData.ts`:
- Import `getFamilyDate`, `getFamilyDateKey`, `parseDateOnly` from `src/lib/date-utils.ts`.
- Import `computeRoutineToggle` from `src/lib/routine-utils.ts`.
- Add `routineChecksRef` to track latest checks and `pendingRoutineKeysRef` to block double-clicks.
- Replace `formatISO(new Date(), ...)` with `getFamilyDateKey()`.
- Replace `startOfWeek(new Date(), ...)` with `startOfWeek(getFamilyDate(), ...)`.
- Replace `new Date(item.date)` with `parseDateOnly(item.date)`.
- In `toggleRoutine`, compute `{ nextCompleted, updatedChecks }` from the ref, guard pending key, upsert to Supabase, and on success set `routineChecks` to `updatedChecks`.

Update `src/App.tsx`:
- Import and use `getFamilyDateKey` for `todayKey` in `KidsGrid`.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run`

Expected: PASS for `date-utils` and `routine-utils` tests.

**Step 5: Commit**

```bash
git add src/lib/routine-utils.ts src/lib/__tests__/routine-utils.test.ts src/hooks/useKioskData.ts src/App.tsx
git commit -m "fix: stabilize routine toggles and family date keys"
```

---

## Notes
- `npm run lint` currently fails due to existing lint issues unrelated to this change; do not gate these fixes on lint.
- Keep the timezone override optional via `VITE_FAMILY_TIMEZONE` (defaults to `America/Sao_Paulo`).
