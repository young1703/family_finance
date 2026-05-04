-- Family Finance MVP: monthly snapshot recalculation RPC

create or replace function public.recalculate_monthly_snapshots(
  p_household_id uuid,
  p_month char(7),
  p_overwrite boolean default true
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start_date date;
  v_end_date date;
  v_rows integer := 0;
begin
  if p_household_id is null then
    raise exception 'household_id is required';
  end if;

  if p_month is null or p_month !~ '^\d{4}-(0[1-9]|1[0-2])$' then
    raise exception 'month must be YYYY-MM';
  end if;

  if not can_edit_household(p_household_id) then
    raise exception 'permission denied for household %', p_household_id;
  end if;

  v_start_date := to_date(p_month || '-01', 'YYYY-MM-DD');
  v_end_date := (v_start_date + interval '1 month - 1 day')::date;

  if p_overwrite then
    delete from monthly_snapshots
    where household_id = p_household_id
      and month = p_month;
  end if;

  with active_nodes as (
    select n.id as node_id, n.current_balance
    from nodes n
    where n.household_id = p_household_id
      and n.is_active = true
  ),
  relevant_flows as (
    select f.*
    from flows f
    where f.household_id = p_household_id
      and f.is_active = true
      and f.start_date <= v_end_date
      and coalesce(f.end_date, v_end_date) >= v_start_date
  ),
  inflow as (
    select rf.to_node_id as node_id, sum(rf.amount)::numeric(18,2) as inflow_amount
    from relevant_flows rf
    group by rf.to_node_id
  ),
  outflow as (
    select rf.from_node_id as node_id, sum(rf.amount)::numeric(18,2) as outflow_amount
    from relevant_flows rf
    group by rf.from_node_id
  )
  insert into monthly_snapshots (
    household_id,
    month,
    node_id,
    inflow_amount_base,
    outflow_amount_base,
    balance_amount_base,
    recalculated_at
  )
  select
    p_household_id,
    p_month,
    an.node_id,
    coalesce(i.inflow_amount, 0),
    coalesce(o.outflow_amount, 0),
    an.current_balance,
    now()
  from active_nodes an
  left join inflow i on i.node_id = an.node_id
  left join outflow o on o.node_id = an.node_id
  on conflict (household_id, month, node_id) do update
    set inflow_amount_base = excluded.inflow_amount_base,
        outflow_amount_base = excluded.outflow_amount_base,
        balance_amount_base = excluded.balance_amount_base,
        recalculated_at = now();

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

grant execute on function public.recalculate_monthly_snapshots(uuid, char, boolean) to authenticated;
