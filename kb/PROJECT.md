# Project

## What this is

Family Dashboard is a self-hosted family organization tool. Two routes:
- `/painel` — public kiosk dashboard (ambient display, read-only)
- `/editar` — admin panel (email+password, phone-optimized CRUD)

Real household tool, not a demo or SaaS. PT-BR UI text, English code.

## Who uses it

- **Admins**: parents (2 people), manage content via `/editar` on phone
- **Viewers**: the whole family on the kiosk screen
- **Children**: tap routine checkboxes on the kiosk

## Physical deployment

Kiosk runs on a fixed screen in the house:
- Target: 20" touchscreen wall display
- Testing: iPad, FireTV (Silk browser)
- Admin: iPhone

## Priorities (in order)

1. Zero friction — if it's annoying, it gets abandoned
2. Reliability — no crashes, no stale state
3. Readable from distance — 2-3 meters
4. Admin via phone — fast editing
5. Simplicity — no feature creep

---

## Stack

React 19 + TypeScript 5.9 + Vite 7 + Tailwind 3 + shadcn/ui (Radix) + Supabase + Vercel + date-fns.

No custom backend. Path alias: `@/` = `src/`.

## Routes & data flow

```
Supabase (Postgres + RLS)
    ↓
useKioskData(visitMode, options)   ← central hook
    ↓ fetches family data via src/lib/api/*
    ↓ maps snake_case → camelCase
    ↓ applies privacy filtering
    ↓ auto-refreshes every 5 min + on tab focus
    ↓ timezone-aware day rollover recalculates week
    ↓
PanelPage / EditPage
```

### Key files

| File | Role |
|------|------|
| `src/hooks/useKioskData.ts` | Panel data hook — orchestrates state, privacy filtering, refresh and routine toggles |
| `src/lib/api/` | Supabase access layer (auth, settings, admin CRUD, family data fetch) |
| `src/App.tsx` | Routes + public panel composition |
| `src/pages/EditPage.tsx` | Admin CRUD (people, agenda, routines, replenish, content, config) |
| `src/lib/types.ts` | All TypeScript interfaces |
| `src/lib/supabase.ts` | Public/admin Supabase clients with separate auth persistence |
| `src/lib/date-utils.ts` | Timezone-aware date functions (default: America/Sao_Paulo) |
| `src/lib/mockData.ts` | Dev fallback when Supabase isn't configured |
| `src/components/ErrorBoundary.tsx` | Section-level crash containment |

## Privacy model

Two layers:

1. **`is_private` field** — per-record flag on most tables
2. **`visitMode`** — global toggle in `settings` (singleton id=1)

When active: private items filtered out, private people masked as "Família."

**Rule**: `/painel` (anon) must NEVER leak private data. RLS enforces at DB level, `filterPrivate()` enforces at UI level.

## Desktop / TV override

FireTV Silk sends mobile UA on large screens. Two equivalent overrides:
- `?desktop=1` — original
- `?mode=tv` — alias

Both persist to localStorage, set `data-desktop="1"` on `<html>`.

---

## Supabase

### Tables

| Table | Purpose | `is_private`? |
|-------|---------|---------------|
| `people` | Family members | Yes |
| `recurring_items` | Weekly schedule (day-of-week) | Yes |
| `one_off_items` | One-time events (date) | Yes |
| `kid_routine_templates` | Daily routine definitions | Yes |
| `kid_routine_checks` | Completion tracking | No |
| `replenish_items` | Shopping / supply list | Yes |
| `weekly_focus` | Scripture / focus of the week | No |
| `homeschool_notes` | Education topics per child | Yes |
| `settings` | App config (singleton id=1) | No |

### Key constraints

- `day_of_week`: CHECK 1-7 (1=Sun, 7=Sat)
- `kid_routine_checks`: UNIQUE(template_id, date)
- `settings`: always id=1

### Column mapping (DB → TS)

`day_of_week` → `dayOfWeek`, `is_private` → `isPrivate`, `sort_order` → `sortOrder`, `is_active` → `isActive`, `kid_person_id` → `kidPersonId`, `template_id` → `templateId`, `created_at` → `createdAt`, `visit_mode` → `visitMode`

Target model:
- `person_ids` is canonical for agenda ownership
- `person_id` is legacy fallback until the DB is fully migrated
- `timeText` in the app is derived from `start_time` / `end_time` when possible

### RLS

- **Anon**: SELECT only, filtered by `is_private = false`. Exceptions: `kid_routine_checks`, `weekly_focus`, `settings` → open SELECT.
- **Authenticated**: full CRUD via `auth.role() = 'authenticated'`.

Open verification:
- If children must mark routines from `/painel`, the real Supabase project needs anon write capability for `kid_routine_checks` or an equivalent safe path. Audit this before considering production RLS complete.

### Auth

Email + password (Supabase Auth). Redirect URLs:
- Prod: `https://<domain>/editar`
- Dev: `http://localhost:5173/editar`

Product rule:
- No public self-service admin signup
- Admin users should be created manually until an allowlist model exists

### Schema management

No formal migrations. Changes via Supabase SQL Editor. `supabase_schema_notes.sql` is the canonical reference. **Any DB change must update that file.**
