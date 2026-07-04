# Family Dashboard

Self-hosted family kiosk dashboard. **Read `kb/PROJECT.md`, `kb/WORKFLOW.md`, and `kb/KIOSK.md` before touching code** — they hold the architecture, agent rules, and design system. This file only covers what sessions kept getting wrong.

## Hard rules

- **Privacy is the top invariant.** `/painel` (anonymous kiosk) must never leak `is_private` data. RLS enforces at DB level, `filterPrivate()` at UI level. Both must hold.
- **Auth is email + password** (`signInWithPassword`, `src/lib/api/admin-auth.ts`). OTP/magic-link was removed — do not reintroduce it or trust old docs that mention it.
- **Schema truth is the live Supabase DB** (project `family-dashboard`, ref `bhivkldkdsayzhuylqxd`). Use the Supabase MCP (`list_tables`) to read it; apply changes as ordered migrations via MCP `apply_migration`, then update `supabase_schema_notes.sql`, `src/lib/types.ts`, and the mappers **in the same change**. Never leave "paste this SQL later" TODOs — that's how the notes file became self-contradicting.
- **Rendering targets:** FireTV/kiosk at 1920x1080 and iPhone Safari for admin. iOS inputs need `font-size >= 16px` (zoom prevention) and `max-width: 100%`. Screenshot both viewports with the `preview-check` skill before committing UI changes — never verify layout by deploying.
- **Never commit markers, badges, or console.logs to verify a deploy.** Use the `deploy-status` skill (Vercel MCP) or the Vercel bot comment on the PR.
- **Pull main before starting work; one fresh branch per feature; write a real PR body.** A month-long reused branch here once collided with parallel work on main and most of it was thrown away.
- UI text PT-BR, code English. No new dependencies without justification. No extra docs — update `kb/`, don't create new root-level markdown.

## Commands

```bash
npm run dev        # Vite dev server (mock data if no .env.local)
npm run build      # tsc -b && vite build
npm run lint       # ESLint
npm run test       # vitest run
npm run typecheck  # tsc --noEmit
```

Before push: `npm run lint && npm run test && npm run build` (CI runs the same).

## Plan lifecycle

Implementation plans go in `docs/plans/` and are deleted in the same PR that ships them. Session learnings go into `kb/`, not new root docs.
