DATABASE_URL ?= postgres://postgres:postgres@localhost:5432/family_finance

.PHONY: up down db-wait db-reset db-migrate db-smoke test-db typecheck

up:
	docker compose up -d postgres

down:
	docker compose down

db-wait:
	until pg_isready -d "$(DATABASE_URL)"; do echo "waiting for db..."; sleep 1; done

db-reset:
	psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -c "drop schema public cascade; create schema public;"

db-migrate:
	psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f db/migrations/0001_family_finance_init.sql
	psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f db/migrations/0002_rls_and_seeds.sql
	psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f db/migrations/0003_auth_sync_and_household_bootstrap.sql
	psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f db/migrations/0004_monthly_snapshot_recalc.sql

db-smoke:
	DATABASE_URL="$(DATABASE_URL)" ./scripts/run_migration_smoke.sh

typecheck:
	npm run typecheck

test-db: db-wait db-reset db-migrate db-smoke
