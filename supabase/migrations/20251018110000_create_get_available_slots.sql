-- Create RPC to compute available slots per day (30-min steps)
-- Inputs:
--   p_date text or date (YYYY-MM-DD)
--   p_service_id uuid (optional, reserved for future duration-based logic)
-- Output: text[] of 'HH:MM' sorted ascending, Europe/Paris future-only for current day

create or replace function public.get_available_slots(p_date text, p_service_id uuid default null)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date := to_date(p_date, 'YYYY-MM-DD');
  v_isodow int := extract(isodow from v_date); -- 1(lundi)..7(dimanche)
  v_dow_for_bh int := v_isodow - 1;            -- our business_hours uses 0=lundi
  v_open time;
  v_close time;
  v_closed boolean := false;
  v_is_date_closed boolean := false;
  v_now_paris time := (now() at time zone 'Europe/Paris')::time;
  v_today_paris date := (now() at time zone 'Europe/Paris')::date;
  v_slots text[] := '{}';
begin
  -- Get business hours for that day
  select 
    coalesce(open_time, null)::time,
    coalesce(close_time, null)::time,
    coalesce(closed, is_closed, false)
  into v_open, v_close, v_closed
  from business_hours
  where day_of_week = v_dow_for_bh
  limit 1;

  if v_closed is null then
    v_closed := true; -- no row = considered closed
  end if;

  -- Check closures
  select exists (
    select 1 from closures c
    where v_date between c.start_date and c.end_date
  ) into v_is_date_closed;

  if v_closed or v_open is null or v_close is null or v_is_date_closed then
    return v_slots; -- empty
  end if;

  -- Generate 30-min slots between open and close (exclusive of end)
  with s as (
    select generate_series(
      (v_date::timestamp + v_open::interval),
      (v_date::timestamp + v_close::interval - interval '30 minutes'),
      interval '30 minutes'
    ) as ts
  ),
  s2 as (
    -- remove past times if same Paris day
    select to_char(ts::time, 'HH24:MI') as hhmm
    from s
    where case when v_date = v_today_paris then (ts::time > v_now_paris) else true end
  ),
  booked as (
    select b.preferred_time as hhmm
    from bookings b
    where b.preferred_date = v_date
      and coalesce(b.status, 'pending') <> 'cancelled'
  )
  select coalesce(array_agg(hhmm order by hhmm), '{}') into v_slots
  from (
    select s2.hhmm
    from s2
    where not exists (
      select 1 from booked b where b.hhmm = s2.hhmm
    )
  ) x;

  return v_slots;
end;
$$;

grant execute on function public.get_available_slots(text, uuid) to anon, authenticated;
