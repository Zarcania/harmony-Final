-- Add lunch breaks exclusion to public.get_available_slots
-- This migration replaces the function to exclude any slot overlapping a configured business_break for the day.

CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_date date,
  p_duration_minutes integer,
  p_slot_step_minutes integer DEFAULT 15,
  p_buffer_minutes integer DEFAULT 0
) RETURNS TABLE(slot_start timestamptz, slot_end timestamptz)
LANGUAGE plpgsql STABLE
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  tz text := 'Europe/Paris';
  dow int := EXTRACT(DOW FROM p_date);
  today date := (now() AT TIME ZONE tz)::date;
  min_allowed_date date := today + 1; -- no same-day bookings
  max_allowed_date date := today + 30; -- window 30 days
  bh record;
  windows time[] := ARRAY[]::time[];
  open_t time;
  close_t time;
  start_ts timestamptz;
  end_ts timestamptz;
  slot_start_ts timestamptz;
  slot_end_ts timestamptz;
  duration interval := make_interval(mins => p_duration_minutes + p_buffer_minutes);
  -- Break handling
  br record;
  break_start_ts timestamptz;
  break_end_ts timestamptz;
  has_break boolean := false;
BEGIN
  -- guard rails
  IF p_duration_minutes <= 0 THEN
    RAISE EXCEPTION 'duration must be > 0';
  END IF;
  IF p_slot_step_minutes <= 0 OR p_slot_step_minutes > 240 THEN
    RAISE EXCEPTION 'slot step must be between 1 and 240 minutes';
  END IF;

  -- date window checks
  IF p_date < min_allowed_date OR p_date > max_allowed_date THEN
    RETURN; -- empty set
  END IF;

  -- closures check
  IF EXISTS (
    SELECT 1 FROM public.closures c
    WHERE p_date BETWEEN c.start_date AND c.end_date
  ) THEN
    RETURN; -- empty set
  END IF;

  -- business hours for day
  SELECT * INTO bh FROM public.business_hours WHERE day_of_week = dow;
  IF NOT FOUND OR bh.is_closed THEN
    RETURN; -- empty set
  END IF;

  -- derive optional break window for the day
  SELECT * INTO br FROM public.business_breaks WHERE day_of_week = dow AND enabled = true LIMIT 1;
  IF FOUND AND br.break_start IS NOT NULL AND br.break_end IS NOT NULL THEN
    break_start_ts := (p_date::timestamptz + br.break_start) AT TIME ZONE tz;
    break_end_ts   := (p_date::timestamptz + br.break_end)   AT TIME ZONE tz;
    has_break := break_end_ts > break_start_ts;
  END IF;

  -- Build working windows: prefer split schedule if provided, else fallback to single window
  IF bh.open_time_morning IS NOT NULL AND bh.close_time_morning IS NOT NULL THEN
    windows := windows || bh.open_time_morning || bh.close_time_morning;
  END IF;
  IF bh.open_time_afternoon IS NOT NULL AND bh.close_time_afternoon IS NOT NULL THEN
    windows := windows || bh.open_time_afternoon || bh.close_time_afternoon;
  END IF;
  IF array_length(windows,1) IS NULL THEN
    IF bh.open_time IS NOT NULL AND bh.close_time IS NOT NULL THEN
      windows := ARRAY[bh.open_time, bh.close_time];
    ELSE
      RETURN; -- nothing configured
    END IF;
  END IF;

  -- Iterate windows pairwise
  FOR i IN 1..array_length(windows,1) BY 2 LOOP
    open_t := windows[i];
    close_t := windows[i+1];
    -- Build day-bounded timestamps in tz
    start_ts := (p_date::timestamptz + open_t) AT TIME ZONE tz; -- convert local time to timestamptz
    end_ts   := (p_date::timestamptz + close_t) AT TIME ZONE tz;

    -- Generate stepped slots inside [start_ts, end_ts - duration]
    slot_start_ts := start_ts;
    LOOP
      slot_end_ts := slot_start_ts + duration;
      EXIT WHEN slot_end_ts > end_ts;

      -- Skip slots that overlap a configured break
      IF NOT (has_break AND slot_start_ts < break_end_ts AND slot_end_ts > break_start_ts) THEN
        -- overlap check with existing bookings for the same calendar day
        IF NOT EXISTS (
          SELECT 1
          FROM public.bookings b
          WHERE b.status <> 'cancelled'
            AND (b.start_at IS NOT NULL AND b.end_at IS NOT NULL)
            AND ((slot_start_ts, slot_end_ts) OVERLAPS (((p_date + b.start_at::time)::timestamptz AT TIME ZONE tz), ((p_date + b.end_at::time)::timestamptz AT TIME ZONE tz)))
        ) THEN
          slot_start := slot_start_ts;
          slot_end := slot_end_ts;
          RETURN NEXT;
        END IF;
      END IF;

      slot_start_ts := slot_start_ts + make_interval(mins => p_slot_step_minutes);
      EXIT WHEN slot_start_ts + duration > end_ts;
    END LOOP;
  END LOOP;
END;
$$;
