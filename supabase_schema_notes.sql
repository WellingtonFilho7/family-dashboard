-- Ajustes solicitados (rodar via Supabase SQL editor ou migration)
-- Estado-alvo do app em 2026-03-25:
-- - auth por email+senha
-- - admin criado manualmente (não via signUp público)
-- - person_ids é o modelo canônico
-- - time_text é legado e deve sair do banco quando a migração terminar

-- 0) Agenda multi-pessoa (backward-compatible)
-- Novos inserts devem gravar person_ids (uuid[]). person_id legado existe apenas
-- para compatibilidade temporária e deve ser removido depois da migração completa.
alter table recurring_items add column if not exists person_ids uuid[] default '{}';
alter table one_off_items add column if not exists person_ids uuid[] default '{}';

-- 0b) Agenda com horário de início/fim (backward-compatible)
alter table recurring_items add column if not exists start_time time default null;
alter table recurring_items add column if not exists end_time time default null;
alter table one_off_items add column if not exists start_time time default null;
alter table one_off_items add column if not exists end_time time default null;

-- End time deve ser após start time quando ambos existirem.
alter table recurring_items drop constraint if exists recurring_items_time_window_check;
alter table recurring_items
  add constraint recurring_items_time_window_check
  check (start_time is null or end_time is null or end_time > start_time);
alter table one_off_items drop constraint if exists one_off_items_time_window_check;
alter table one_off_items
  add constraint one_off_items_time_window_check
  check (start_time is null or end_time is null or end_time > start_time);

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

-- 4b) Abastecimento estruturado (catálogo em código + estado no banco)
create table if not exists supply_item_state (
  item_id text primary key,
  current_stock numeric not null default 0,
  estimated_unit_price numeric default null,
  updated_at timestamptz not null default now()
);

-- 5) RLS + policies (painel publico vs admin)
alter table people enable row level security;
alter table recurring_items enable row level security;
alter table one_off_items enable row level security;
alter table kid_routine_templates enable row level security;
alter table kid_routine_checks enable row level security;
alter table replenish_items enable row level security;
alter table supply_item_state enable row level security;
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

drop policy if exists "anon_read_supply_item_state" on supply_item_state;
create policy "anon_read_supply_item_state" on supply_item_state for select
  using (true);

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

drop policy if exists "auth_all_supply_item_state" on supply_item_state;
create policy "auth_all_supply_item_state" on supply_item_state
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

-- 6) person_ids: migrar dados existentes (person_id → person_ids)
-- Rodar APÓS a seção 0 ter criado as colunas person_ids.
update recurring_items
  set person_ids = array[person_id]
  where person_id is not null and (person_ids is null or person_ids = '{}');
update one_off_items
  set person_ids = array[person_id]
  where person_id is not null and (person_ids is null or person_ids = '{}');

-- 7) Auth: email+password (não OTP)
-- O app usa signInWithPassword e reset por e-mail.
-- Regra de produto atual:
--   - não expor signUp público para admin
--   - criar admins manualmente no Supabase Auth até existir allowlist/perfil
--   - auditar Redirect URLs e políticas reais no dashboard

-- 8) kid_routine_checks no kiosk público
-- O /painel permite que crianças marquem rotinas.
-- Isso exige que o ambiente REAL tenha uma estratégia explícita para escrita anônima
-- em kid_routine_checks (policy/RPC equivalente). Confirmar no projeto Supabase.

-- 9) time_text legado
-- O app já deriva timeText em runtime a partir de start_time / end_time.
-- Quando o ambiente estiver auditado, migrar/remover time_text:
--   alter table recurring_items drop column if exists time_text;
--   alter table one_off_items drop column if exists time_text;
