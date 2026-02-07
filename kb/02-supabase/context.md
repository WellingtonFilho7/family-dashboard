# Supabase

## Tables

| Table | Purpose | Has `is_private`? |
|-------|---------|-------------------|
| `people` | Family members (kids, adults, guests) | Yes |
| `recurring_items` | Weekly schedule (day-of-week based) | Yes |
| `one_off_items` | One-time events (date based) | Yes |
| `kid_routine_templates` | Daily routine task definitions | Yes |
| `kid_routine_checks` | Routine completion tracking | No |
| `replenish_items` | Shopping / supply list | Yes |
| `weekly_focus` | Scripture / family focus of the week | No |
| `homeschool_notes` | Education topics per child | Yes |
| `settings` | App config (singleton, id=1) | No |

## Key constraints

- `recurring_items.day_of_week`: CHECK between 1 and 7 (1=Sun, 7=Sat)
- `kid_routine_checks`: UNIQUE(template_id, date) — one check per routine per day
- `kid_routine_checks.completed`: defaults to `true`
- `settings`: singleton pattern — always `id = 1`
- `people.sort_order`: int, default 0 — controls display order

## Column naming

Database uses **snake_case**. The app maps to **camelCase** in `useKioskData.ts`:

```
DB: person_id  →  TS: personId
DB: day_of_week  →  TS: dayOfWeek
DB: is_private  →  TS: isPrivate
DB: time_text  →  TS: timeText
DB: sort_order  →  TS: sortOrder
DB: is_active  →  TS: isActive
DB: kid_person_id  →  TS: kidPersonId
DB: template_id  →  TS: templateId
DB: created_at  →  TS: createdAt
DB: visit_mode  →  TS: visitMode
```

## RLS strategy

All tables have RLS enabled.

**Anonymous (anon) — used by `/painel`:**
- SELECT only
- Filtered: `coalesce(is_private, false) = false`
- Exception: `kid_routine_checks`, `weekly_focus`, `settings` → open SELECT

**Authenticated — used by `/editar`:**
- Full CRUD (all operations)
- Policy: `auth.role() = 'authenticated'`

## Authentication

- Method: OTP via email (Supabase Auth)
- No passwords
- Redirect URLs must be configured in Supabase dashboard:
  - Production: `https://<domain>/editar`
  - Development: `http://localhost:5173/editar`

## Schema management

- **No formal migration system** — intentionally lightweight
- Schema changes are made via **Supabase SQL Editor**
- `supabase_schema_notes.sql` is the canonical schema reference
- **Rule**: Any DB change must update `supabase_schema_notes.sql`

## Environment variables

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_FAMILY_TIMEZONE=America/Sao_Paulo    # optional, default shown
VITE_DEBUG_SUPABASE=true                  # optional, enables debug logs
```

These are **build-time** variables (Vite inlines them). Changing them on Vercel requires a redeploy.
