# Backlog

## Top 5 priorities

1. **Auto-refresh on kiosk** — panel goes stale after hours; needs periodic data reload or Supabase real-time subscription
2. **Inline editing in `/editar`** — currently must delete + recreate to edit; needs edit-in-place for people, agenda items, routines
3. **Better empty states** — generic "nothing here" text should show helpful context and optional action buttons
4. **Progress bars for kids' routines** — visual progress indicator (X of Y done) with celebration at 100%
5. **Offline resilience** — show last-known data when network drops; display offline indicator

## Nice-to-have

- Dark mode (useful for evening kiosk display)
- PWA manifest (installable on iPad home screen)
- Undo on delete (toast with restore action)
- Export/import data backup (JSON)
- Drag-and-drop reorder for people and routines
- Admin search/filter within categories
- `?mode=tv` alias for `?desktop=1`

## Anti-goals

These are explicitly out of scope:

- **No enterprise analytics** — no dashboards about dashboards
- **No heavy logging stacks** — console.log is fine
- **No overbuilt CI** — a simple build check is enough
- **No premature scaling** — single family, single Supabase project
- **No i18n** — Portuguese only, forever
- **No multi-tenant** — one family, one database
- **No user roles beyond anon/authenticated** — two levels is enough
- **No third-party monitoring** — Sentry, LogRocket, etc. are overkill
- **No component library extraction** — shadcn/ui is already there
- **No micro-frontends** — it's one SPA with two routes
