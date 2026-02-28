-- Ajustes solicitados (rodar via Supabase SQL editor ou migration)

-- 1) kid_routine_checks: unique por template + date e default de completed=true
alter table kid_routine_checks
  add constraint kid_routine_checks_template_date_uniq unique (template_id, date);
alter table kid_routine_checks
  alter column completed set default true;

-- 2) settings como singleton id=1
-- Certifique-se de ter a linha:
-- insert into settings (id, visit_mode) values (1, false)
--   on conflict (id) do nothing;

-- 3) people: sort_order para ordenação
alter table people
  add column if not exists sort_order int default 0;

-- 4) Convenção de dias da semana (1=Dom, 7=Sáb) — garantir check
alter table recurring_items
  add constraint recurring_items_day_of_week_check check (day_of_week between 1 and 7);

-- 5) RLS + policies (painel publico vs admin)
alter table people enable row level security;
alter table recurring_items enable row level security;
alter table one_off_items enable row level security;
alter table kid_routine_templates enable row level security;
alter table kid_routine_checks enable row level security;
alter table replenish_items enable row level security;
alter table weekly_focus enable row level security;
alter table homeschool_notes enable row level security;
alter table settings enable row level security;

-- Public (anon) read-only
drop policy if exists "anon_read_people" on people;
create policy "anon_read_people" on people for select
  using (coalesce(is_private, false) = false);

drop policy if exists "anon_read_recurring_items" on recurring_items;
create policy "anon_read_recurring_items" on recurring_items for select
  using (coalesce(is_private, false) = false);

drop policy if exists "anon_read_one_off_items" on one_off_items;
create policy "anon_read_one_off_items" on one_off_items for select
  using (coalesce(is_private, false) = false);

drop policy if exists "anon_read_kid_routine_templates" on kid_routine_templates;
create policy "anon_read_kid_routine_templates" on kid_routine_templates for select
  using (coalesce(is_private, false) = false);

-- Observacao: kid_routine_checks nao tem is_private; use select publico para exibir checks no /painel
drop policy if exists "anon_read_kid_routine_checks" on kid_routine_checks;
create policy "anon_read_kid_routine_checks" on kid_routine_checks for select
  using (true);

drop policy if exists "anon_read_replenish_items" on replenish_items;
create policy "anon_read_replenish_items" on replenish_items for select
  using (coalesce(is_private, false) = false);

drop policy if exists "anon_read_weekly_focus" on weekly_focus;
create policy "anon_read_weekly_focus" on weekly_focus for select
  using (true);

drop policy if exists "anon_read_homeschool_notes" on homeschool_notes;
create policy "anon_read_homeschool_notes" on homeschool_notes for select
  using (coalesce(is_private, false) = false);

drop policy if exists "anon_read_settings" on settings;
create policy "anon_read_settings" on settings for select
  using (true);

-- Admin (authenticated) full access
drop policy if exists "auth_all_people" on people;
create policy "auth_all_people" on people
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "auth_all_recurring_items" on recurring_items;
create policy "auth_all_recurring_items" on recurring_items
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "auth_all_one_off_items" on one_off_items;
create policy "auth_all_one_off_items" on one_off_items
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "auth_all_kid_routine_templates" on kid_routine_templates;
create policy "auth_all_kid_routine_templates" on kid_routine_templates
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "auth_all_kid_routine_checks" on kid_routine_checks;
create policy "auth_all_kid_routine_checks" on kid_routine_checks
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "auth_all_replenish_items" on replenish_items;
create policy "auth_all_replenish_items" on replenish_items
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "auth_all_weekly_focus" on weekly_focus;
create policy "auth_all_weekly_focus" on weekly_focus
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "auth_all_homeschool_notes" on homeschool_notes;
create policy "auth_all_homeschool_notes" on homeschool_notes
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "auth_all_settings" on settings;
create policy "auth_all_settings" on settings
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 6) person_ids: multi-person events (array de UUIDs)
-- Adicionar coluna person_ids em recurring_items e one_off_items.
-- person_id (singular) é mantido para backward compat.
alter table recurring_items
  add column if not exists person_ids uuid[] default '{}';
alter table one_off_items
  add column if not exists person_ids uuid[] default '{}';

-- Migrar dados existentes: copiar person_id → person_ids onde vazio
update recurring_items
  set person_ids = array[person_id]
  where person_id is not null and (person_ids is null or person_ids = '{}');
update one_off_items
  set person_ids = array[person_id]
  where person_id is not null and (person_ids is null or person_ids = '{}');

-- 7) Auth: email+password (não OTP)
-- O app usa signInWithPassword / signUp. Para permitir sign-up sem
-- confirmação de e-mail (recomendado para uso doméstico):
--   Supabase Dashboard → Authentication → Providers → Email
--   Desmarcar "Confirm email"
