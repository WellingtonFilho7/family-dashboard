# Kiosk

## Physical deployment

The dashboard runs on a **wall-mounted screen** viewed from 2-3 meters:
- **Target**: 20" touchscreen (primary kiosk)
- **Testing now**: iPad, FireTV (Silk browser)
- **Admin device**: iPhone

## Usage model

| Who | Action | Frequency |
|-----|--------|-----------|
| Children | Tap routine checkboxes | Several times/day |
| Adults | Check agenda, shopping list | Several times/day |
| Adults | Toggle visit mode | Occasionally |
| Everyone | Glance in passing | All day |

Two zones: **display** (read from distance) and **interactive** (touch up close).
Routines need generous touch targets (56px+). Agenda needs distance-readable text.

## Constraints

1. **High contrast** — readable from across the room
2. **Large touch targets** — 48px minimum, 56px preferred (kids' fingers)
3. **Stable layout** — no shifts, no jitter, no content jumping
4. **Single-tap only** — no double-tap, long-press, or swipe required
5. **No hover-dependent UI** — hover is decorative on a touch kiosk
6. **Tap spacing** — 12px+ between touchable elements

## FireTV workaround

Silk sends mobile UA on 1080p+ TVs. Use `?desktop=1` or `?mode=tv` (both work, persisted to localStorage).

## Design system

- **Font**: Space Grotesk (modern geometric, high x-height)
- **Dark mode**: `.dark` CSS vars, toggle via Moon/Sun button (localStorage)
- **Background**: `bg-background` (light: off-white, dark: slate-950)
- **Cards**: `bg-card` (light: white, dark: slate-900)
- **Primary**: `#3385CC` (blue)
- **Secondary**: `#3F9C6D` (green)
- **Accent**: `#E89A4A` (orange)
- **Destructive**: `#D95555` (red)
- **Border radius**: 10px

## Current layout

```
[Sidebar] [Main: header + calendar (side-by-side with right panel)]
          [Calendar fills left | Right: kids + replenish + homeschool]
```

- **Sidebar**: fixed bottom (mobile), left column (desktop). Nav buttons + QR + visit toggle + dark mode.
- **Header**: contextual greeting (Bom dia/Boa tarde/Boa noite) + full date + weekly focus verse + clock (xl:text-5xl).
- **Calendar**: 7-day grid, today highlighted with `ring-2 ring-primary/40 bg-primary/5`. Event dots show person color. `xl:` typography scaling for kiosk distance.
- **Kids grid**: routine buttons with progress dots (●●○○○), `xl:py-3` touch targets (~52-56px), `xl:h-8 xl:w-8` check circles.
- **Right panel**: 360px, scrollable. Replenish (8 items max) + homeschool topics per kid.
- **Clock**: updates every 30s.

## Typography (xl breakpoint — kiosk)

| Element | Size |
|---------|------|
| Clock | xl:text-5xl (~48px) |
| Day number (calendar) | xl:text-3xl (~30px) |
| Event titles | xl:text-base (~16px) |
| Routine text | xl:text-lg (~18px) |
| Kid names | xl:text-lg (~18px) |
| Greeting | xl:text-lg |
| Date heading | xl:text-xl |

## Offline & PWA

- **Service worker** (`sw.js`): cache-first for assets, network-first for navigation
- **Manifest**: `manifest.json` with 192/512 icons, standalone display
- **Offline cache**: last Supabase fetch stored in localStorage, shown with stale indicator (WifiOff icon)
- **iOS meta tags**: apple-mobile-web-app-capable, status-bar-style

---

## Resolved in Sprint 1

| Issue | Fix |
|-------|-----|
| No auto-refresh (data went stale) | 5-min interval + visibilitychange refetch |
| Midnight rollover broken | weekStart recalculates on date change |
| No error boundary (white screen on crash) | Section-level ErrorBoundary with fallback |
| Hardcoded homeschool kid order | Derived from `people` data dynamically |
| Font config conflict (Space Grotesk vs Satoshi) | Unified on Space Grotesk |
| Dead `App.css` boilerplate | Deleted |

## Resolved in Sprint 2

| Issue | Fix |
|-------|-----|
| Calendar + routines mutually exclusive | Unified layout — both always visible, no tabs |
| Font sizes too small for 2-3m | Bumped clock to 48px, events to 16px, routines to 18px on lg |
| Replenish capped at 4 items | Raised to 8 |
| Sidebar had unnecessary tab buttons | Simplified to QR + visit mode only |

## Resolved in Sprint 3

| Issue | Fix |
|-------|-----|
| EditPage monolithic (1361 lines) | Decomposed into 8 components under `src/pages/admin/` |
| No inline editing | Click-to-edit titles via EditableText component |
| No delete confirmation | DeleteConfirmButton with dialog |
| No empty states | EmptyState component with PT-BR messages |

## Resolved in Sprint 4

| Issue | Fix |
|-------|-----|
| No dark mode | `.dark` CSS vars + useDarkMode hook + Moon/Sun toggle |
| No offline resilience | localStorage cache + stale indicator |
| No PWA support | manifest.json + sw.js + iOS meta tags |
| OTP auth fragile | Replaced with email+password (signInWithPassword) |

## Resolved in Sprint 5

| Issue | Fix |
|-------|-----|
| No today highlight on calendar | `isSameDay()` + ring/bg visual treatment |
| Typography too small for kiosk distance | `xl:` breakpoint overrides on all text |
| Touch targets below spec for kids | Routine buttons ~52-56px, check circles 32px |
| Heading wasted space ("Painel semanal") | Contextual greeting + full date + clock |
| Person color dots too small | Scaled up with `xl:` classes |
| Routine progress not visual | Progress dots (●●○○○) replace numeric counters |
| Admin descriptions developer-facing | Rewritten to human-friendly PT-BR |
| Admin selects broken in dark mode | Added `bg-background text-foreground` classes |
| Admin tabs had no item counts | Badge counts on each category tab |

---

## Target state (achieved)

- All sections visible simultaneously (no tabs on kiosk)
- Clock 48px+, event titles 16px+, routine text 18px+
- Section-level error containment
- Auto-refresh + midnight rollover
- Dark mode toggle for evening
- Last-known data on network failure
- Today highlighted in calendar
- Progress dots for routine tracking
- Touch targets 48-56px for kids
- PWA installable
