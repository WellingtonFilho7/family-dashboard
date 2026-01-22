# Kids Grid Fit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Kids view fit 4+ children without vertical page scroll by using an auto-fit grid and limiting visible routines to 5 with a +N indicator.

**Architecture:** Add a small list helper to compute visible items + overflow, then update KidsGrid to use an auto-fit CSS grid and truncate routine lists visually. No data/model changes.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest.

### Task 1: Add list truncation helper + tests

**Files:**
- Create: `src/lib/list-utils.ts`
- Create: `src/lib/__tests__/list-utils.test.ts`

**Step 1: Write the failing test**

```ts
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
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/lib/__tests__/list-utils.test.ts`
Expected: FAIL with "Cannot find module '../list-utils'" or missing export.

**Step 3: Write minimal implementation**

```ts
export const getVisibleWithOverflow = <T,>(items: T[], limit: number) => {
  const visible = items.slice(0, Math.max(0, limit));
  const overflow = Math.max(items.length - visible.length, 0);
  return { visible, overflow };
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/lib/__tests__/list-utils.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/list-utils.ts src/lib/__tests__/list-utils.test.ts
git commit -m "feat: add list overflow helper"
```

### Task 2: Update KidsGrid layout + truncation

**Files:**
- Modify: `src/App.tsx`

**Step 1: Apply auto-fit grid and use helper**

Update the KidsGrid container class to use `grid-cols-[repeat(auto-fit,minmax(220px,1fr))]` and remove fixed 3-column overrides. Use `getVisibleWithOverflow` to render only 5 routines per kid and append a `+N` line when overflow > 0.

**Step 2: Run full tests**

Run: `npm test -- --run`
Expected: PASS.

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: fit kids grid and limit routines"
```

