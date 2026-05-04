# Implementation Next Steps

## 1) SQL migration status
- Added `db/migrations/0001_family_finance_init.sql` for MVP base schema.
- Added `db/migrations/0002_rls_and_seeds.sql` for:
  - `updated_at` trigger function and table triggers (`nodes`, `flows`)
  - role-based RLS policies (owner/editor/viewer)
  - system category seed data
- Added `db/migrations/0003_auth_sync_and_household_bootstrap.sql` for:
  - `auth.users` -> `public.users` sync triggers (insert/update)
  - atomic household bootstrap RPC (`create_household_with_owner`)

## 2) Smoke-test tooling status
- Added `db/tests/policy_smoke.sql` to verify table/function existence, RLS enabled status, policy inventory, and system-category seed count.
- Added `scripts/run_migration_smoke.sh` wrapper for `psql`-based execution.

## 3) Remaining follow-up tasks
1. Add API layer and validation schemas (zod).
2. Add monthly snapshot recalculation job.
3. Add CI integration for migration smoke tests.
## 2) Remaining follow-up tasks
1. Add API layer and validation schemas (zod).
2. Add monthly snapshot recalculation job.
3. Add automated migration tests (schema + policy smoke tests).
4. Implement dashboard graph UI and connect with RLS-protected endpoints.
