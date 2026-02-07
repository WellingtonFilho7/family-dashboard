# Seeding Data

There are no automated seed scripts. This is intentional.

## How to seed data

All data is entered through the admin UI at `/editar`.

### Steps

1. Start the app (`npm run dev` or use the deployed URL)
2. Navigate to `/editar`
3. Enter your email for OTP authentication
4. Use the admin categories to add data:
   - **Pessoas**: Add family members (name, color, type, privacy flag)
   - **Agenda**: Add recurring events (day + time) and one-off events (date + time)
   - **Rotinas**: Add daily routine templates for each child
   - **Reposicao**: Add shopping/supply items with urgency level
   - **Conteudo**: Set weekly focus/verse and homeschool notes
   - **Config**: Toggle visit mode

### Development without Supabase

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set in development,
the app automatically uses mock data from `src/lib/mockData.ts`.

The mock data includes sample people, events, routines, and homeschool notes
that mirror a realistic family setup.

### Settings singleton

The `settings` table requires exactly one row with `id = 1`:

```sql
INSERT INTO settings (id, visit_mode) VALUES (1, false)
  ON CONFLICT (id) DO NOTHING;
```

This is typically done once when setting up the Supabase project.
