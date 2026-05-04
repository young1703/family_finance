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
1. Add monthly snapshot recalculation job.
2. Implement dashboard graph UI and connect with RLS-protected endpoints.

## 4) Completed since initial plan
- API layer scaffolding and validation schemas were added under `src/api`.
- CI integration was added at `.github/workflows/ci.yml`:
  - TypeScript typecheck job
  - PostgreSQL-backed migration + smoke-test job


## Git/PR workflow (to reduce conflicts)

- Before starting each task, sync base and rebase work branch:
  - `./scripts/sync_base.sh main work`
- Open a fresh feature branch per PR from `main` when possible.
- Keep PRs small (schema, API, UI split) to reduce merge conflicts.
