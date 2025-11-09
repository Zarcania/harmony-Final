-- Migration: Supprimer le système de business_breaks de get_available_slots
-- Date: 2025-11-09
-- Problème: La fonction échoue car elle cherche business_breaks qui n'existe pas/plus
-- Solution: Simplifier la fonction sans gestion des pauses déjeuner

DROP FUNCTION IF EXISTS public.get_available_slots(date, integer, integer, integer) CASCADE;

CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_date date,
  p_duration_minutes integer,
  p_slot_step_minutes integer DEFAULT 15,
  p_buffer_minutes integer DEFAULT 0
)
RETURNS TABLE(slot_start timestamptz, slot_end timestamptz)
LANGUAGE plpgsql
VOLATILE
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
  open_t time;
  close_t time;
  start_ts timestamptz;
  end_ts timestamptz;
  slot_start_ts timestamptz;
  slot_end_ts timestamptz;
  duration interval := make_interval(mins => p_duration_minutes + p_buffer_minutes);
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

  IF bh.open_time IS NOT NULL AND bh.close_time IS NOT NULL THEN
    open_t := bh.open_time;
    close_t := bh.close_time;
    start_ts := ((p_date || ' ' || open_t::text)::timestamp AT TIME ZONE tz);
    end_ts := ((p_date || ' ' || close_t::text)::timestamp AT TIME ZONE tz);
    
    slot_start_ts := start_ts;
    
    WHILE slot_start_ts + duration <= end_ts LOOP
      slot_end_ts := slot_start_ts + duration;
      
      IF NOT EXISTS (
        SELECT 1 FROM public.booked_slots_public bsp
        WHERE bsp.day = p_date
          AND bsp.ts && tstzrange(slot_start_ts, slot_end_ts, '[)')
      ) THEN
        slot_start := slot_start_ts;
        slot_end := slot_end_ts;
        RETURN NEXT;
      END IF;
      
      slot_start_ts := slot_start_ts + make_interval(mins => p_slot_step_minutes);
    END LOOP;
  END IF;
END;
$$;
