# Architecture

## Stack

- **React 19** + **TypeScript 5.9** + **Vite 7**
- **Tailwind CSS 3** + **shadcn/ui** (Radix primitives)
- **Supabase** (Postgres + Auth + RLS) — no custom backend
- **Vercel** — static deploy, SPA rewrite
- **date-fns** — date operations (timezone-aware via custom utils)

## Routes

| Route     | Purpose            | Auth       | Key component   |
|-----------|--------------------|------------|-----------------|
| `/painel` | Kiosk dashboard    | None (anon)| `PanelPage` in `App.tsx` |
| `/editar` | Admin CRUD panel   | OTP email  | `EditPage.tsx`  |
| `*`       | Catch-all redirect | —          | → `/painel`     |

## Main data flow

```
Supabase (Postgres + RLS)
    ↓
useKioskData(visitMode, options)   ← central hook
    ↓ fetches all 9 tables in parallel via Promise.all
    ↓ maps snake_case DB rows → camelCase TS interfaces
    ↓ applies privacy filtering (is_private + visit_mode)
    ↓
PanelPage / EditPage consume the returned data
```

### Key files

| File | Role |
|------|------|
| `src/hooks/useKioskData.ts` | Central data hook — fetch, filter, toggle routines |
| `src/App.tsx` | Routes + PanelPage + CalendarGrid + KidsGrid + Sidebar |
| `src/pages/EditPage.tsx` | Admin CRUD (people, agenda, routines, replenish, content, config) |
| `src/lib/types.ts` | All TypeScript interfaces |
| `src/lib/supabase.ts` | Supabase client init (null if env vars missing) |
| `src/lib/date-utils.ts` | Timezone-aware date functions (default: America/Sao_Paulo) |
| `src/lib/mockData.ts` | Dev fallback when Supabase isn't configured |

## Privacy model

Two layers protect sensitive data:

1. **`is_private` field** — per-record flag on most tables
2. **`visit_mode`** — global toggle in `settings` (id=1 singleton)

When `visitMode` is active:
- Items with `is_private = true` are filtered out
- Private people are masked: name → "Familia", color → gray

**Rule**: The `/painel` (anon) route must NEVER leak private data.
RLS enforces this at the database level, and `filterPrivate()` enforces it at the UI level.

## Desktop override

FireTV Silk sends a mobile User-Agent despite having a large screen.
The `?desktop=1` query param forces desktop layout:
- Persisted to localStorage
- Sets `data-desktop="1"` on `<html>`
- Components check `useDesktopOverrideValue()` context

## Mock mode (dev only)

When running locally without Supabase env vars:
- `useKioskData` falls back to `mockData.ts`
- A yellow banner warns "Modo mock (dev)"
- In production without config → explicit error, no fallback

## Language convention

- **UI text**: Portuguese (PT-BR)
- **Code** (files, types, variables, commits): English
- No i18n planned
