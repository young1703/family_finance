-- Family Finance migration smoke test (manual SQL script)
-- Usage:
--   psql "$DATABASE_URL" -f db/tests/policy_smoke.sql

begin;

-- 1) core objects existence
select to_regclass('public.users') as users_tbl;
select to_regclass('public.households') as households_tbl;
select to_regclass('public.household_members') as household_members_tbl;
select to_regclass('public.nodes') as nodes_tbl;
select to_regclass('public.flows') as flows_tbl;

-- 2) expected functions existence
select proname from pg_proc where proname in (
  'app_user_id',
  'is_household_member',
  'is_household_owner',
  'can_edit_household',
  'create_household_with_owner'
) order by proname;

-- 3) RLS enabled checks
select relname, relrowsecurity
from pg_class
where relname in ('households', 'household_members', 'categories', 'nodes', 'flows', 'monthly_snapshots', 'exchange_rates')
order by relname;

-- 4) policy inventory
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where tablename in ('households', 'household_members', 'categories', 'nodes', 'flows', 'monthly_snapshots', 'exchange_rates')
order by tablename, policyname;

-- 5) seed sanity check
select count(*) as system_category_count
from categories
where source_type = 'system';

rollback;
