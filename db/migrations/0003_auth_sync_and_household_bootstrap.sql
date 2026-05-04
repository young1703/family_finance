-- Family Finance MVP: auth.users sync + household bootstrap RPC

-- keep public.users in sync from Supabase auth.users
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(excluded.name, public.users.name),
        avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url);

  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
after insert on auth.users
for each row
execute function public.handle_auth_user_created();

-- keep profile metadata updated when auth.user row changes
create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set email = new.email,
      name = coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', users.name),
      avatar_url = coalesce(new.raw_user_meta_data ->> 'avatar_url', users.avatar_url)
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_auth_user_updated on auth.users;
create trigger trg_auth_user_updated
after update on auth.users
for each row
execute function public.handle_auth_user_updated();

-- RPC-style function: create household and atomically register owner membership
create or replace function public.create_household_with_owner(
  p_name text,
  p_base_currency_code varchar(3) default 'KRW'
)
returns households
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household households;
begin
  v_user_id := app_user_id();

  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'household name is required';
  end if;

  insert into households (name, base_currency_code, owner_user_id)
  values (btrim(p_name), upper(p_base_currency_code), v_user_id)
  returning * into v_household;

  insert into household_members (household_id, user_id, role, status, joined_at)
  values (v_household.id, v_user_id, 'owner', 'active', now())
  on conflict (household_id, user_id) do nothing;

  return v_household;
end;
$$;

grant execute on function public.create_household_with_owner(text, varchar) to authenticated;
