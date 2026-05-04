-- Family Finance MVP: RLS policies, updated_at triggers, and system category seeds

-- helper: updated_at trigger function
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- attach updated_at triggers
create trigger trg_nodes_set_updated_at
before update on nodes
for each row
execute function set_updated_at();

create trigger trg_flows_set_updated_at
before update on flows
for each row
execute function set_updated_at();

-- helper: current app user id from Supabase JWT sub claim
create or replace function app_user_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.uid()::text, '')::uuid;
$$;

-- helper: membership checks
create or replace function is_household_member(target_household uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from household_members hm
    where hm.household_id = target_household
      and hm.user_id = app_user_id()
      and hm.status = 'active'
  );
$$;

create or replace function is_household_owner(target_household uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from household_members hm
    where hm.household_id = target_household
      and hm.user_id = app_user_id()
      and hm.role = 'owner'
      and hm.status = 'active'
  );
$$;

create or replace function can_edit_household(target_household uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from household_members hm
    where hm.household_id = target_household
      and hm.user_id = app_user_id()
      and hm.role in ('owner', 'editor')
      and hm.status = 'active'
  );
$$;

-- enable RLS
alter table households enable row level security;
alter table household_members enable row level security;
alter table categories enable row level security;
alter table nodes enable row level security;
alter table flows enable row level security;
alter table monthly_snapshots enable row level security;

-- households policies
create policy households_select_member on households
for select
using (is_household_member(id));

create policy households_insert_owner on households
for insert
with check (owner_user_id = app_user_id());

create policy households_update_owner on households
for update
using (is_household_owner(id))
with check (is_household_owner(id));

create policy households_delete_owner on households
for delete
using (is_household_owner(id));

-- household_members policies
create policy members_select_member on household_members
for select
using (is_household_member(household_id));

create policy members_insert_owner on household_members
for insert
with check (is_household_owner(household_id));

create policy members_update_owner on household_members
for update
using (is_household_owner(household_id))
with check (is_household_owner(household_id));

create policy members_delete_owner on household_members
for delete
using (is_household_owner(household_id));

-- categories policies
create policy categories_select_member on categories
for select
using (
  source_type = 'system'
  or (household_id is not null and is_household_member(household_id))
);

create policy categories_insert_editor on categories
for insert
with check (
  source_type = 'user'
  and household_id is not null
  and can_edit_household(household_id)
);

create policy categories_update_editor on categories
for update
using (
  source_type = 'user'
  and household_id is not null
  and can_edit_household(household_id)
)
with check (
  source_type = 'user'
  and household_id is not null
  and can_edit_household(household_id)
);

create policy categories_delete_editor on categories
for delete
using (
  source_type = 'user'
  and household_id is not null
  and can_edit_household(household_id)
);

-- nodes policies
create policy nodes_select_member on nodes
for select
using (is_household_member(household_id));

create policy nodes_insert_editor on nodes
for insert
with check (can_edit_household(household_id));

create policy nodes_update_editor on nodes
for update
using (can_edit_household(household_id))
with check (can_edit_household(household_id));

create policy nodes_delete_editor on nodes
for delete
using (can_edit_household(household_id));

-- flows policies
create policy flows_select_member on flows
for select
using (is_household_member(household_id));

create policy flows_insert_editor on flows
for insert
with check (can_edit_household(household_id));

create policy flows_update_editor on flows
for update
using (can_edit_household(household_id))
with check (can_edit_household(household_id));

create policy flows_delete_editor on flows
for delete
using (can_edit_household(household_id));

-- snapshots policies
create policy snapshots_select_member on monthly_snapshots
for select
using (is_household_member(household_id));

create policy snapshots_write_editor on monthly_snapshots
for all
using (can_edit_household(household_id))
with check (can_edit_household(household_id));

-- exchange rates are globally readable (household-independent)
alter table exchange_rates enable row level security;
create policy fx_select_all_authenticated on exchange_rates
for select
using (app_user_id() is not null);

-- system category seeds (global)
insert into categories (household_id, source_type, name, color, icon, created_by)
values
  (null, 'system', '급여', '#4CAF50', 'wallet', null),
  (null, 'system', '부수입', '#66BB6A', 'cash-plus', null),
  (null, 'system', '이자/배당', '#81C784', 'chart-line', null),
  (null, 'system', '기타수입', '#A5D6A7', 'dots-horizontal', null),
  (null, 'system', '입출금계좌', '#42A5F5', 'bank', null),
  (null, 'system', '예금', '#64B5F6', 'safe', null),
  (null, 'system', '적금', '#90CAF9', 'piggy-bank', null),
  (null, 'system', '투자계좌', '#BBDEFB', 'chart-areaspline', null),
  (null, 'system', '현금지갑', '#E3F2FD', 'wallet-outline', null),
  (null, 'system', '주거비', '#FF7043', 'home', null),
  (null, 'system', '통신비', '#FF8A65', 'cellphone', null),
  (null, 'system', '보험료', '#FFAB91', 'shield-check', null),
  (null, 'system', '구독서비스', '#FFCCBC', 'playlist-star', null),
  (null, 'system', '교육비(고정)', '#F4511E', 'school', null),
  (null, 'system', '식비', '#FFA726', 'food-fork-drink', null),
  (null, 'system', '생활용품', '#FFB74D', 'basket', null),
  (null, 'system', '교통비', '#FFCC80', 'bus', null),
  (null, 'system', '의료비', '#FFE0B2', 'hospital-box', null),
  (null, 'system', '여가/취미', '#AB47BC', 'gamepad-variant', null),
  (null, 'system', '경조사/선물', '#CE93D8', 'gift', null),
  (null, 'system', '비상금', '#26A69A', 'alert-circle', null),
  (null, 'system', '단기목표', '#4DB6AC', 'flag-checkered', null),
  (null, 'system', '장기목표', '#80CBC4', 'target', null)
on conflict do nothing;
