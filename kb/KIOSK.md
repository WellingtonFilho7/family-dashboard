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
- **Background**: Off-white `#F9F8F6`
- **Cards**: White `#FFFFFF`
- **Primary**: `#3385CC` (blue)
- **Secondary**: `#3F9C6D` (green)
- **Accent**: `#E89A4A` (orange)
- **Destructive**: `#D95555` (red)
- **Border radius**: 10px

## Current layout

```
[Sidebar] [Main: header + focus + calendar/kids] [Right: replenish + homeschool]
```

- Sidebar: fixed bottom (mobile), left column (desktop). Nav buttons + QR + visit toggle.
- Main: calendar 7-day grid OR kids routine grid (tab-switched).
- Right: sticky, replenish (4 items max) + homeschool topics.
- Clock: updates every 30s.

---

## Known issues (current)

| Issue | Status |
|-------|--------|
| Calendar + routines mutually exclusive | Open — Sprint 2 will unify |
| Font sizes too small for 2-3m | Open — Sprint 2 |
| Replenish capped at 4 items | Open — Sprint 2 |
| No dark mode | Open — Sprint 4 |
| No offline indicator | Open — Sprint 4 |

## Resolved in Sprint 1

| Issue | Fix |
|-------|-----|
| No auto-refresh (data went stale) | 5-min interval + visibilitychange refetch |
| Midnight rollover broken | weekStart recalculates on date change |
| No error boundary (white screen on crash) | Section-level ErrorBoundary with fallback |
| Hardcoded homeschool kid order | Derived from `people` data dynamically |
| Font config conflict (Space Grotesk vs Satoshi) | Unified on Space Grotesk |
| Dead `App.css` boilerplate | Deleted |

---

## Target state (ideal kiosk)

- All sections visible simultaneously (no tabs)
- Clock 48px+, event titles 18px+, routine text 18px+
- Section-level error containment
- Auto-refresh + midnight rollover
- Dark mode toggle for evening
- Last-known data on network failure

## Gap summary

| Gap | Priority | Sprint |
|-----|----------|--------|
| Unified layout (no tabs) | High | 2 |
| Font sizes for distance | High | 2 |
| Replenish cap increase | Medium | 2 |
| Dark mode | Medium | 4 |
| Offline resilience | Medium | 4 |
