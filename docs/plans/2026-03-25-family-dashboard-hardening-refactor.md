# Family Dashboard Hardening + Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hardening the app around auth, session/cache separation, schema alignment, and maintainability while refactoring the current monolith into a safer frontend architecture backed only by Supabase.

**Architecture:** Keep the deployment model as React + Vite + Supabase only, but move all Supabase access behind a frontend service layer under `src/lib/api/`. Split the current data hook into smaller read/write responsibilities, align the app to family timezone semantics, and make the database the source of truth for integrity via RLS, cascade rules, and RPC/trigger-based atomic behavior where needed.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind, Supabase (Postgres/Auth/RLS), Vitest, ESLint, GitHub Actions.

---

## Implementation Order

1. Audit real Supabase vs repo assumptions
2. Re-establish quality gates (`lint`, CI, typing, tests)
3. Remove current security contradictions (public routine writes, public sign-up, shared cache/session risk)
4. Refactor data access behind `src/lib/api/`
5. Decompose `App.tsx` and `useKioskData`
6. Align schema and client code (`person_ids`, `time_text`, windows, cascade)
7. Clean docs/archive and self-host fonts
8. Leave advanced PWA/code splitting as secondary work unless low-cost during the refactor

---

## Task 1: Audit the Real Supabase Project Before Touching Behavior

**Files:**
- Read/compare: `supabase_schema_notes.sql`
- Create/update during implementation: `docs/supabase-audit.md` or equivalent audit notes file

**Step 1: Capture the current database shape**

Run these queries in the Supabase SQL Editor and save the outputs outside the repo or in an audit note:

```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'people',
    'recurring_items',
    'one_off_items',
    'kid_routine_templates',
    'kid_routine_checks',
    'replenish_items',
    'weekly_focus',
    'homeschool_notes',
    'settings'
  )
order by table_name, ordinal_position;
```

```sql
select
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
from information_schema.table_constraints tc
where tc.table_schema = 'public'
  and tc.table_name in (
    'people',
    'recurring_items',
    'one_off_items',
    'kid_routine_templates',
    'kid_routine_checks',
    'replenish_items',
    'weekly_focus',
    'homeschool_notes',
    'settings'
  )
order by tc.table_name, tc.constraint_type, tc.constraint_name;
```

```sql
select
  tc.table_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
order by tc.table_name, tc.constraint_name;
```

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

```sql
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'people',
    'recurring_items',
    'one_off_items',
    'kid_routine_templates',
    'kid_routine_checks',
    'replenish_items',
    'weekly_focus',
    'homeschool_notes',
    'settings'
  )
order by c.relname;
```

```sql
select event_object_table as table_name, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;
```

**Step 2: Capture auth settings that SQL cannot prove**

Check manually in Supabase Dashboard:
- Authentication → Providers → Email
- Whether sign-up is enabled
- Whether email confirmation is enabled
- Existing redirect URLs
- Any custom JWT claims / access control already configured

**Step 3: Compare with repo decisions**

Confirm these expected outcomes:
- Public routine writes are supported somehow without relying on an admin session in the kiosk
- Public sign-up does **not** make arbitrary users admins
- `person_ids` is the target model
- `time_text` is on the path to removal
- cascade behavior exists or must be added for person-dependent data
- RLS reflects real public/admin behavior rather than old OTP-era assumptions

**Step 4: Record gaps before implementation**

Expected output of this audit:
- Missing columns
- Legacy columns still in use
- Missing FKs/cascade
- Missing/incorrect RLS policies
- Missing triggers/RPC support for atomic flows
- Auth config mismatches versus desired model

**Step 5: Do not implement before this audit is complete**

If the real project diverges from `supabase_schema_notes.sql`, implementation follows the real project plus your chosen target state, then updates the repo reference to match.

---

## Task 2: Re-establish Local Quality Gates and CI

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `eslint.config.js` only if needed for intentional rule configuration
- Add tests where refactors expose current gaps

