-- Migration: Fix timezone conversion in bookings_compute_bounds trigger
-- Gap Critical: Le trigger ne convertissait pas correctement Europe/Paris -> UTC
-- Et ne calculait pas le champ ts (tstzrange) nécessaire pour la détection de chevauchement

CREATE OR REPLACE FUNCTION "public"."bookings_compute_bounds"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  tz text := 'Europe/Paris';
  local_ts timestamptz;
  utc_start timestamptz;
  utc_end timestamptz;
BEGIN
  -- preferred_date + preferred_time sont en Europe/Paris
  -- On les combine, puis on convertit explicitement vers UTC
  local_ts := (NEW.preferred_date::text || ' ' || NEW.preferred_time::text)::timestamp AT TIME ZONE tz;
  
  -- Calculer les timestamps UTC avec timezone
  utc_start := local_ts;
  utc_end := utc_start + make_interval(mins => coalesce(NEW.duration_minutes, 60));
  
  -- start_at et end_at sont stockés comme timestamp WITHOUT timezone mais représentent UTC
  NEW.start_at := utc_start AT TIME ZONE 'UTC';
  NEW.end_at   := utc_end AT TIME ZONE 'UTC';
  
  -- ts (tstzrange) est le range UTC utilisé pour la détection de chevauchement
  NEW.ts := tstzrange(utc_start, utc_end, '[)');
  
  RETURN NEW;
END;
$$;
