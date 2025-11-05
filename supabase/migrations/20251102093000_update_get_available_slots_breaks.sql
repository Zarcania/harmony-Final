-- Update get_available_slots to account for lunch breaks (business_breaks)
-- Safe to run multiple times
create or replace function public.get_available_slots(
  p_date date,
  p_duration_minutes int,
  p_slot_step_minutes int default 15,
  p_buffer_minutes int default 0
) returns table(slot_start timestamptz, slot_end timestamptz)
language plpgsql stable
set search_path = public, extensions
as $$
declare
  tz text := 'Europe/Paris';
  dow int := extract(dow from p_date);
  today date := (now() at time zone tz)::date;
  min_allowed_date date := today + 1; -- no same-day bookings
  max_allowed_date date := today + 30; -- 30-day window
  bh record;
  windows time[] := array[]::time[];
  open_t time; close_t time;
  start_ts timestamptz; end_ts timestamptz;
  slot_start_ts timestamptz; slot_end_ts timestamptz;
  duration interval := make_interval(mins => p_duration_minutes + p_buffer_minutes);
  br record; brange tstzrange;
begin
  if p_duration_minutes <= 0 then raise exception 'duration must be > 0'; end if;
  if p_slot_step_minutes <= 0 or p_slot_step_minutes > 240 then raise exception 'slot step must be between 1 and 240 minutes'; end if;

  if p_date < min_allowed_date or p_date > max_allowed_date then return; end if;

  if exists(select 1 from public.closures c where p_date between c.start_date and c.end_date) then return; end if;

  select * into bh from public.business_hours where day_of_week = dow;
  if not found or coalesce(bh.is_closed, false) then return; end if;

  -- windows (prefer AM/PM)
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

  -- optional lunch break range (if configured)
  begin
    select * into br from public.business_breaks where day_of_week = dow and enabled is true;
    if found and br.break_start is not null and br.break_end is not null then
      brange := tstzrange((p_date::timestamptz + br.break_start), (p_date::timestamptz + br.break_end), '[)');
    else
      brange := null;
    end if;
  exception when others then
    brange := null;
  end;

  for i in 1..array_length(windows,1) by 2 loop
    open_t := windows[i];
    close_t := windows[i+1];
    start_ts := (p_date::timestamptz + open_t) at time zone tz;
    end_ts   := (p_date::timestamptz + close_t) at time zone tz;

    slot_start_ts := start_ts;
    loop
      slot_end_ts := slot_start_ts + duration;
      exit when slot_end_ts > end_ts;

      -- skip if overlaps break
      if brange is not null then
        if tstzrange(slot_start_ts, slot_end_ts, '[)') && brange then
          slot_start_ts := slot_start_ts + make_interval(mins => p_slot_step_minutes);
          exit when slot_start_ts + duration > end_ts;
          continue;
        end if;
      end if;

      if not exists (
        select 1 from public.bookings b
        where b.status <> 'cancelled'
          and (b.start_at is not null and b.end_at is not null)
          and ((slot_start_ts, slot_end_ts) overlaps (((p_date + b.start_at::time)::timestamptz at time zone tz), ((p_date + b.end_at::time)::timestamptz at time zone tz)))
      ) then
        slot_start := slot_start_ts; slot_end := slot_end_ts; return next;
      end if;

      slot_start_ts := slot_start_ts + make_interval(mins => p_slot_step_minutes);
      exit when slot_start_ts + duration > end_ts;
    end loop;
  end loop;
end;
$$;