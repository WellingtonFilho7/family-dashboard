# UX & Kiosk

## Primary display context

The dashboard runs on a **wall-mounted screen** viewed from 2-3 meters away.
Typical devices:
- iPad (wall-mounted, Safari)
- FireTV (Silk browser — sends mobile UA despite 1080p+ screen)
- Android tablet

This is an **ambient display**, not an interactive app most of the time.
Interaction happens mainly for:
- Tapping routine checkboxes (kids)
- Toggling visit mode
- Switching between calendar and kids view

## Kiosk constraints

1. **High contrast** — text must be readable from across the room
2. **Large touch targets** — min 44px, ideally 48px+ (kids' fingers)
3. **Stable layout** — no layout shifts, no content jumping
4. **No jitter** — clock updates every 30s, not every second
5. **Predictable** — same layout every time, no surprises
6. **Minimal chrome** — no unnecessary buttons, menus, or decorations

## FireTV / Silk workaround

Silk browser sends a mobile User-Agent even on 1080p TVs.
The app supports `?desktop=1` (persisted to localStorage) to force desktop layout.
This sets `data-desktop="1"` on `<html>` and components use `useDesktopOverrideValue()`.

A `?mode=tv` alias is acceptable as an alternative.

## Design system

- **Font**: Space Grotesk (modern geometric sans-serif)
- **Background**: Off-white `#F9F8F6` (warm, low eye strain)
- **Cards**: White `#FFFFFF` on off-white background
- **Primary**: `#3385CC` (balanced blue)
- **Secondary**: `#3F9C6D` (natural green)
- **Accent**: `#E89A4A` (soft orange)
- **Destructive**: `#D95555` (soft red)
- **Border radius**: 10px
- **No dark mode yet** (candidate for future)

## Current layout

### `/painel` (kiosk)
```
[Sidebar] [Main content area]         [Right column]
  Nav       Header (title + clock)      Replenish list
  icons     Focus verse                 Homeschool notes
  QR btn    Calendar grid OR Kids grid
  Visit sw
```

- Sidebar: fixed bottom (mobile) / left column (desktop)
- Calendar: 7-day grid (Sun-Sat), up to 4 events per day
- Kids grid: routine checklists with completion badges + confetti
- Right column: sticky, shows replenish + homeschool

### `/editar` (admin)
- Category tabs: people, agenda, routines, replenish, content, config
- Mobile-first forms
- OTP login gate

## UX goals

- "Works daily" > "looks fancy"
- Readable at a glance > information density
- Fast cold start > animation polish
- Graceful degradation > feature completeness

## Known limitations

- No offline support (requires network for Supabase)
- No real-time subscriptions (manual refresh or page reload)
- No auto-refresh interval on kiosk (stale data after extended periods)
- Homeschool section has hardcoded kid order (`benjamin`, `jose`, `judah`)
- Right column replenish capped at 4 visible items
