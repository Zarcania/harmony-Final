-- Fix day_of_week mapping to 0=Monday..6=Sunday using isodow
create or replace function public.get_available_slots(
  p_date date,
  p_duration_minutes integer,
  p_slot_step_minutes integer default 15,
  p_buffer_minutes integer default 0
)
returns table(slot_start timestamptz, slot_end timestamptz)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  tz text := 'Europe/Paris';
  -- isodow: 1=Monday..7=Sunday => shift to 0..6 with Monday=0
  dow int := extract(isodow from p_date)::int - 1;
  today date := (now() at time zone tz)::date;
  min_allowed_date date := today;
  max_allowed_date date := today + public.get_setting_int('booking_max_days', 30);
  bh record;
  windows time[] := array[]::time[];
  open_t time;
  close_t time;
  start_ts timestamptz;
  end_ts timestamptz;
  slot_start_ts timestamptz;
  slot_end_ts timestamptz;
  duration interval := make_interval(mins => p_duration_minutes + p_buffer_minutes);
  br record;
  break_start_ts timestamptz;
  break_end_ts timestamptz;
  has_break boolean := false;
begin
  if p_duration_minutes <= 0 then
    raise exception 'duration must be > 0';
  end if;
  if p_slot_step_minutes <= 0 or p_slot_step_minutes > 240 then
    raise exception 'slot step must be between 1 and 240 minutes';
  end if;

  if p_date < min_allowed_date or p_date > max_allowed_date then
    return; -- outside window
  end if;

  if exists (
    select 1 from public.closures c
    where p_date between c.start_date and c.end_date
  ) then
    return; -- closed
  end if;

  select * into bh from public.business_hours where day_of_week = dow;
  if not found or bh.is_closed then
    return;
  end if;

  select * into br from public.business_breaks where day_of_week = dow and enabled = true limit 1;
  if found and br.break_start is not null and br.break_end is not null then
    break_start_ts := (p_date::timestamptz + br.break_start) at time zone tz;
    break_end_ts   := (p_date::timestamptz + br.break_end)   at time zone tz;
    has_break := break_end_ts > break_start_ts;
  end if;

  if bh.open_time_morning is not null and bh.close_time_morning is not null then
    windows := windows || bh.open_time_morning || bh.close_time_morning;
  end if;
  if bh.open_time_afternoon is not null and bh.close_time_afternoon is not null then
    windows := windows || bh.open_time_afternoon || bh.close_time_afternoon;
  end if;
  if array_length(windows,1) is null then
    if bh.open_time is not null and bh.close_time is not null then
      windows := array[bh.open_time, bh.close_time];
    else
      return;
    end if;
  end if;

  for i in 1..array_length(windows,1) by 2 loop
    open_t := windows[i];
    close_t := windows[i+1];
    start_ts := (p_date::timestamptz + open_t) at time zone tz;
    end_ts   := (p_date::timestamptz + close_t) at time zone tz;

    slot_start_ts := start_ts;
    loop
      slot_end_ts := slot_start_ts + duration;
      exit when slot_end_ts > end_ts;

      if not (has_break and slot_start_ts < break_end_ts and slot_end_ts > break_start_ts) then
        if not exists (
          select 1 from public.bookings b
          where b.status <> 'cancelled'
            and b.ts && tstzrange(slot_start_ts, slot_end_ts, '[)')
        ) then
          slot_start := slot_start_ts;
          slot_end := slot_end_ts;
          return next;
        end if;
      end if;

      slot_start_ts := slot_start_ts + make_interval(mins => p_slot_step_minutes);
      exit when slot_start_ts + duration > end_ts;
    end loop;
  end loop;
end;
$$;

grant all on function public.get_available_slots(date, integer, integer, integer) to anon, authenticated, service_role;
