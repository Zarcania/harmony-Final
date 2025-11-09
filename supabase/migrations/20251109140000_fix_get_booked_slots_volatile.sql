-- Migration: Fix get_booked_slots + get_available_slots STABLE -> VOLATILE
-- Date: 2025-11-09
-- Problème: Cache HTTP/PostgreSQL empêche certains clients de voir les nouvelles réservations
-- Solution: Marquer les fonctions comme VOLATILE pour forcer l'évaluation à chaque appel

-- 1. Fix get_booked_slots: STABLE → VOLATILE
CREATE OR REPLACE FUNCTION public.get_booked_slots(p_date date)
RETURNS SETOF tstzrange
LANGUAGE sql
VOLATILE -- Changement critique: STABLE → VOLATILE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
  SELECT ts
  FROM public.booked_slots_public
  WHERE day = p_date;
$$;

-- 2. Fix get_available_slots: STABLE → VOLATILE
-- Supprimer toutes les anciennes versions
DROP FUNCTION IF EXISTS public.get_available_slots(date, date, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_available_slots(date, integer, integer, integer) CASCADE;

-- Recréer avec VOLATILE
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_date date,
  p_duration_minutes integer,
  p_slot_step_minutes integer DEFAULT 15,
  p_buffer_minutes integer DEFAULT 0
)
RETURNS TABLE(slot_start timestamptz, slot_end timestamptz)
LANGUAGE plpgsql
VOLATILE -- Changement critique: STABLE → VOLATILE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  tz text := 'Europe/Paris';
  dow int := EXTRACT(DOW FROM p_date);
  today date := (now() AT TIME ZONE tz)::date;
  min_allowed_date date := today;
  max_allowed_date date := today + 30;
  bh record;
  windows time[] := ARRAY[]::time[];
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
BEGIN
  IF p_duration_minutes <= 0 THEN
    RAISE EXCEPTION 'duration must be > 0';
  END IF;
  IF p_slot_step_minutes <= 0 OR p_slot_step_minutes > 240 THEN
    RAISE EXCEPTION 'slot step must be between 1 and 240 minutes';
  END IF;

  IF p_date < min_allowed_date OR p_date > max_allowed_date THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.closures c
    WHERE p_date BETWEEN c.start_date AND c.end_date
  ) THEN
    RETURN;
  END IF;

  SELECT * INTO bh FROM public.business_hours WHERE day_of_week = dow;
  IF NOT FOUND OR bh.is_closed THEN
    RETURN;
  END IF;

  SELECT * INTO br FROM public.business_breaks WHERE day_of_week = dow AND enabled = true LIMIT 1;
  IF FOUND AND br.break_start IS NOT NULL AND br.break_end IS NOT NULL THEN
    break_start_ts := (p_date::timestamptz + br.break_start) AT TIME ZONE tz;
    break_end_ts   := (p_date::timestamptz + br.break_end)   AT TIME ZONE tz;
    has_break := break_end_ts > break_start_ts;
  END IF;

  IF bh.open_time IS NOT NULL AND bh.close_time IS NOT NULL THEN
    IF has_break AND bh.open_time < br.break_start AND br.break_end < bh.close_time THEN
      windows := ARRAY[bh.open_time, br.break_start, br.break_end, bh.close_time];
    ELSE
      windows := ARRAY[bh.open_time, bh.close_time];
    END IF;
  END IF;

  FOR i IN 1 .. (array_length(windows, 1) / 2) LOOP
    open_t := windows[i * 2 - 1];
    close_t := windows[i * 2];
    start_ts := (p_date::timestamptz + open_t) AT TIME ZONE tz;
    end_ts   := (p_date::timestamptz + close_t) AT TIME ZONE tz;
    slot_start_ts := start_ts;
    WHILE slot_start_ts + duration <= end_ts LOOP
      slot_end_ts := slot_start_ts + duration;
      IF NOT EXISTS (
        SELECT 1 FROM public.booked_slots_public bsp
        WHERE bsp.day = p_date
          AND bsp.ts && tstzrange(slot_start_ts, slot_end_ts, '[)')
      ) THEN
        slot_start := slot_start_ts;
        slot_end   := slot_end_ts;
        RETURN NEXT;
      END IF;
      slot_start_ts := slot_start_ts + make_interval(mins => p_slot_step_minutes);
    END LOOP;
  END LOOP;
END;
$$;
