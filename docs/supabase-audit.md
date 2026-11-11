# Supabase Audit Checklist

Use este documento para comparar o projeto Supabase real com o estado esperado pelo repo.

## Objetivo

Confirmar:
- colunas e tipos reais
- constraints e foreign keys
- RLS e policies
- triggers/RPCs existentes
- configuração de autenticação que o SQL não revela

O resultado esperado é uma lista clara de:
- `faltando no Supabase`
- `faltando no repo`
- `legado para remover`
- `mismatch de comportamento`

## 1. Colunas e defaults

Rode no SQL Editor:

```sql
select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
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

Compare com:
- `supabase_schema_notes.sql`
- `src/lib/types.ts`
- `src/hooks/useKioskData.ts`

Verifique especialmente:
- se `person_ids` existe e está pronto para ser o modelo canônico
- se `person_id` ainda existe
- se `time_text` ainda existe
- se `start_time` e `end_time` existem nas tabelas de agenda
- se `visit_mode` existe em `settings`

## 2. Constraints e unicidade

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

Confirme:
- unique em `kid_routine_checks(template_id, date)`
- check de `day_of_week`
- check de janela de horário
- existência de singleton/garantia equivalente para `settings`

## 3. Foreign keys e cascade

```sql
select
  tc.table_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  rc.delete_rule,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.table_schema = tc.table_schema
join information_schema.referential_constraints rc
  on rc.constraint_name = tc.constraint_name
 and rc.constraint_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
order by tc.table_name, tc.constraint_name;
```

Confirme:
- quais tabelas dependem de `people`
- se a regra de deleção está em `CASCADE`
- se ainda faltam FKs importantes

## 4. RLS e policies

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
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
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Confirme:
- se todas as tabelas relevantes têm RLS habilitado
- se `anon` consegue ler o que o painel público precisa
- se `kid_routine_checks` tem um caminho explícito e seguro para escrita pública
- se admin está restrito de forma mais forte do que apenas `authenticated`, caso o projeto real já tenha evoluído

## 5. Triggers, funções e RPCs

```sql
select
  event_object_table as table_name,
  trigger_name,
  action_timing,
  event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;
```

```sql
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public')
order by n.nspname, p.proname;
```

Confirme:
- se já existe trigger/função para operações atômicas
- se há RPC útil para `weekly_focus` ou rotina pública

## 6. Configuração de Auth no Dashboard

Cheque manualmente em Supabase Dashboard:
- Authentication → Providers → Email
- se signup está habilitado
- se email confirmation está habilitado
- redirect URLs
- qualquer regra de allowlist, claim, role ou perfil administrativo

## 7. Gaps a marcar explicitamente

Quando terminar, responda esta matriz:

- `person_ids` existe? está populado?
- `person_id` ainda existe? ainda é usado?
- `time_text` ainda existe?
- `kid_routine_checks` permite escrita pública segura?
- existe separação real entre usuário autenticado comum e admin?
- existem FKs + cascade para dados ligados a `people`?
- `weekly_focus` já tem suporte atômico?
- há triggers/RPCs no projeto real que não estão em `supabase_schema_notes.sql`?

## 8. Resultado mínimo esperado

Se você me trouxer os outputs ou um resumo fiel desses pontos, eu consigo dizer com precisão:
- o que falta criar no Supabase
- o que precisa ser removido do Supabase
- o que precisa ser atualizado no repo para refletir o ambiente real
