# Workflow

## Rules for AI agents

1. **Read `/kb` before touching code.** PROJECT.md, KIOSK.md, this file.
2. **Small PRs.** One concern per PR. Explicit goal in description.
3. **No feature creep.** Don't "improve" code you weren't asked to change.
4. **No new dependencies** without justification.
5. **Privacy is critical.** `/painel` must never leak `is_private` data.
6. **UI text = Portuguese.** Code = English. No mixing.
7. **Don't add:** monitoring, analytics, i18n, state libraries, extra docs.

## Setup

```bash
git clone <repo>
cd family-dashboard
npm install
```

Create `.env.local`:
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Without these, dev mode uses mock data from `src/lib/mockData.ts`.

## Scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Vite dev server (localhost:5173) |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run typecheck` | TypeScript only (tsc --noEmit) |
| `npm run preview` | Preview production build |

## Quality bar

**Must pass before merge:**
1. `npm run build` succeeds
2. App runs locally without errors
3. Manual smoke test: OTP login, CRUD, kiosk renders, visit mode works

## Seeding data

No seed scripts. Data entered via `/editar` (admin UI).
In dev without Supabase, mock data loads automatically.
Settings singleton: `INSERT INTO settings (id, visit_mode) VALUES (1, false) ON CONFLICT DO NOTHING;`

## Schema changes

1. Change in Supabase SQL Editor
2. Update `supabase_schema_notes.sql`
3. Update `src/lib/types.ts` if types changed
4. Update mapper in `src/hooks/useKioskData.ts` if columns changed

## Code conventions

- **UI text**: PT-BR
- **Code**: English (files, types, variables, functions, commits)
- **Styling**: Tailwind utility classes
- **Components**: shadcn/ui from `src/components/ui/`
- **State**: React hooks only
- **Path alias**: `@/` = `src/`

## Deployment

- **Platform**: Vercel
- **Config**: `vercel.json` with SPA rewrite
- **Env vars**: build-time — must redeploy after changes

---

## Backlog

### Top priorities

1. Unified kiosk layout (calendar + routines visible simultaneously)
2. Font sizes for 2-3m readability
3. Inline editing in `/editar`
4. Dark mode (manual toggle)
5. Offline resilience (cached last-known data)

### Anti-goals

- No enterprise analytics or monitoring
- No heavy logging
- No overbuilt CI
- No premature scaling
- No i18n
- No multi-tenant
- No feature sprawl
