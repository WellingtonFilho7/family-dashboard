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
