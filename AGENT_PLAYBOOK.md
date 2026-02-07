# Agent Playbook

Rules for AI coding agents (Claude Code, Codex, etc.) working on this project.

## Before touching code

**Always read `/kb` first.**

The `/kb` directory contains structured context about the project:

| Folder | What it covers |
|--------|---------------|
| `kb/00-overview/` | What the app is, who uses it, deployment, priorities |
| `kb/01-architecture/` | Routes, data flow, privacy model, key files |
| `kb/02-supabase/` | Tables, constraints, RLS, column mappings, env vars |
| `kb/03-ux-kiosk/` | Kiosk constraints, design system, layout, UX goals |
| `kb/04-dev-workflow/` | Setup, scripts, quality bar, deployment, code conventions |
| `kb/05-backlog/` | Priorities, nice-to-haves, anti-goals |

## When to use which tool

### Claude Code (interactive)
- Planning and architecture decisions
- UX reasoning and design evaluation
- Writing and reviewing documentation
- Complex refactors that need discussion
- Debugging with context

### Codex / automated agents
- Code edits with clear scope
- Bug fixes with known reproduction
- Adding tests for existing logic
- Refactors with explicit rules (e.g., rename X to Y)
- Schema migration scripts

## PR rules

1. **Small scope** — one concern per PR
2. **Explicit goal** — state what changes and why in the PR description
3. **No feature creep** — don't "improve" surrounding code
4. **Build must pass** — `npm run build` is the gate
5. **Manual smoke test** — describe what you tested

## Code conventions

- **UI text**: Portuguese (PT-BR)
- **Code**: English (files, types, variables, functions, commits)
- **Styling**: Tailwind utility classes (no custom CSS unless necessary)
- **Components**: shadcn/ui from `src/components/ui/`
- **State**: React hooks (no Redux, no Zustand)
- **Path alias**: `@/` = `src/`
- **No emojis in code** unless explicitly requested

## Things to avoid

- Don't add monitoring (Sentry, LogRocket)
- Don't add analytics
- Don't add i18n infrastructure
- Don't add state management libraries
- Don't extract utilities that are used once
- Don't add error boundaries for unlikely scenarios
- Don't create documentation files unless asked
- Don't "improve" code you weren't asked to change
- Don't add dependencies without clear justification

## Privacy is critical

The `/painel` route is public (no auth). Never:
- Expose `is_private = true` items to anonymous users
- Show private people's real names in visit mode
- Bypass RLS policies
- Log sensitive data

## Database changes

1. Change in Supabase SQL Editor
2. Update `supabase_schema_notes.sql`
3. Update `src/lib/types.ts` if types changed
4. Update mapper in `src/hooks/useKioskData.ts` if columns changed
