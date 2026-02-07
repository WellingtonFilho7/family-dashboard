# Frontend Evaluation: Family Kiosk Dashboard

**Date**: 2026-02-07
**Evaluator role**: Frontend architect
**Scope**: Comprehensive kiosk UX evaluation -- what the frontend IS vs. what it SHOULD be for an ideal wall-mounted family dashboard.
**Constraint**: Single maintainer, domestic tool, pragmatism above all.

---

## 1. Ideal Kiosk Architecture & UX Model

### What "kiosk" actually means for a family

A family kiosk is not an app. It is a piece of furniture. Like a clock on the wall, it should communicate state without requiring interaction. The best family kiosks are **ambient-first, interactive-second**: 95% of the time nobody touches them; 5% of the time a child taps a routine checkbox or a parent glances at tomorrow's schedule.

### The opinionated ideal (2025-2026)

**A. Information hierarchy via spatial zones**

The screen should be divided into permanent spatial zones that never move, never swap, and never animate in or out. Every family member should be able to point at a spot on the wall and say "that's where the calendar is" -- even in the dark, even half-asleep.

Ideal zone layout for a landscape kiosk (1024px+ wide):

```
+----------------------------------------------------+
| [Clock / Date]         [Weekly Focus / Verse]       |
|                                                     |
| +------------------+  +-----------+  +------------+ |
| |                  |  |           |  |            | |
| |   7-Day Calendar |  | Kids      |  | Shopping / | |
| |   (always vis.)  |  | Routines  |  | Replenish  | |
| |                  |  | (today)   |  |            | |
| |                  |  |           |  | Homeschool | |
| +------------------+  +-----------+  +------------+ |
|                                                     |
| [Status bar: last sync, visit mode, connectivity]   |
+----------------------------------------------------+
```

Key principles:
- **No tab switching.** Everything fits on one screen. If it doesn't fit, it is deprioritized -- not paginated. A kiosk user never navigates.
- **Clock is persistent and large.** The single most glanced-at element. It anchors the display's utility.
- **Calendar and routines coexist.** They serve different family members simultaneously. A parent looks at the calendar; kids look at their routines. Neither should have to wait for the other.
- **The verse/focus is always visible** but never dominant. It is a quiet constant, not a hero banner.
- **Shopping list is peripheral.** It lives in the smallest zone. Only urgent items show.

**B. Typography for 2-3 meter readability**

At 2-3 meters on a 10-13 inch screen (iPad, tablet), the minimum readable font size is approximately:
- **Clock**: 48-64px (the anchor element)
- **Day numbers / headings**: 28-36px
- **Event titles / routine names**: 18-22px
- **Secondary text (times, labels)**: 14-16px
- **Metadata (badge text)**: 12-14px, only for close-range viewing

Line height should be generous (1.4-1.6). Letter spacing on uppercase labels should be loose. Weight contrast matters more than size contrast: bold headings vs. regular body creates visual hierarchy without needing extreme size differences.

**C. Color and contrast for ambient viewing**

- Light mode during the day, dark mode from sunset onward (automatic, time-based).
- Background should be warm and non-fatiguing: off-white by day, deep gray (not black) by night.
- Person color dots should be the brightest elements -- they are the fastest way to scan "who has what."
- Urgency (shopping "now") uses red tints; everything else uses muted, non-alarming colors.
- No pure white cards on pure white backgrounds. Subtle elevation (shadow or border) creates separation.

**D. Touch ergonomics**