**Key changes**
- CI must run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`.
- Keep `build` locally and optionally in CI later, but the minimum required merge gate is `lint`, `typecheck`, `test` per your direction.
- Treat current lint failures as implementation blockers, not follow-up cleanup.

**Acceptance**
- A PR with broken lint fails CI.
- A PR with broken tests fails CI.
- A PR with broken typing fails CI.

---

## Task 3: Security and Session/Cache Hardening

**Files:**
- Modify: `src/lib/supabase.ts`
- Modify: `src/hooks/useKioskData.ts`
- Modify: `src/pages/admin/LoginCard.tsx`
- Modify: `src/pages/EditPage.tsx`
- Modify: `public/sw.js`
- Update: `supabase_schema_notes.sql`

**Key changes**
- Remove public self-service admin sign-up from the UI.
- Treat admin access as allowlist/manual; do not grant admin rights merely by being `authenticated`.
- Separate public and admin cache keys; never let authenticated admin payloads become fallback data for the public kiosk.
- Revisit session persistence behavior given that the same browser may sometimes be used for both kiosk and admin.
- Ensure the public routine toggle path is compatible with real RLS:
  either a constrained public write policy for routine checks,
  or a database function/RPC specifically scoped to that action.
- Do not cache admin shell/data the same way as public kiosk shell if this creates exposure on shared devices.

**Acceptance**
- Public kiosk no longer depends on an accidental persisted admin session.
- Offline/public cache cannot expose admin-only data.
- Public routine toggles work with the intended permissions model.

---

## Task 4: Schema and Database Alignment

**Files:**
- Modify: `supabase_schema_notes.sql`
- Modify: client code using the old shape

**Key changes**
- Move toward `person_ids` as the canonical model and remove code dependence on `person_id`.
- Remove `time_text` as a stored source of truth; derive labels from structured times.
- Add or document cascade behavior for deleting a person and cleaning dependent records.
- Keep `weekly_focus` append-only, but query only the active/current row in UI paths.
- Treat `homeschool_notes` as one current row per child.
- Add windowed reads for `one_off_items` and `kid_routine_checks` (`-30/+30 days` or equivalent).
- Use DB-level atomicity where required (RPC/trigger) instead of fragile multi-step client flows.

**Acceptance**
- Client no longer requires legacy fields to function.
- No orphan records remain after rare person deletion.
- Focus update and similar flows cannot leave invalid partial state.

---

## Task 5: Introduce Frontend Service Layer

**Files:**
- Create: `src/lib/api/` modules grouped by domain
- Modify: `src/hooks/useKioskData.ts`
- Modify: `src/pages/admin/*.tsx`

**Key changes**
- Create thin domain modules such as:
  - `src/lib/api/family-read.ts`
  - `src/lib/api/people.ts`
  - `src/lib/api/agenda.ts`
  - `src/lib/api/routines.ts`
  - `src/lib/api/content.ts`
  - `src/lib/api/replenish.ts`
- Move raw Supabase queries out of visual components.
- Normalize mapping, filtering and error handling in one place.
- Keep UI components focused on state, rendering and calling domain actions.

**Acceptance**
- No page/admin component calls `supabase.from(...)` directly.
- Domain operations have stable typed inputs/outputs.

---

## Task 6: Decompose `App.tsx` and `useKioskData`

**Files:**
- Modify: `src/App.tsx`
- Create/move: `src/pages/panel/` or `src/components/panel/` subcomponents
- Split: `src/hooks/useKioskData.ts` into smaller hooks/helpers as needed

**Key changes**
- Extract panel sections into focused units:
  - shell/provider/debug
  - header/sidebar
  - calendar
  - kids grid
  - right column
  - QR modal
- Keep family-timezone semantics consistent across the entire panel.
- Fix the current “outside timeline window” behavior by showing condensed indicators above/below the visible hours instead of silently dropping events.
- Protect public visit-mode toggling with a 4-digit PIN (`7454`) or equivalent gated flow in the public UI.

**Acceptance**
- `src/App.tsx` no longer owns all panel concerns.
- Panel time logic is consistent with `getFamilyDate()`/family timezone.
- Early/late events remain visible via indicators.

---

## Task 7: Fix Known Admin/Data Bugs During the Refactor

**Files:**
- Modify: `src/pages/admin/ContentAdmin.tsx`
- Modify: `src/pages/admin/RoutinesAdmin.tsx`
- Modify: `src/pages/admin/PeopleAdmin.tsx`
- Modify: `src/lib/mockData.ts`
- Modify: supporting hooks/types as needed

**Key changes**
- Fix async initialization bugs in `ContentAdmin` and `RoutinesAdmin`.
- Decide whether to expose privacy selection on person creation or remove the dead form state.
- Make reorder/update flows explicit about transactional limitations unless moved to DB support.
- Fix mock one-off date values to use the expected date-only format.
- Remove `any` and resolve current lint violations as part of the refactor, not as a later cleanup.

**Acceptance**
- Admin forms hydrate correctly after async load.
- Mock mode represents real behavior more faithfully.
- Lint passes without suppressing legitimate errors.

---

## Task 8: Archive Dead Root Docs and Consolidate Living Docs

**Files:**
- Create: `docs/archive/`
- Move: root historical `.md` docs that are no longer normative
- Update: `README.md`
- Update: `kb/PROJECT.md`
- Update: `kb/WORKFLOW.md`

**Key changes**
- Move old plan/design/UX brainstorm docs out of the project root.
- Keep only living documentation as active sources of truth.
- Align auth, quality bar, kiosk behavior, and schema notes with the new target state.

**Acceptance**
- Root is cleaner.
- `kb/PROJECT.md` and `kb/WORKFLOW.md` are clearly the living rules.
- Historical docs remain available under `docs/archive/`.

---

## Task 9: Self-host Fonts and Do Minimal PWA Cleanup

**Files:**
- Modify: `src/index.css`
- Add: local font assets under `public/` or `src/assets/`
- Modify: `index.html`
- Modify: `public/manifest.json`

**Key changes**
- Remove runtime dependency on Google Fonts.
- Self-host the chosen font family.
- Replace `vite.svg` placeholder branding in manifest/icon references.
- Keep PWA work basic and safe; do not spend Priority 1 time on advanced offline behavior.

**Acceptance**
- App no longer depends on Google Fonts CDN at runtime.
- Manifest/icons stop advertising placeholder branding.

---

## Test Plan

- Unit tests for:
  - date/time derivation and family timezone paths
  - timeline window/early-late indicator logic
  - API/domain layer mappers
  - public/admin cache-key separation logic
- Integration-style component tests where feasible for:
  - admin forms hydrating after async data load
  - visit-mode PIN gating
  - public routine toggle behavior against mocked service responses
- Verification commands before completion:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
- Manual checks:
  - `/painel` renders without session leakage from admin use
  - `/editar` no longer offers open sign-up
  - deleting a person behaves consistently with cascade/data cleanup expectations
  - early/late events are represented, not silently lost

---

## Assumptions

- Same-browser kiosk/admin usage is a real scenario and must be treated as a security boundary problem.
- Public routine toggling is a required product behavior and must be explicitly supported by the DB permission model.
- `code splitting` and advanced offline/PWA behavior are Priority 2, not blockers for the first refactor wave.
- If the real Supabase project diverges from `supabase_schema_notes.sql`, the implementation must reconcile to the real environment and then update the repo reference.

---

## How to Know What Is Missing in Supabase

Use this checklist in order:

1. Run the audit queries from Task 1 in the Supabase SQL Editor.
2. Export or save the results.
3. Compare them to `supabase_schema_notes.sql`.
4. Mark each mismatch as one of:
   - missing in Supabase
   - present in Supabase but missing in repo notes
   - legacy in Supabase but should be removed
   - behavior mismatch (especially RLS/auth)
5. Check Auth dashboard settings manually because SQL will not reveal all of them.
6. Specifically verify:
   - whether `kid_routine_checks` public write path exists
   - whether admin access is truly restricted beyond plain `authenticated`
   - whether `person_id` and `time_text` still exist and are still used
   - whether cascade/FKs exist for person-linked tables
   - whether any triggers/RPCs already exist for atomic updates

If you want a simple definition: “what is missing in Supabase” is everything the repo now depends on for correctness but the real project does not yet expose in its schema, RLS, auth configuration, or triggers/RPCs.
