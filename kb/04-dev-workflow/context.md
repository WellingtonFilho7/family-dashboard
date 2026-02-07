# Development Workflow

## Setup

```bash
git clone <repo>
cd family-dashboard
npm install
```

## Environment

Create `.env.local`:
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Without these, dev mode uses mock data automatically.

## Scripts

```bash
npm run dev       # Vite dev server (localhost:5173)
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint
npm run preview   # Preview production build locally
npm run test      # Vitest unit tests (run once)
npm run typecheck # TypeScript check only (tsc --noEmit)
```

## Quality bar

**Must pass before merge:**
1. `npm run build` succeeds (includes tsc)
2. App runs locally without obvious errors
3. Manual smoke test:
   - OTP login works on `/editar`
   - CRUD operations work
   - `/painel` renders real data
   - Visit mode hides private data

**Tests:**
- Small number of high-value tests (not high coverage)
- Existing tests cover: routine-utils, date-utils, desktop-override, debug-utils, list-utils
- Three tests matter most:
  1. `visit_mode` filtering
  2. `is_private` filtering
  3. Routine toggle logic

## Deployment

- **Platform**: Vercel
- **Config**: `vercel.json` with SPA rewrite (`/(.*) → /`)
- **Env vars**: set in Vercel dashboard (Production + Preview)
- **Important**: env vars are build-time — must redeploy after changes

## Data seeding

There are no seed scripts. Data is entered through `/editar` (admin UI).
For local dev without Supabase, mock data in `src/lib/mockData.ts` provides sample content.

## Schema changes

1. Make the change in Supabase SQL Editor
2. Update `supabase_schema_notes.sql` to match
3. Update TypeScript types in `src/lib/types.ts` if needed
4. Update mapper functions in `useKioskData.ts` if columns changed

## Code conventions

- UI text: Portuguese (PT-BR)
- Code: English (files, types, variables, functions)
- Commit messages: English
- Component library: shadcn/ui (Radix primitives, in `src/components/ui/`)
- Styling: Tailwind utility classes
- State: React hooks only (no external state library)
- Path aliases: `@/` maps to `src/`
