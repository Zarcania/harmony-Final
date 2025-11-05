-- Migration: Autoriser les réservations pour aujourd'hui (pas seulement demain+)
-- Fix: get_available_slots retournait vide pour p_date = today, causant un fallback local sans filtrage des créneaux occupés

CREATE OR REPLACE FUNCTION public.get_available_slots(p_date date, p_duration_minutes integer, p_slot_step_minutes integer DEFAULT 15, p_buffer_minutes integer DEFAULT 0)
 RETURNS TABLE(slot_start timestamp with time zone, slot_end timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  tz text := 'Europe/Paris';
  dow int := EXTRACT(ISODOW FROM p_date) - 1; -- ✅ ISO: 0=lundi (au lieu de DOW: 0=dimanche)
  today date := (now() AT TIME ZONE tz)::date;
  min_allowed_date date := today; -- ✅ CHANGÉ: aujourd'hui autorisé (avant: today + 1)
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

  -- ✅ Utiliser open_time/close_time au lieu de open_time_morning/afternoon
  IF bh.open_time IS NOT NULL AND bh.close_time IS NOT NULL THEN
    windows := ARRAY[bh.open_time, bh.close_time];
  ELSE
    RETURN;
  END IF;

  -- Note: business_breaks table doesn't exist, removing break logic

  FOR i IN 1..array_length(windows,1) BY 2 LOOP
    open_t := windows[i];
    close_t := windows[i+1];
    start_ts := (p_date::timestamptz + open_t) AT TIME ZONE tz;
    end_ts   := (p_date::timestamptz + close_t) AT TIME ZONE tz;

    slot_start_ts := start_ts;
    LOOP
      slot_end_ts := slot_start_ts + duration;
      EXIT WHEN slot_end_ts > end_ts;

      IF NOT EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.status <> 'cancelled'
          AND b.ts && tstzrange(slot_start_ts, slot_end_ts, '[)')
      ) THEN
        slot_start := slot_start_ts;
        slot_end := slot_end_ts;
        RETURN NEXT;
      END IF;

      slot_start_ts := slot_start_ts + make_interval(mins => p_slot_step_minutes);
      EXIT WHEN slot_start_ts + duration > end_ts;
    END LOOP;
  END LOOP;
END;
$function$
;
