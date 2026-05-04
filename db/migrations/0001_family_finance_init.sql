-- Family Finance MVP initial schema (PostgreSQL/Supabase)

create extension if not exists pgcrypto;

-- users profile table (auth.users references omitted in local draft)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_currency_code varchar(3) not null default 'KRW',
  owner_user_id uuid not null references users(id),
  created_at timestamptz not null default now()
);

create type member_role as enum ('owner', 'editor', 'viewer');
create type member_status as enum ('active', 'invited');

create table if not exists household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role member_role not null,
  status member_status not null default 'active',
  invited_at timestamptz,
  joined_at timestamptz,
  primary key (household_id, user_id)
);

create type category_source_type as enum ('system', 'user');

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  source_type category_source_type not null,
  name text not null,
  color text,
  icon text,
  parent_category_id uuid references categories(id),
  is_active boolean not null default true,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create type node_type as enum ('income', 'account', 'saving', 'expense', 'subscription', 'custom');

create table if not exists nodes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  node_type node_type not null,
  category_id uuid references categories(id),
  currency_code varchar(3) not null,
  current_balance numeric(18,2) not null default 0,
  monthly_inflow numeric(18,2) not null default 0,
  pos_x numeric(10,2),
  pos_y numeric(10,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type flow_cycle as enum ('monthly', 'weekly', 'daily', 'once');

create table if not exists flows (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  from_node_id uuid not null references nodes(id) on delete cascade,
  to_node_id uuid not null references nodes(id) on delete cascade,
  amount numeric(18,2) not null check (amount >= 0),
  currency_code varchar(3) not null,
  cycle flow_cycle not null,
  day_of_month int check (day_of_month between 1 and 31),
  auto_transfer boolean not null default false,
  start_date date not null,
  end_date date,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists exchange_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency_code varchar(3) not null,
  quote_currency_code varchar(3) not null,
  rate numeric(18,8) not null check (rate > 0),
  provider text not null,
  fetched_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists monthly_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  month char(7) not null,
  node_id uuid not null references nodes(id) on delete cascade,
  inflow_amount_base numeric(18,2) not null default 0,
  outflow_amount_base numeric(18,2) not null default 0,
  balance_amount_base numeric(18,2) not null default 0,
  recalculated_at timestamptz not null default now(),
  unique (household_id, month, node_id)
);

create index if not exists idx_nodes_household_active on nodes(household_id, is_active);
create index if not exists idx_flows_household_active_cycle on flows(household_id, is_active, cycle);
create index if not exists idx_flows_from_node on flows(from_node_id);
create index if not exists idx_flows_to_node on flows(to_node_id);
create index if not exists idx_categories_household_source_active on categories(household_id, source_type, is_active);
create index if not exists idx_exchange_rates_pair_fetched_at on exchange_rates(base_currency_code, quote_currency_code, fetched_at desc);

-- NOTE: RLS policy examples should be applied after auth integration.
