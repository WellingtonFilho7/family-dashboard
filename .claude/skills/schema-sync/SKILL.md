---
name: schema-sync
description: Read or change the Supabase schema safely. Use BEFORE any feature that adds/changes tables or columns, when types.ts and the DB might disagree, or when the app shows no data (project may be paused). Replaces the old workflow of hand-editing supabase_schema_notes.sql and leaving paste-this-SQL TODOs.
---

# Schema Sync (Supabase MCP)

Supabase project: **`family-dashboard`**, ref **`bhivkldkdsayzhuylqxd`**. The live DB is the source of truth — `supabase_schema_notes.sql` is documentation that has historically drifted (duplicate `person_ids` sections with conflicting defaults, columns documented after being obsoleted).

## Steps

1. **Check project status first**: `mcp__Supabase__get_project` — free-tier projects auto-pause (`INACTIVE`). If paused, ask the user before calling `restore_project`, then wait for `ACTIVE_HEALTHY`.
2. **Read the real schema**: `mcp__Supabase__list_tables` (schema `public`). Diff against `src/lib/types.ts` and `supabase_schema_notes.sql`; report any drift before building on top of it.
3. **Apply changes as migrations**: `mcp__Supabase__apply_migration` with a descriptive name (e.g. `add_supply_item_state`). Never output "run this in the SQL Editor later" — apply it, in dependency order.
4. **Same-change updates** (all in one commit): `supabase_schema_notes.sql`, `src/lib/types.ts`, the mapper (snake_case → camelCase) in `src/lib/api/`, and RLS policies for any new table.
5. **RLS check for new tables**: anon must only SELECT non-private data (`/painel` must never leak `is_private` rows); authenticated gets CRUD. Run `mcp__Supabase__get_advisors` (security) after schema changes.
6. Constraints to preserve: `day_of_week` CHECK 1-7 (1=Sun), `kid_routine_checks` UNIQUE(template_id, date), `settings` singleton id=1.