- **Touch targets: 48px minimum**, 56px preferred for children.
- **No hover states that carry meaning.** Hover is decorative only on a touch kiosk.
- **Haptic feedback via visual response.** Active press states (scale-down, color shift) must be instant (<50ms perceived).
- **No double-tap, long-press, or swipe required.** Every interaction is a single tap.
- **Tap zones should be spaced 8-12px apart** to prevent accidental adjacent taps (kids' fingers are imprecise).
- **Confetti on completion is good.** Rewarding routine completion makes it a game. Keep it.

**E. Data freshness**

A kiosk that shows yesterday's data is worse than no kiosk at all. The ideal behavior:
- **Auto-refresh every 5 minutes** (silent background fetch, no loading spinner).
- **Supabase Realtime subscription** for routine checks (so when a kid taps, the parent sees it immediately on another device).
- **Visible "last synced" timestamp** in the status bar, small and unobtrusive.
- **Stale data indicator** if the last successful fetch is older than 15 minutes.
- **Midnight rollover**: at midnight (family timezone), the calendar silently advances to the new week if needed, and routine checks reset.

**F. Resilience**

- **Offline: show last-known data.** Cache the most recent successful fetch in localStorage or IndexedDB. If the network drops, the screen continues to show useful information with a subtle "offline" indicator.
- **Error boundary**: if a section crashes, that section shows a fallback -- never a white screen.
- **Cold start < 2 seconds** to meaningful content. Skeleton screens are fine, but they should fill within 1-2 seconds.

**G. Layout stability**

- **Zero layout shift after initial render.** Content areas have fixed dimensions. When data loads, it fills slots -- it does not push other content down or sideways.
- **Skeleton loaders match the final layout exactly** in dimensions.
- **No content that causes reflow**: no images loading without dimensions, no dynamic text that changes container size.

---

## 2. Current Implementation Assessment

### What the app does well

**Strengths (genuine, not faint praise):**

1. **Clean component architecture.** A single `App.tsx` with well-scoped inline components (`PanelPage`, `Sidebar`, `CalendarGrid`, `KidsGrid`, `RightColumn`) is appropriate for a two-route SPA. The code is readable and maintainable by a single person.

2. **Privacy model is solid.** The `visitMode` + `isPrivate` filtering at both the RLS and UI layers is a real feature that works correctly. The `filterPrivate` and `maskNames` utilities are clean and testable.

3. **Desktop override is well-engineered.** The `?desktop=1` with localStorage persistence, context propagation, and `data-desktop` attribute is a pragmatic solution to the Silk browser problem. It works without hacks.

4. **Confetti on routine completion.** This is exactly right for a kiosk used by children. It makes the act of checking off a routine feel rewarding. The implementation is lightweight (canvas-confetti, RAF-gated).

5. **Mock data fallback.** The dev experience of falling back to `mockData.ts` when Supabase is not configured is thoughtful. It means a new contributor (or the maintainer on a plane) can run the app immediately.

6. **Date utilities are timezone-aware.** The `getFamilyDate` / `getFamilyDateKey` functions using `Intl.DateTimeFormat` with configurable timezone are correct and well-tested. This prevents the class of bugs where "today" differs between server TZ and family TZ.

7. **Routine toggle has race-condition protection.** The `pendingRoutineKeysRef` guard, optimistic UI update, and ref-based state tracking in `toggleRoutine` are above-average for a personal project.

8. **Color system is warm and readable.** The off-white background (#F9F8F6), person color dots, and muted palette create a display that is comfortable for all-day viewing. The choice of Space Grotesk is good -- geometric, high x-height, readable at distance.

9. **QR code for admin access.** Being able to scan a QR code from the kiosk to open `/editar` on your phone is genuinely useful and well-implemented.

10. **Sensible Supabase usage.** Parallel `Promise.all` for 9 tables, snake-to-camel mappers, null-safe client initialization. No over-abstraction.

### Where it falls short

**Weaknesses (with specific evidence):**

1. **Calendar and kids view are mutually exclusive** (`viewMode: 'calendar' | 'kids'`). This is the single biggest UX problem. A parent looking at the calendar cannot simultaneously see kids' routine progress. A child marking routines cannot glance at tomorrow's schedule. This violates the "ambient display" principle: everything should be visible at once.

2. **No auto-refresh.** The data is fetched once on mount and never again. A kiosk running for 8 hours will show morning data all day. The `refresh` function exists in the hook but is never called on a timer. This is the number-one reliability issue.

3. **Font sizes are too small for 2-3 meter readability.** Evidence:
   - Clock: `text-3xl sm:text-4xl` = 30-36px. Should be 48-64px.
   - Calendar event titles: `text-sm` = 14px. Unreadable from 2 meters.
   - Day numbers: `text-2xl` = 24px. Should be 28-32px.
   - Routine button text: `text-base` = 16px. Borderline at 2 meters.
   - Right column items: `text-sm` = 14px. Only readable up close.
   - Weekly focus: `text-lg` = 18px. Should be 20-24px for an "always visible" element.

4. **No dark mode.** The tailwind config has `darkMode: ['class']` enabled but no dark CSS variables are defined. For evening/night kiosk display, the bright off-white background becomes a flashlight on the wall. This is a real daily annoyance.

5. **No offline indicator or cached fallback.** If the network drops, the next data fetch fails silently or shows a generic error toast. The kiosk goes blank or stale with no explanation. There is no localStorage/IndexedDB caching of the last good data.

6. **Homeschool section has hardcoded kid order.** In `RightColumn` (line 644 of App.tsx): `const homeschoolOrder = ['benjamin', 'jose', 'judah']` and `const homeschoolColors`. This will break if kids are added/removed and contradicts the dynamic `people` data from Supabase. The colors duplicate what is already stored in the `people` table.

7. **`App.css` is leftover Vite boilerplate.** It contains the default Vite spinning logo styles (`logo-spin`, `.read-the-docs`, etc.). This file is imported nowhere in the current app flow (no import in `main.tsx`), but its presence is confusing. Additionally, it sets `#root { max-width: 1280px }` which could cap the layout width if it were imported, which would be wrong for a kiosk.

8. **Replenish list is capped at 4 items.** `replenish.slice(0, 4)` is a hard limit. If a family has 6 urgent shopping items, 2 are invisible with only a "+N" count. On a kiosk, this is information loss. The cap should either be higher, dynamic based on available space, or replaced by a scrollable region for the right column.

9. **No error boundary.** If any component throws during render, the entire screen goes white. For a kiosk that runs unattended, this means the family wakes up to a blank wall. React error boundaries are trivial to add and would prevent total failure.

10. **Sidebar steals vertical space on mobile (fixed bottom) and horizontal space on desktop (80px column).** On a kiosk where every pixel matters for readability, the sidebar's 3 buttons (Calendar, Kids, QR) consume permanent screen real estate for navigation that ideally should not exist (because both views should be visible simultaneously).

11. **Clock updates every 30 seconds, but the date never updates.** The `humanDate` is computed on each render from `clock`, but if the app runs past midnight, the week data (`weekStart`, `weekDays`) is memoized with `[]` dependencies and never recalculates. The kiosk will show the wrong week until the page is manually reloaded.

12. **No `prefers-reduced-motion` handling.** The confetti animation and button scale transitions do not check for reduced motion preferences. While minor for a family kiosk, it is easy to add and is a good practice.

13. **Tailwind font family mismatch.** The `index.css` sets `font-family: 'Space Grotesk', ...` on `body`, but `tailwind.config.cjs` sets `fontFamily.sans` to `"Satoshi Variable"`. These conflict. The actual rendered font depends on which loads first and which CSS rule wins. This should be unified.

14. **No service worker / PWA manifest.** For a kiosk app, being installable to the home screen (PWA) eliminates the browser chrome, prevents accidental navigation, and enables offline caching. This is low-hanging fruit.

15. **All kiosk UI is in a single 800-line `App.tsx`.** While this works and is readable, it makes it harder to reason about individual sections, test them, or apply section-specific optimizations (like memoization). Extracting `CalendarGrid`, `KidsGrid`, `RightColumn`, and `Sidebar` into separate files would not add complexity but would improve maintainability.

---

## 3. Gap Analysis

### Critical Gaps (block daily reliability)

| # | Gap | Ideal State | Current State |
|---|-----|-------------|---------------|
| C1 | Auto-refresh | Silent background refresh every 5 min | No refresh after initial load |
| C2 | Midnight rollover | Week/date auto-advances at midnight | `weekStart` memoized with `[]`, stale forever |
| C3 | Error boundary | Section-level crash containment | Any render error = total white screen |
| C4 | Both views visible | Calendar + routines on screen simultaneously | Mutually exclusive tabs |

### High-Priority Gaps (daily annoyance or information loss)

| # | Gap | Ideal State | Current State |
|---|-----|-------------|---------------|
| H1 | Font size for distance | 48px+ clock, 18-22px event text | 30-36px clock, 14px events |
| H2 | Dark mode | Time-based auto-switch | No dark mode (vars not defined) |
| H3 | Offline resilience | Cached last-known data + indicator | Fetch failure = error or blank |
| H4 | Hardcoded homeschool | Dynamic from `people` data | Hardcoded `['benjamin', 'jose', 'judah']` |
| H5 | Replenish cap | Dynamic or higher cap (8-10 items) | Hard cap at 4 items |
| H6 | Font config conflict | Single font declaration | Space Grotesk in CSS vs Satoshi in Tailwind |

### Medium Gaps (polish and robustness)

| # | Gap | Ideal State | Current State |
|---|-----|-------------|---------------|
| M1 | PWA manifest | Installable, full-screen, cached shell | Standard SPA, browser chrome visible |
| M2 | Last-synced indicator | Subtle timestamp in corner | No sync visibility |
| M3 | Stale data warning | Banner after 15 min without successful fetch | No staleness detection |
| M4 | Component extraction | One file per major section | All in single 800-line App.tsx |
| M5 | Leftover boilerplate | Clean project, no dead files | `App.css` with Vite defaults |
| M6 | Skeleton dimension match | Skeletons match final layout exactly | Approximate but not precise |
| M7 | Empty states | Contextual, warm, per-section messages | Generic "Nada por aqui" / "Sem rotinas" |

### Low Gaps (nice-to-have)

| # | Gap | Ideal State | Current State |
|---|-----|-------------|---------------|
| L1 | `prefers-reduced-motion` | Disable confetti + transitions | Not checked |
| L2 | Supabase Realtime | Live updates for routine checks | Poll-based only |
| L3 | Progress bars for routines | Visual bar showing X/Y completion | Number badge only |
| L4 | TV-specific layout | `?mode=tv` optimized for 1080p at 3m | Desktop override only |

---

## 4. Ranked Improvements

### Tier 1: Do these first (high impact, within reach)

| # | Improvement | Impact | Complexity | What to do |
|---|-------------|--------|------------|------------|
| 1 | **Auto-refresh timer** | **H** | **L** | Add a `setInterval` in `PanelPage` (or `useKioskData`) that calls `refresh()` every 5 minutes. Wrap in `document.visibilityState === 'visible'` check to avoid background tab waste. Include a `lastFetched` timestamp in state. ~20 lines. |
| 2 | **Show calendar + routines simultaneously** | **H** | **M** | Remove the `viewMode` toggle. On desktop/kiosk width, render `CalendarGrid` and `KidsGrid` side by side (or stacked in the main column). On mobile, keep them stacked vertically with no toggle. Repurpose the sidebar space freed by removing the nav buttons. This is the single highest-value UX change. ~60 lines of layout refactoring. |
| 3 | **Increase kiosk font sizes** | **H** | **L** | Create a set of kiosk-specific utility classes or CSS custom properties. Clock: `text-5xl` minimum (48px). Calendar day numbers: `text-3xl` (30px). Event titles: `text-lg` (18px). Routine button text: `text-lg` (18px). Right column items: `text-base` (16px). Can be done incrementally per component. ~30 min of class adjustments. |
| 4 | **Midnight rollover** | **H** | **L** | Change the `weekStart` memo dependency from `[]` to a date key that changes at midnight. Add a `useEffect` that sets a timeout for the next midnight boundary (using `getFamilyDate`), then triggers a re-render by updating a `dateEpoch` state counter. Also re-fetches data. ~25 lines. |
| 5 | **Error boundary** | **H** | **L** | Create a simple React error boundary component that catches render errors and shows a "Algo deu errado -- recarregando em 30s" message with an auto-reload timer. Wrap `PanelPage` content sections individually so a crash in `KidsGrid` does not take down `CalendarGrid`. ~40 lines for a reusable component. |
| 6 | **Remove hardcoded homeschool order** | **H** | **L** | Replace `const homeschoolOrder = ['benjamin', 'jose', 'judah']` with `data.people.filter(p => p.type === 'kid')`. Replace `homeschoolColors` lookup with `person.color` from the people data. ~10 lines changed. |
| 7 | **Fix font config conflict** | **M** | **L** | Align `tailwind.config.cjs` fontFamily to use `'Space Grotesk'` (matching `index.css`), or remove the body font-family from `index.css` and rely solely on Tailwind. Pick one source of truth. ~5 lines. |
| 8 | **Delete `App.css` boilerplate** | **L** | **L** | Remove `/src/App.css`. It is not imported and contains only Vite template cruft. Verify no import exists. ~1 minute. |

### Tier 2: Do these next (high or medium impact, moderate work)

| # | Improvement | Impact | Complexity | What to do |
|---|-------------|--------|------------|------------|
| 9 | **Dark mode** | **H** | **M** | Define `:root.dark` (or `[data-theme="dark"]`) CSS variables in `index.css` with dark equivalents for all HSL tokens. Add a time-based auto-switch: check family timezone, if hour >= 20 or hour < 6, apply dark class. Expose a manual toggle in the sidebar (small moon icon). Since `darkMode: ['class']` is already configured in Tailwind, the infrastructure exists. ~80 lines (variables + toggle logic). |
| 10 | **Offline cache + indicator** | **H** | **M** | After each successful `fetchAll()`, write the result to `localStorage` (JSON stringify, keyed by date). On fetch failure, read from localStorage and show a subtle "Offline -- mostrando dados de HH:MM" banner. Add a `navigator.onLine` listener to show/hide an offline dot in the header. ~50 lines in `useKioskData` + a small UI indicator. |
| 11 | **PWA manifest + service worker** | **M** | **M** | Add a `manifest.json` with `display: standalone`, theme colors, and icons. Use `vite-plugin-pwa` (or a minimal hand-written service worker) for app shell caching. This eliminates browser chrome on iPad home screen and gives a slight offline boost. ~1 hour including icon creation. |
| 12 | **Raise or remove replenish cap** | **M** | **L** | Change `replenish.slice(0, 4)` to `replenish.slice(0, 8)` or remove the slice entirely and let the right column scroll if needed. If scrolling is undesirable, make the cap dynamic based on viewport height. ~5 lines. |
| 13 | **Last-synced timestamp** | **M** | **L** | Store `lastFetchedAt: Date` in `useKioskData` return. Display it in the header or status area as "Atualizado HH:MM". If older than 15 minutes, change color to amber. ~15 lines. |
| 14 | **Extract components to separate files** | **M** | **L** | Move `CalendarGrid`, `KidsGrid`, `RightColumn`, `Sidebar`, `QrModal` into `src/components/` as individual files. Import them in `App.tsx`. No logic changes, pure file organization. ~30 minutes of careful extraction. |
| 15 | **Contextual empty states** | **M** | **L** | Replace "Nada por aqui" with per-section messages: calendar day with no events gets "Dia livre" with a subtle relaxed icon; routines with nothing gets "Nenhuma rotina ativa -- adicione em /editar"; replenish empty gets "Tudo em casa" with a checkmark. ~20 lines of copy changes + optional icons. |

### Tier 3: When time allows (medium or low impact)

| # | Improvement | Impact | Complexity | What to do |
|---|-------------|--------|------------|------------|
| 16 | **Routine progress bars** | **M** | **L** | Below each kid's name, add a simple segmented bar or thin progress indicator showing filled/total. Use the kid's color. Celebrate 100% (already have confetti). ~25 lines per kid card. |
| 17 | **`prefers-reduced-motion` support** | **L** | **L** | Wrap `confetti()` call in a `!window.matchMedia('(prefers-reduced-motion: reduce)').matches` check. Add `motion-safe:` prefix to Tailwind transition classes. ~5 lines. |
| 18 | **Supabase Realtime for routine checks** | **M** | **M** | Subscribe to the `kid_routine_checks` table via `supabase.channel().on('postgres_changes', ...)`. When an INSERT or UPDATE arrives, merge it into local state. This enables multi-device sync (kid taps iPad, parent sees it on phone). ~40 lines. Requires Supabase Realtime to be enabled on the project. |
| 19 | **TV-optimized layout** | **L** | **M** | Create a `?mode=tv` layout variant that assumes 1920x1080 at 3 meters. Increase all font sizes by 25-50% over the desktop layout. Hide the sidebar entirely (no touch on a TV). Show all sections in a fixed 3-column grid with no scrolling. ~60 lines of conditional layout. |
| 20 | **Skeleton dimension precision** | **L** | **L** | Ensure skeleton loaders in `CalendarGrid` and `RightColumn` have the same height, width, and gap as the real content. Currently the skeletons are close but not pixel-matched, which causes a subtle layout shift when data loads. ~15 lines of class adjustments. |

---

## 5. Optional Advanced Ideas

*These are clearly optional. They could be interesting explorations but are not necessary for a well-functioning family kiosk. Do not pursue them at the expense of Tier 1-2 improvements.*

### 5a. Ambient weather strip

A thin strip at the top or bottom showing current weather (temperature + icon) using a free API (OpenWeatherMap free tier). Families glance at the kiosk when leaving the house. Knowing the weather without opening a phone is a genuine quality-of-life win. Implementation: a single `useEffect` fetch every 30 minutes to a weather API, rendered as a 32px strip with icon + temperature. ~50 lines total.

### 5b. Time-aware content emphasis

At 7am, visually emphasize the morning routines. At 6pm, dim the completed routines and emphasize tomorrow's first event. This "temporal highlighting" makes the kiosk feel alive and contextually useful without any interaction. Implementation: compute `currentPeriod` from family time (morning/afternoon/evening), apply a CSS class that adjusts opacity/border on relevant sections. ~30 lines.

### 5c. Weekly routine streaks

Show a small "streak" indicator next to each kid's name: "5 dias seguidos" when routines have been completed for consecutive days. This gamifies consistency. Requires querying historical `kid_routine_checks` data (already in the database). ~40 lines of computation + a small badge.

### 5d. Screensaver mode

After 30 minutes of no touch input, fade the screen to a dimmed mode showing only the clock, date, and verse on a dark background. Any touch restores the full dashboard. This extends display life on OLED/LED screens and reduces nighttime light pollution. Implementation: idle timer with CSS transition to a minimal overlay. ~40 lines.

### 5e. Sound feedback for routine completion

A short, quiet chime when a kid completes all routines for the day. Not a notification sound -- a celebration sound, like a gentle bell. Requires user interaction to unlock AudioContext (first tap on the page). Optional and easily disabled. ~20 lines.

### 5f. Admin quick-edit via kiosk long-press

Long-pressing a calendar event or replenish item on the kiosk could pop up a minimal edit modal (title only) without requiring the full `/editar` flow. This would require kiosk-level authentication (a simple PIN, not full OTP). Implementation is moderate (~100 lines) but conflicts with the principle of keeping the kiosk read-only. Consider carefully.

---

## Summary: Priority Matrix

```
                    LOW COMPLEXITY          MEDIUM COMPLEXITY       HIGH COMPLEXITY
                    ---------------         -----------------       ---------------
HIGH IMPACT         1. Auto-refresh         2. Both views visible   (none needed)
                    3. Font sizes           9. Dark mode
                    4. Midnight rollover    10. Offline cache
                    5. Error boundary
                    6. Fix homeschool

MEDIUM IMPACT       7. Font config fix      11. PWA manifest        (none needed)
                    12. Replenish cap       18. Supabase Realtime
                    13. Last-synced
                    14. Extract components
                    15. Empty states
                    16. Progress bars

LOW IMPACT          8. Delete App.css       19. TV layout           (none needed)
                    17. Reduced motion
                    20. Skeleton precision
```

**Recommended execution order for a single maintainer:**

Week 1: Items 1, 4, 5, 6, 7, 8 (all low complexity, high/medium impact -- pure wins)
Week 2: Items 3, 12, 13, 15 (font sizes and information improvements)
Week 3: Item 2 (the big layout refactor -- calendar + routines together)
Week 4: Items 9, 10 (dark mode + offline -- the two biggest comfort features)
Later: Items 11, 14, 16, 17, 18, 19, 20 as time allows

This sequence delivers compounding daily value: reliability first (auto-refresh, error boundary, midnight rollover), then readability (fonts), then the structural UX improvement (unified view), then comfort (dark mode, offline).
