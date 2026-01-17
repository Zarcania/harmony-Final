-- Migration: Correction de get_available_slots pour prendre en compte les admin_breaks
-- Cette fonction est appelée pour déterminer les créneaux disponibles pour les clients

CREATE OR REPLACE FUNCTION "public"."get_available_slots"("p_date" "date", "p_duration_minutes" integer, "p_slot_step_minutes" integer DEFAULT 15, "p_buffer_minutes" integer DEFAULT 0) 
RETURNS TABLE("slot_start" timestamp with time zone, "slot_end" timestamp with time zone)
LANGUAGE "plpgsql" STABLE SECURITY DEFINER
SET "search_path" TO 'public', 'extensions'
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

  -- Vérifier les fermetures (closures)
  IF EXISTS (
    SELECT 1 FROM public.closures c
    WHERE p_date BETWEEN c.start_date AND c.end_date
  ) THEN
    RETURN;
  END IF;

  -- Vérifier les heures d'ouverture
  SELECT * INTO bh FROM public.business_hours WHERE day_of_week = dow;
  IF NOT FOUND OR bh.is_closed THEN
    RETURN;
  END IF;

  -- Vérifier les pauses récurrentes (business_breaks)
  SELECT * INTO br FROM public.business_breaks WHERE day_of_week = dow AND enabled = true LIMIT 1;
  IF FOUND AND br.break_start IS NOT NULL AND br.break_end IS NOT NULL THEN
    break_start_ts := (p_date::timestamptz + br.break_start) AT TIME ZONE tz;
    break_end_ts   := (p_date::timestamptz + br.break_end)   AT TIME ZONE tz;
    has_break := break_end_ts > break_start_ts;
  END IF;

  -- Construire les fenêtres horaires (simplifié: une seule fenêtre)
  IF bh.open_time IS NOT NULL AND bh.close_time IS NOT NULL THEN
    windows := ARRAY[bh.open_time, bh.close_time];
  ELSE
    RETURN;
  END IF;

  -- Générer les créneaux disponibles
  FOR i IN 1..array_length(windows,1) BY 2 LOOP
    open_t := windows[i];
    close_t := windows[i+1];
    start_ts := (p_date || ' ' || open_t)::timestamp AT TIME ZONE tz;
    end_ts   := (p_date || ' ' || close_t)::timestamp AT TIME ZONE tz;

    slot_start_ts := start_ts;
    LOOP
      slot_end_ts := slot_start_ts + duration;
      EXIT WHEN slot_end_ts > end_ts;

      -- Vérifier les pauses récurrentes (business_breaks)
      IF NOT (has_break AND slot_start_ts < break_end_ts AND slot_end_ts > break_start_ts) THEN
        -- Vérifier les rendez-vous existants
        IF NOT EXISTS (
          SELECT 1
          FROM public.bookings b
          WHERE b.status <> 'cancelled'
            AND b.ts && tstzrange(slot_start_ts, slot_end_ts, '[)')
        ) THEN
          -- ✅ NOUVEAU: Vérifier les pauses ponctuelles (admin_breaks)
          IF NOT EXISTS (
            SELECT 1
            FROM public.admin_breaks ab
            WHERE p_date BETWEEN ab.start_date AND ab.end_date
              AND (
                -- Cas 1: Pause sans horaires spécifiés = journée entière bloquée
                (ab.start_time IS NULL AND ab.end_time IS NULL)
                OR
                -- Cas 2: Pause avec horaires spécifiés = vérifier chevauchement
                (
                  ab.start_time IS NOT NULL 
                  AND ab.end_time IS NOT NULL
                  AND slot_start_ts < (p_date || ' ' || ab.end_time)::timestamp AT TIME ZONE tz
                  AND slot_end_ts > (p_date || ' ' || ab.start_time)::timestamp AT TIME ZONE tz
                )
              )
          ) THEN
            -- Créneau disponible
            slot_start := slot_start_ts;
            slot_end := slot_end_ts;
            RETURN NEXT;
          END IF;
        END IF;
      END IF;

      slot_start_ts := slot_start_ts + make_interval(mins => p_slot_step_minutes);
      EXIT WHEN slot_start_ts + duration > end_ts;
    END LOOP;
  END LOOP;
END;
$$;
