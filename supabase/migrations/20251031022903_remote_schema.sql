


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."booking_broadcast_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_topic text;
BEGIN
  v_topic := 'service:' || COALESCE(NEW.service_id, OLD.service_id)::text || ':bookings';
  PERFORM realtime.broadcast_changes(
    v_topic,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."booking_broadcast_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."booking_period"("p_start" timestamp with time zone, "p_end" timestamp with time zone) RETURNS "tstzrange"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  SELECT tstzrange(p_start, p_end, '[)');
$$;


ALTER FUNCTION "public"."booking_period"("p_start" timestamp with time zone, "p_end" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bookings_compute_bounds"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  -- preferred_time peut être TEXT ou TIME; ::time gère les deux cas
  NEW.start_at := (NEW.preferred_date::date + NEW.preferred_time::time);
  NEW.end_at   := NEW.start_at + make_interval(mins => coalesce(NEW.duration_minutes, 60));
  return NEW;
end
$$;


ALTER FUNCTION "public"."bookings_compute_bounds"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bookings_normalize_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Normaliser status si NULL ou valeur non autorisée
  IF NEW.status IS NULL OR NEW.status NOT IN ('confirmed','completed','cancelled') THEN
    NEW.status := 'confirmed';
  END IF;

  -- Si la réservation est dans le passé, forcer completed
  IF NEW.start_at < now() THEN
    NEW.status := 'completed';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."bookings_normalize_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_booking"("p_token" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_booking RECORD;
  v_result jsonb;
BEGIN
  SELECT * INTO v_booking
  FROM bookings
  WHERE cancellation_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Lien d''annulation invalide'
    );
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Ce rendez-vous a déjà été annulé',
      'booking', jsonb_build_object(
        'service', v_booking.service_name,
        'date', to_char(v_booking.preferred_date, 'YYYY-MM-DD'),
        'time', v_booking.preferred_time
      )
    );
  END IF;

  -- Mark as cancelled
  UPDATE bookings
  SET status = 'cancelled',
      canceled_at = now(),
      updated_at = now()
  WHERE id = v_booking.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Votre rendez-vous a bien été annulé',
    'booking', jsonb_build_object(
      'service', v_booking.service_name,
      'date', to_char(v_booking.preferred_date, 'YYYY-MM-DD'),
      'time', v_booking.preferred_time
    )
  );
END;
$$;


ALTER FUNCTION "public"."cancel_booking"("p_token" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_booking_tx"("p_booking_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_booking record;
begin
  if p_booking_id is null then
    return jsonb_build_object('success', false, 'code', 'invalid_payload', 'message', 'booking_id requis');
  end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'code', 'not_found', 'message', 'Rendez-vous introuvable');
  end if;

  if v_booking.status = 'cancelled' then
    return jsonb_build_object('success', true, 'alreadyCanceled', true, 'message', 'Déjà annulé',
      'booking', jsonb_build_object('service', v_booking.service_name, 'date', v_booking.preferred_date, 'time', v_booking.preferred_time)
    );
  end if;

  update public.bookings
  set status = 'cancelled', updated_at = now()
  where id = p_booking_id;

  return jsonb_build_object('success', true, 'message', 'Rendez-vous annulé',
    'booking', jsonb_build_object('service', v_booking.service_name, 'date', v_booking.preferred_date, 'time', v_booking.preferred_time)
  );
exception when others then
  return jsonb_build_object('success', false, 'code', 'server_error', 'message', SQLERRM);
end;
$$;


ALTER FUNCTION "public"."cancel_booking_tx"("p_booking_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_booking_with_log"("p_token" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_tok       cancellation_tokens%ROWTYPE;
  v_booking   bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_tok FROM public.cancellation_tokens WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'invalid_or_expired_token', 'message', 'Token introuvable');
  END IF;

  IF v_tok.used_at IS NOT NULL OR (v_tok.expires_at IS NOT NULL AND v_tok.expires_at < now()) THEN
    RETURN jsonb_build_object('success', false, 'code', 'invalid_or_expired_token', 'message', 'Lien expiré ou déjà utilisé');
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = v_tok.booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'invalid_payload', 'message', 'Réservation introuvable');
  END IF;

  UPDATE public.bookings
     SET status = 'cancelled', canceled_at = now(), updated_at = now()
   WHERE id = v_booking.id;

  UPDATE public.cancellation_tokens SET used_at = now() WHERE id = v_tok.id;

  INSERT INTO public.email_logs (booking_id, email_type, recipient_email, subject, status, sent_at)
  VALUES (v_booking.id, 'cancellation', v_booking.client_email, 'Annulation de rendez-vous', 'sent', now());

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Votre rendez-vous a bien été annulé',
    'booking', jsonb_build_object(
      'id', v_booking.id,
      'client_name', v_booking.client_name,
      'client_first_name', v_booking.client_first_name,
      'client_email', v_booking.client_email,
      'service_name', v_booking.service_name,
      'preferred_date', v_booking.preferred_date,
      'preferred_time', v_booking.preferred_time
    )
  );
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('success', false, 'code', 'server_error', 'message', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."cancel_booking_with_log"("p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ceil_to_slot_minutes"("total_minutes" integer, "slot" integer DEFAULT 30) RETURNS integer
    LANGUAGE "sql" IMMUTABLE STRICT
    SET "search_path" TO 'public', 'extensions'
    AS $$
  SELECT CASE WHEN total_minutes % slot = 0 THEN total_minutes
              ELSE ((total_minutes / slot) + 1) * slot END;
$$;


ALTER FUNCTION "public"."ceil_to_slot_minutes"("total_minutes" integer, "slot" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_booking"("p_service_item" "uuid", "p_start" timestamp with time zone, "p_end" timestamp with time zone) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_conflict uuid;
BEGIN
  -- Validate input
  IF p_end <= p_start THEN
    RAISE EXCEPTION 'end_at must be after start_at';
  END IF;

  -- Check conflicts on confirmed/pending bookings for this service_item
  SELECT b.id INTO v_conflict
  FROM public.bookings b
  WHERE b.service_item_id = p_service_item
    AND b.status IN ('confirmed','pending')
    AND b.period && public.booking_period(p_start, p_end)
  LIMIT 1;

  IF FOUND THEN
    RETURN FALSE; -- conflict
  END IF;

  -- If no conflict, insert a confirmed booking
  INSERT INTO public.bookings (id, service_item_id, status, start_at, end_at, period)
  VALUES (gen_random_uuid(), p_service_item, 'confirmed', p_start, p_end, public.booking_period(p_start, p_end));

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."confirm_booking"("p_service_item" "uuid", "p_start" timestamp with time zone, "p_end" timestamp with time zone) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_name" "text" NOT NULL,
    "client_email" "text" NOT NULL,
    "client_phone" "text" NOT NULL,
    "service_id" "uuid",
    "service_name" "text" NOT NULL,
    "preferred_date" "date" NOT NULL,
    "preferred_time" "text" NOT NULL,
    "message" "text" DEFAULT ''::"text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "reminder_sent" boolean DEFAULT false,
    "cancellation_token" "uuid" DEFAULT "gen_random_uuid"(),
    "canceled_at" timestamp with time zone,
    "user_id" "uuid",
    "duration_minutes" integer DEFAULT 60 NOT NULL,
    "start_at" timestamp without time zone,
    "end_at" timestamp without time zone,
    "ts" "tstzrange",
    "period" "tstzrange",
    CONSTRAINT "bookings_start_not_past_active" CHECK ((("start_at" >= "now"()) OR ("status" = ANY (ARRAY['cancelled'::"text", 'completed'::"text"])))),
    CONSTRAINT "bookings_status_allowed" CHECK (("status" = ANY (ARRAY['confirmed'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_booking"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_name" "text", "p_start_at" timestamp with time zone, "p_duration_minutes" integer, "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "public"."bookings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_slot int := 30;
  v_block_minutes int;
  v_end_at timestamptz;
  v_rec bookings;
BEGIN
  IF p_start_at IS NULL OR p_duration_minutes IS NULL OR p_duration_minutes <= 0 THEN
    RAISE EXCEPTION 'start_at and positive duration are required';
  END IF;

  -- 2.1 Round duration up to nearest 30 minutes block
  v_block_minutes := ceil_to_slot_minutes(p_duration_minutes, v_slot);
  v_end_at := p_start_at + make_interval(mins => v_block_minutes);

  -- 2.2 Insert with computed rounded end and ts covering whole block
  INSERT INTO public.bookings(
    client_name, client_email, client_phone,
    service_name, preferred_date, preferred_time,
    status, user_id, duration_minutes, start_at, end_at, ts
  )
  VALUES (
    p_client_name,
    p_client_email,
    p_client_phone,
    p_service_name,
    (p_start_at AT TIME ZONE 'Europe/Paris')::date,
    to_char(p_start_at AT TIME ZONE 'Europe/Paris', 'HH24:MI'),
    'pending',
    p_user_id,
    v_block_minutes,
    p_start_at AT TIME ZONE 'UTC', -- store as timestamp without TZ in existing schema
    v_end_at   AT TIME ZONE 'UTC',
    tstzrange(p_start_at, v_end_at, '[)')
  )
  RETURNING * INTO v_rec;

  -- 2.3 If exclusion constraint exists on ts, overlapping inserts will fail automatically.
  RETURN v_rec;
END;
$$;


ALTER FUNCTION "public"."create_booking"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_name" "text", "p_start_at" timestamp with time zone, "p_duration_minutes" integer, "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_booking_by_service"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_item_id" "uuid", "p_start_at" timestamp with time zone, "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "public"."bookings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_service_name text;
  v_duration_minutes int;
  v_booking public.bookings;
BEGIN
  -- Récupérer durée et nom du service
  SELECT si.label, si.duration_minutes
  INTO v_service_name, v_duration_minutes
  FROM public.service_items si
  WHERE si.id = p_service_item_id;

  IF v_duration_minutes IS NULL THEN
    RAISE EXCEPTION 'Service item introuvable ou sans durée définie';
  END IF;

  -- Déléguer à la RPC principale pour gérer arrondi, ts et contraintes d''overlap
  SELECT * INTO v_booking FROM public.create_booking(
    p_client_name,
    p_client_email,
    p_client_phone,
    v_service_name,
    p_start_at,
    v_duration_minutes,
    p_user_id
  );

  -- Lier l''item au booking nouvellement créé
  INSERT INTO public.booking_items(booking_id, service_item_id, duration_minutes)
  VALUES (v_booking.id, p_service_item_id, v_duration_minutes);

  RETURN v_booking;
END;
$$;


ALTER FUNCTION "public"."create_booking_by_service"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_item_id" "uuid", "p_start_at" timestamp with time zone, "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_booking_multi"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_item_ids" "uuid"[], "p_status" "text" DEFAULT 'pending'::"text", "p_search_start_date" "date" DEFAULT (("now"() AT TIME ZONE 'UTC'::"text"))::"date", "p_search_days" integer DEFAULT 14) RETURNS TABLE("id" "uuid", "start_at" timestamp without time zone, "end_at" timestamp without time zone, "duration_minutes" integer, "status" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_total_minutes int;
  v_step_minutes int := 30;
  v_day date;
  v_open time;
  v_close time;
  v_day_start timestamp;
  v_day_end timestamp;
  v_try_start timestamp;
  v_try_end timestamp;
  v_booking_id uuid;
BEGIN
  SELECT COALESCE(SUM(si.duration_minutes), 0)
  INTO v_total_minutes
  FROM public.service_items si
  WHERE si.id = ANY(p_service_item_ids);

  IF v_total_minutes IS NULL OR v_total_minutes <= 0 THEN
    RAISE EXCEPTION 'Aucune durée valide pour les prestations fournies';
  END IF;

  FOR v_day IN
    SELECT (p_search_start_date + offs)::date
    FROM generate_series(0, p_search_days) AS offs
  LOOP
    SELECT bh.open_time, bh.close_time
    INTO v_open, v_close
    FROM public.business_hours bh
    WHERE bh.day_of_week = EXTRACT(DOW FROM v_day)::int
      AND bh.is_closed = false
    LIMIT 1;

    CONTINUE WHEN v_open IS NULL OR v_close IS NULL;

    IF EXISTS (SELECT 1 FROM public.closures c WHERE v_day BETWEEN c.start_date AND c.end_date) THEN
      CONTINUE;
    END IF;

    v_day_start := (v_day + v_open);
    v_day_end   := (v_day + v_close) - make_interval(mins => v_total_minutes);

    v_try_start := v_day_start;
    WHILE v_try_start <= v_day_end LOOP
      v_try_end := v_try_start + make_interval(mins => v_total_minutes);

      IF NOT EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.start_at < v_try_end
          AND b.end_at   > v_try_start
      ) THEN
        INSERT INTO public.bookings (
          client_name, client_email, client_phone,
          service_id, service_name,
          preferred_date, preferred_time,
          status, duration_minutes, start_at, end_at, ts
        )
        VALUES (
          COALESCE(p_client_name, 'Anonyme'),
          COALESCE(p_client_email, ''),
          COALESCE(p_client_phone, ''),
          NULL,
          'Réservation multi-prestations',
          v_try_start::date,
          to_char(v_try_start, 'HH24:MI'),
          COALESCE(p_status, 'pending'),
          v_total_minutes,
          v_try_start,
          v_try_end,
          tstzrange(v_try_start, v_try_end, '[)')
        )
        RETURNING bookings.id INTO v_booking_id;

        INSERT INTO public.booking_items (booking_id, service_item_id, duration_minutes)
        SELECT v_booking_id, si.id, si.duration_minutes
        FROM public.service_items si
        WHERE si.id = ANY(p_service_item_ids);

        RETURN QUERY
        SELECT v_booking_id, v_try_start, v_try_end, v_total_minutes, COALESCE(p_status, 'pending');
        RETURN;
      END IF;

      v_try_start := v_try_start + make_interval(mins => v_step_minutes);
    END LOOP;
  END LOOP;

  RAISE EXCEPTION 'Aucun créneau libre (pas 30m) sur % jours à partir de %', p_search_days, p_search_start_date;
END;
$$;


ALTER FUNCTION "public"."create_booking_multi"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_item_ids" "uuid"[], "p_status" "text", "p_search_start_date" "date", "p_search_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_cancellation_token"("p_booking_id" "uuid", "p_expires_at" timestamp with time zone) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_token text;
begin
  -- Générer un token aléatoire sécurisé
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Insérer le token dans la table
  insert into public.cancellation_tokens (booking_id, token, expires_at)
  values (p_booking_id, v_token, p_expires_at);

  return v_token;
end;
$$;


ALTER FUNCTION "public"."generate_cancellation_token"("p_booking_id" "uuid", "p_expires_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_availability_overview"("p_start_date" "date", "p_end_date" "date", "p_duration_minutes" integer, "p_slot_step_minutes" integer DEFAULT 15, "p_buffer_minutes" integer DEFAULT 0) RETURNS TABLE("the_date" "date", "has_availability" boolean)
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  d date;
BEGIN
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'start_date must be <= end_date';
  END IF;

  d := p_start_date;
  WHILE d <= p_end_date LOOP
    the_date := d;
    has_availability := EXISTS (
      SELECT 1 FROM public.get_available_slots(d, p_duration_minutes, p_slot_step_minutes, p_buffer_minutes) LIMIT 1
    );
    RETURN NEXT;
    d := d + 1;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."get_availability_overview"("p_start_date" "date", "p_end_date" "date", "p_duration_minutes" integer, "p_slot_step_minutes" integer, "p_buffer_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_slots"("p_date" "date", "p_duration_minutes" integer, "p_slot_step_minutes" integer DEFAULT 15, "p_buffer_minutes" integer DEFAULT 0) RETURNS TABLE("slot_start" timestamp with time zone, "slot_end" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'extensions'
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

      -- overlap check with existing bookings for the same calendar day
      -- bookings.start_at/end_at stored as timestamp (local). Convert them to tz-aware for comparison.
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

      slot_start_ts := slot_start_ts + make_interval(mins => p_slot_step_minutes);
      EXIT WHEN slot_start_ts + duration > end_ts;
    END LOOP;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."get_available_slots"("p_date" "date", "p_duration_minutes" integer, "p_slot_step_minutes" integer, "p_buffer_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_booked_slots"("p_date" "date") RETURNS TABLE("preferred_time" "text", "duration_minutes" integer)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select b.preferred_time::text, b.duration_minutes
  from public.bookings b
  where b.preferred_date = p_date
    and coalesce(b.status, 'confirmed') <> 'cancelled';
$$;


ALTER FUNCTION "public"."get_booked_slots"("p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles(user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_admin = true
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_available_slots"("p_day" "date", "p_duration_minutes" integer) RETURNS TABLE("start_at" timestamp with time zone, "end_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_slot int := 30;
  v_block int := ceil_to_slot_minutes(p_duration_minutes, v_slot);
  v_open_morning time;
  v_close_morning time;
  v_open_afternoon time;
  v_close_afternoon time;
BEGIN
  IF p_day IS NULL OR p_duration_minutes IS NULL OR p_duration_minutes <= 0 THEN
    RAISE EXCEPTION 'day and positive duration are required';
  END IF;

  -- Récupérer horaires d'ouverture du jour (Europe/Paris)
  SELECT open_time_morning, close_time_morning, open_time_afternoon, close_time_afternoon
  INTO v_open_morning, v_close_morning, v_open_afternoon, v_close_afternoon
  FROM public.business_hours
  WHERE day_of_week = EXTRACT(DOW FROM p_day)::int;

  -- Si fermé
  IF NOT FOUND THEN
    RETURN; -- aucun slot
  END IF;

  -- Génère les slots au pas de 30 minutes pour chaque plage (matin/après-midi si présentes)
  RETURN QUERY WITH
  ranges AS (
    SELECT unnest(ARRAY[
      CASE WHEN v_open_morning IS NOT NULL AND v_close_morning IS NOT NULL AND v_open_morning < v_close_morning
           THEN tstzrange((p_day::timestamptz + v_open_morning), (p_day::timestamptz + v_close_morning), '[)') END,
      CASE WHEN v_open_afternoon IS NOT NULL AND v_close_afternoon IS NOT NULL AND v_open_afternoon < v_close_afternoon
           THEN tstzrange((p_day::timestamptz + v_open_afternoon), (p_day::timestamptz + v_close_afternoon), '[)') END
    ]) AS avail
  ),
  slots AS (
    SELECT lower(avail) + (n || ' minutes')::interval AS s
    FROM ranges r, LATERAL generate_series(0,
      GREATEST(0, EXTRACT(EPOCH FROM (upper(r.avail) - lower(r.avail)))::int / 60 - v_block), v_slot) n
    WHERE r.avail IS NOT NULL
  ),
  proposed AS (
    SELECT s AS start_at, s + make_interval(mins => v_block) AS end_at
    FROM slots
  )
  SELECT p.start_at, p.end_at
  FROM proposed p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.ts && tstzrange(p.start_at, p.end_at, '[)')
  )
  ORDER BY p.start_at;
END;
$$;


ALTER FUNCTION "public"."list_available_slots"("p_day" "date", "p_duration_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_available_slots_by_service"("p_day" "date", "p_service_item_id" "uuid") RETURNS TABLE("start_at" timestamp with time zone, "end_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_duration int;
BEGIN
  IF p_day IS NULL OR p_service_item_id IS NULL THEN
    RAISE EXCEPTION 'day and service_item_id are required';
  END IF;

  SELECT si.duration_minutes INTO v_duration
  FROM public.service_items si
  WHERE si.id = p_service_item_id;

  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'service_item not found or duration undefined';
  END IF;

  RETURN QUERY
  SELECT * FROM public.list_available_slots(p_day, v_duration);
END;
$$;


ALTER FUNCTION "public"."list_available_slots_by_service"("p_day" "date", "p_service_item_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."parse_duration_to_minutes"("p_text" "text") RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'public', 'extensions'
    AS $_$
WITH norm AS (
  SELECT lower(trim(p_text)) AS t
), t1 AS (
  SELECT regexp_replace(
           replace(replace(replace(replace(replace(replace(t,'minutes','min'),'minute','min'),'mins','min'),'mns','min'),'hours','h'),'hour','h'),
           '\s+', ' ', 'g'
         ) AS t
  FROM norm
), hms AS (
  SELECT t,
         CASE WHEN t ~ '^[0-9]+:[0-9]{1,2}$' THEN split_part(t, ':', 1)::int ELSE NULL END AS hh_colon,
         CASE WHEN t ~ '^[0-9]+:[0-9]{1,2}$' THEN split_part(t, ':', 2)::int ELSE NULL END AS mm_colon
  FROM t1
), parsed AS (
  SELECT t,
    COALESCE(
      -- H:MM
      CASE WHEN hh_colon IS NOT NULL THEN hh_colon*60 + mm_colon END,
      -- HhMM or H h MM
      CASE WHEN t ~ '^[0-9]+\s*h\s*[0-9]{1,2}\s*min?$' THEN
        (regexp_replace(t, '^.*?([0-9]+)\s*h.*$', '\1'))::int*60 + (regexp_replace(t, '^.*?([0-9]{1,2})\s*min.*$', '\1'))::int
      END,
      -- HhMM glued
      CASE WHEN t ~ '^[0-9]+h[0-9]{1,2}$' THEN
        (regexp_replace(t, '^([0-9]+)h[0-9]{1,2}$', '\1'))::int*60 + (regexp_replace(t, '^[0-9]+h([0-9]{1,2})$', '\1'))::int
      END,
      -- Hh
      CASE WHEN t ~ '^[0-9]+\s*h\s*$' OR t ~ '^[0-9]+h$' THEN (regexp_replace(t, '[^0-9]', '', 'g'))::int * 60 END,
      -- MM min / Mm / MM
      CASE WHEN t ~ '^[0-9]+\s*min$' OR t ~ '^[0-9]+m$' OR t ~ '^[0-9]+$' THEN (regexp_replace(t, '[^0-9]', '', 'g'))::int END,
      -- Fallback digits-only
      NULLIF(regexp_replace(t, '[^0-9]', '', 'g'), '')::int
    ) AS minutes
  FROM hms
)
SELECT minutes FROM parsed;
$_$;


ALTER FUNCTION "public"."parse_duration_to_minutes"("p_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."promote_admin"("p_email" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  -- s'assurer que la ligne profiles existe pour cet email
  insert into public.profiles(user_id)
  select u.id from auth.users u
  where lower(u.email) = lower(p_email)
  on conflict (user_id) do nothing;

  update public.profiles p
  set is_admin = true
  from auth.users u
  where lower(u.email) = lower(p_email)
    and p.user_id = u.id;
end;
$$;


ALTER FUNCTION "public"."promote_admin"("p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_booking_period"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.period := public.booking_period(NEW.start_at, NEW.end_at);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_booking_period"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_bookings_user_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_bookings_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."about_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "section_key" "text" NOT NULL,
    "title" "text" DEFAULT ''::"text",
    "content" "text" DEFAULT ''::"text",
    "image_url" "text" DEFAULT ''::"text",
    "order_index" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."about_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "username" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "email" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid",
    "service_item_id" "uuid",
    "duration_minutes" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."booking_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_breaks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day_of_week" integer NOT NULL,
    "break_start" time without time zone,
    "break_end" time without time zone,
    "enabled" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "business_breaks_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."business_breaks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_hours" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day_of_week" integer NOT NULL,
    "open_time" time without time zone,
    "close_time" time without time zone,
    "is_closed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "open_time_morning" time without time zone,
    "close_time_morning" time without time zone,
    "open_time_afternoon" time without time zone,
    "close_time_afternoon" time without time zone,
    CONSTRAINT "business_hours_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6))),
    CONSTRAINT "business_hours_time_check" CHECK ((("is_closed" = true) OR (("open_time" IS NOT NULL) AND ("close_time" IS NOT NULL) AND ("close_time" > "open_time"))))
);


ALTER TABLE "public"."business_hours" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cancellation_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cancellation_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."closures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "reason" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_closures_dates" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "public"."closures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid",
    "email_type" "text" NOT NULL,
    "recipient_email" "text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'sent'::"text" NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_logs_email_type_check" CHECK (("email_type" = ANY (ARRAY['confirmation'::"text", 'reminder'::"text", 'cancellation'::"text"]))),
    CONSTRAINT "email_logs_status_check" CHECK (("status" = ANY (ARRAY['sent'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."email_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portfolio_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."portfolio_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portfolio_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "url" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "detailed_description" "text" DEFAULT ''::"text",
    "alt" "text" NOT NULL,
    "category" "text" DEFAULT 'Cils'::"text" NOT NULL,
    "show_on_home" boolean DEFAULT false,
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."portfolio_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "user_id" "uuid" NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promotions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "price" "text" NOT NULL,
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "original_price" "text",
    "badge" "text",
    "icon" "text"
);


ALTER TABLE "public"."promotions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_name" "text" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text" NOT NULL,
    "service_type" "text" DEFAULT ''::"text" NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_item_members" (
    "service_item_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."service_item_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "price" "text" NOT NULL,
    "description" "text",
    "duration" "text" DEFAULT ''::"text",
    "benefits" "text"[],
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "duration_minutes" integer GENERATED ALWAYS AS ("public"."parse_duration_to_minutes"("duration")) STORED
);


ALTER TABLE "public"."service_items" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."service_items_with_minutes" WITH ("security_invoker"='true') AS
 SELECT "id",
    "service_id",
    "label",
    "price",
    "description",
    "duration",
    "benefits",
    "order_index",
    "created_at",
    "updated_at",
    (NULLIF(TRIM(BOTH FROM "duration"), ''::"text"))::integer AS "duration_minutes_norm"
   FROM "public"."service_items" "si";


ALTER VIEW "public"."service_items_with_minutes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setting_key" "text" NOT NULL,
    "setting_value" "text" DEFAULT ''::"text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_public" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."about_content"
    ADD CONSTRAINT "about_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."about_content"
    ADD CONSTRAINT "about_content_section_key_key" UNIQUE ("section_key");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."booking_items"
    ADD CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_cancellation_token_key" UNIQUE ("cancellation_token");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_no_overlap" EXCLUDE USING "gist" ("ts" WITH &&);



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_no_overlap_excl" EXCLUDE USING "gist" ("tsrange"("start_at", "end_at", '[)'::"text") WITH &&, (("status" IS DISTINCT FROM 'cancelled'::"text")) WITH =);



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_no_time_overlap" EXCLUDE USING "gist" ("ts" WITH &&) WHERE (("status" <> 'cancelled'::"text"));



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_breaks"
    ADD CONSTRAINT "business_breaks_day_of_week_key" UNIQUE ("day_of_week");



ALTER TABLE ONLY "public"."business_breaks"
    ADD CONSTRAINT "business_breaks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_hours"
    ADD CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cancellation_tokens"
    ADD CONSTRAINT "cancellation_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cancellation_tokens"
    ADD CONSTRAINT "cancellation_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."closures"
    ADD CONSTRAINT "closures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_logs"
    ADD CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "no_overlap" EXCLUDE USING "gist" ("ts" WITH &&);



ALTER TABLE ONLY "public"."portfolio_categories"
    ADD CONSTRAINT "portfolio_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."portfolio_categories"
    ADD CONSTRAINT "portfolio_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."portfolio_items"
    ADD CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."promotions"
    ADD CONSTRAINT "promotions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_item_members"
    ADD CONSTRAINT "service_item_members_pkey" PRIMARY KEY ("service_item_id", "user_id");



ALTER TABLE ONLY "public"."service_items"
    ADD CONSTRAINT "service_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."business_hours"
    ADD CONSTRAINT "uniq_business_hours_day" UNIQUE ("day_of_week");



CREATE INDEX "booking_items_service_item_idx" ON "public"."booking_items" USING "btree" ("service_item_id");



CREATE UNIQUE INDEX "cancellation_tokens_token_uidx" ON "public"."cancellation_tokens" USING "btree" ("token");



CREATE INDEX "idx_about_order" ON "public"."about_content" USING "btree" ("order_index");



CREATE INDEX "idx_booking_items_booking_id" ON "public"."booking_items" USING "btree" ("booking_id");



CREATE INDEX "idx_booking_items_service_item_id" ON "public"."booking_items" USING "btree" ("service_item_id");



CREATE INDEX "idx_bookings_cancellation_token" ON "public"."bookings" USING "btree" ("cancellation_token");



CREATE INDEX "idx_bookings_date" ON "public"."bookings" USING "btree" ("preferred_date");



CREATE INDEX "idx_bookings_end_at" ON "public"."bookings" USING "btree" ("end_at");



CREATE INDEX "idx_bookings_period_gist" ON "public"."bookings" USING "gist" ("period");



CREATE INDEX "idx_bookings_service_id" ON "public"."bookings" USING "btree" ("service_id");



CREATE INDEX "idx_bookings_start_at" ON "public"."bookings" USING "btree" ("start_at");



CREATE INDEX "idx_bookings_start_end" ON "public"."bookings" USING "btree" ("start_at", "end_at");



CREATE INDEX "idx_bookings_status" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "idx_bookings_ts" ON "public"."bookings" USING "gist" ("ts");



CREATE INDEX "idx_bookings_user_id" ON "public"."bookings" USING "btree" ("user_id");



CREATE INDEX "idx_business_breaks_dow" ON "public"."business_breaks" USING "btree" ("day_of_week");



CREATE INDEX "idx_business_breaks_enabled" ON "public"."business_breaks" USING "btree" ("enabled");



CREATE INDEX "idx_business_hours_dow" ON "public"."business_hours" USING "btree" ("day_of_week");



CREATE INDEX "idx_cancellation_tokens_booking_id" ON "public"."cancellation_tokens" USING "btree" ("booking_id");



CREATE INDEX "idx_cancellation_tokens_expires_at" ON "public"."cancellation_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_cancellation_tokens_token" ON "public"."cancellation_tokens" USING "btree" ("token");



CREATE INDEX "idx_cancellation_tokens_used_at" ON "public"."cancellation_tokens" USING "btree" ("used_at");



CREATE INDEX "idx_closures_range" ON "public"."closures" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_email_logs_booking_id" ON "public"."email_logs" USING "btree" ("booking_id");



CREATE INDEX "idx_email_logs_email_type" ON "public"."email_logs" USING "btree" ("email_type");



CREATE INDEX "idx_portfolio_category" ON "public"."portfolio_items" USING "btree" ("category");



CREATE INDEX "idx_portfolio_order" ON "public"."portfolio_items" USING "btree" ("order_index");



CREATE INDEX "idx_promotions_order" ON "public"."promotions" USING "btree" ("order_index");



CREATE INDEX "idx_reviews_is_published" ON "public"."reviews" USING "btree" ("is_published");



CREATE INDEX "idx_reviews_published" ON "public"."reviews" USING "btree" ("is_published");



CREATE INDEX "idx_service_item_members_user" ON "public"."service_item_members" USING "btree" ("user_id");



CREATE INDEX "idx_service_items_order" ON "public"."service_items" USING "btree" ("order_index");



CREATE INDEX "idx_service_items_service_id" ON "public"."service_items" USING "btree" ("service_id");



CREATE INDEX "idx_services_order" ON "public"."services" USING "btree" ("order_index");



CREATE INDEX "profiles_admin_idx" ON "public"."profiles" USING "btree" ("is_admin");



CREATE UNIQUE INDEX "uniq_bookings_start_active" ON "public"."bookings" USING "btree" ("preferred_date", "preferred_time") WHERE ("status" IS DISTINCT FROM 'cancelled'::"text");



CREATE OR REPLACE TRIGGER "bookings_compute_bounds_trg" BEFORE INSERT OR UPDATE OF "preferred_date", "preferred_time", "duration_minutes" ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."bookings_compute_bounds"();



CREATE OR REPLACE TRIGGER "bookings_set_user_id" BEFORE INSERT ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."set_bookings_user_id"();



CREATE OR REPLACE TRIGGER "trg_bookings_broadcast" AFTER INSERT OR DELETE OR UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."booking_broadcast_trigger"();



CREATE OR REPLACE TRIGGER "trg_bookings_normalize_status" BEFORE INSERT OR UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."bookings_normalize_status"();



CREATE OR REPLACE TRIGGER "trg_bookings_set_period" BEFORE INSERT OR UPDATE OF "start_at", "end_at" ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."set_booking_period"();



CREATE OR REPLACE TRIGGER "trg_business_breaks_updated_at" BEFORE UPDATE ON "public"."business_breaks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."booking_items"
    ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_items"
    ADD CONSTRAINT "booking_items_service_item_id_fkey" FOREIGN KEY ("service_item_id") REFERENCES "public"."service_items"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cancellation_tokens"
    ADD CONSTRAINT "cancellation_tokens_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_logs"
    ADD CONSTRAINT "email_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_items"
    ADD CONSTRAINT "service_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



CREATE POLICY "Admin users can update their own data" ON "public"."admin_users" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid"))::"text" = ("id")::"text")) WITH CHECK (((( SELECT "auth"."uid"() AS "uid"))::"text" = ("id")::"text"));



CREATE POLICY "Admin users can view their own data" ON "public"."admin_users" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid"))::"text" = ("id")::"text"));



CREATE POLICY "Anyone can view bookings" ON "public"."bookings" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Authenticated users can manage reviews" ON "public"."reviews" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."about_content" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "about_content_admin_all" ON "public"."about_content" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "about_content_read_public" ON "public"."about_content" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "admin_business_hours_all" ON "public"."business_hours" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin_services_all" ON "public"."services" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_users_admin_all" ON "public"."admin_users" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."booking_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "booking_items_delete_owner_admin" ON "public"."booking_items" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     JOIN "public"."profiles" "p" ON (("p"."user_id" = "b"."user_id")))
  WHERE (("b"."id" = "booking_items"."booking_id") AND (("b"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("p"."is_admin" = true) AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "booking_items_insert_owner_admin" ON "public"."booking_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     JOIN "public"."profiles" "p" ON (("p"."user_id" = "b"."user_id")))
  WHERE (("b"."id" = "booking_items"."booking_id") AND (("b"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("p"."is_admin" = true) AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "booking_items_select_owner_admin" ON "public"."booking_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     LEFT JOIN "public"."profiles" "p" ON (("p"."user_id" = "b"."user_id")))
  WHERE (("b"."id" = "booking_items"."booking_id") AND (("b"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("p"."is_admin" = true) AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "booking_items_update_owner_admin" ON "public"."booking_items" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     JOIN "public"."profiles" "p" ON (("p"."user_id" = "b"."user_id")))
  WHERE (("b"."id" = "booking_items"."booking_id") AND (("b"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("p"."is_admin" = true) AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     JOIN "public"."profiles" "p" ON (("p"."user_id" = "b"."user_id")))
  WHERE (("b"."id" = "booking_items"."booking_id") AND (("b"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("p"."is_admin" = true) AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))))));



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bookings_admin_all" ON "public"."bookings" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "bookings_admin_update" ON "public"."bookings" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."is_admin" = true)))));



CREATE POLICY "bookings_owner_update" ON "public"."bookings" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "bookings_user_insert" ON "public"."bookings" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "bookings_user_update_own" ON "public"."bookings" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."business_breaks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "business_breaks_admin_delete" ON "public"."business_breaks" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."is_admin" = true)))));



CREATE POLICY "business_breaks_admin_insert" ON "public"."business_breaks" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."is_admin" = true)))));



CREATE POLICY "business_breaks_admin_select" ON "public"."business_breaks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."is_admin" = true)))));



CREATE POLICY "business_breaks_admin_update" ON "public"."business_breaks" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."is_admin" = true)))));



ALTER TABLE "public"."business_hours" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "business_hours_read_public" ON "public"."business_hours" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."cancellation_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cancellation_tokens_select_authenticated" ON "public"."cancellation_tokens" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     LEFT JOIN "public"."profiles" "p" ON (("p"."user_id" = "b"."user_id")))
  WHERE (("b"."id" = "cancellation_tokens"."booking_id") AND (("b"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("p"."is_admin" = true) AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))))));



ALTER TABLE "public"."closures" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "closures_select_all_authenticated" ON "public"."closures" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "closures_select_upcoming_anon" ON "public"."closures" FOR SELECT TO "anon" USING (("end_date" >= CURRENT_DATE));



ALTER TABLE "public"."email_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "email_logs_select_owner_admin" ON "public"."email_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     LEFT JOIN "public"."profiles" "p" ON (("p"."user_id" = "b"."user_id")))
  WHERE (("b"."id" = "email_logs"."booking_id") AND (("b"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("p"."is_admin" = true) AND ("p"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))))));



ALTER TABLE "public"."portfolio_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "portfolio_categories_admin_all" ON "public"."portfolio_categories" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "portfolio_categories_read_public" ON "public"."portfolio_categories" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."portfolio_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "portfolio_items_admin_all" ON "public"."portfolio_items" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "portfolio_items_read_public" ON "public"."portfolio_items" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_self" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "profiles_update_self" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."promotions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "promotions_select_authenticated" ON "public"."promotions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "promotions_select_public" ON "public"."promotions" FOR SELECT TO "anon" USING (true);



ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reviews_public_published_only" ON "public"."reviews" FOR SELECT TO "authenticated", "anon" USING (("is_published" = true));



ALTER TABLE "public"."service_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_items_read_public" ON "public"."service_items" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "services_read_public" ON "public"."services" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "site_settings_select_admin" ON "public"."site_settings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."is_admin" = true)))));



CREATE POLICY "site_settings_select_public" ON "public"."site_settings" FOR SELECT TO "anon" USING (("is_public" = true));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."booking_broadcast_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."booking_broadcast_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."booking_broadcast_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."booking_period"("p_start" timestamp with time zone, "p_end" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."booking_period"("p_start" timestamp with time zone, "p_end" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."booking_period"("p_start" timestamp with time zone, "p_end" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."bookings_compute_bounds"() TO "anon";
GRANT ALL ON FUNCTION "public"."bookings_compute_bounds"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."bookings_compute_bounds"() TO "service_role";



GRANT ALL ON FUNCTION "public"."bookings_normalize_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."bookings_normalize_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."bookings_normalize_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_booking"("p_token" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_booking"("p_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_booking"("p_token" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_booking_tx"("p_booking_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_booking_tx"("p_booking_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_booking_tx"("p_booking_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_booking_with_log"("p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_booking_with_log"("p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_booking_with_log"("p_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "postgres";
GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "anon";
GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "service_role";



GRANT ALL ON FUNCTION "public"."ceil_to_slot_minutes"("total_minutes" integer, "slot" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."ceil_to_slot_minutes"("total_minutes" integer, "slot" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."ceil_to_slot_minutes"("total_minutes" integer, "slot" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."confirm_booking"("p_service_item" "uuid", "p_start" timestamp with time zone, "p_end" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."confirm_booking"("p_service_item" "uuid", "p_start" timestamp with time zone, "p_end" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."confirm_booking"("p_service_item" "uuid", "p_start" timestamp with time zone, "p_end" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."confirm_booking"("p_service_item" "uuid", "p_start" timestamp with time zone, "p_end" timestamp with time zone) TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "service_role";
GRANT INSERT ON TABLE "public"."bookings" TO "anon";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."bookings" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_booking"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_name" "text", "p_start_at" timestamp with time zone, "p_duration_minutes" integer, "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_booking"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_name" "text", "p_start_at" timestamp with time zone, "p_duration_minutes" integer, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_booking"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_name" "text", "p_start_at" timestamp with time zone, "p_duration_minutes" integer, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_booking"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_name" "text", "p_start_at" timestamp with time zone, "p_duration_minutes" integer, "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_booking_by_service"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_item_id" "uuid", "p_start_at" timestamp with time zone, "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_booking_by_service"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_item_id" "uuid", "p_start_at" timestamp with time zone, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_booking_by_service"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_item_id" "uuid", "p_start_at" timestamp with time zone, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_booking_by_service"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_item_id" "uuid", "p_start_at" timestamp with time zone, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_booking_multi"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_item_ids" "uuid"[], "p_status" "text", "p_search_start_date" "date", "p_search_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_booking_multi"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_item_ids" "uuid"[], "p_status" "text", "p_search_start_date" "date", "p_search_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_booking_multi"("p_client_name" "text", "p_client_email" "text", "p_client_phone" "text", "p_service_item_ids" "uuid"[], "p_status" "text", "p_search_start_date" "date", "p_search_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "postgres";
GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "anon";
GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "postgres";
GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "anon";
GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "service_role";



GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_cancellation_token"("p_booking_id" "uuid", "p_expires_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_cancellation_token"("p_booking_id" "uuid", "p_expires_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_cancellation_token"("p_booking_id" "uuid", "p_expires_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_availability_overview"("p_start_date" "date", "p_end_date" "date", "p_duration_minutes" integer, "p_slot_step_minutes" integer, "p_buffer_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_availability_overview"("p_start_date" "date", "p_end_date" "date", "p_duration_minutes" integer, "p_slot_step_minutes" integer, "p_buffer_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_availability_overview"("p_start_date" "date", "p_end_date" "date", "p_duration_minutes" integer, "p_slot_step_minutes" integer, "p_buffer_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_slots"("p_date" "date", "p_duration_minutes" integer, "p_slot_step_minutes" integer, "p_buffer_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_slots"("p_date" "date", "p_duration_minutes" integer, "p_slot_step_minutes" integer, "p_buffer_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_slots"("p_date" "date", "p_duration_minutes" integer, "p_slot_step_minutes" integer, "p_buffer_minutes" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_booked_slots"("p_date" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_booked_slots"("p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_booked_slots"("p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_booked_slots"("p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "postgres";
GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "postgres";
GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "postgres";
GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "anon";
GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "authenticated";
GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_available_slots"("p_day" "date", "p_duration_minutes" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_available_slots"("p_day" "date", "p_duration_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."list_available_slots"("p_day" "date", "p_duration_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_available_slots"("p_day" "date", "p_duration_minutes" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_available_slots_by_service"("p_day" "date", "p_service_item_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_available_slots_by_service"("p_day" "date", "p_service_item_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."list_available_slots_by_service"("p_day" "date", "p_service_item_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_available_slots_by_service"("p_day" "date", "p_service_item_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "postgres";
GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "anon";
GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "service_role";



GRANT ALL ON FUNCTION "public"."parse_duration_to_minutes"("p_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."parse_duration_to_minutes"("p_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."parse_duration_to_minutes"("p_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."promote_admin"("p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."promote_admin"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."promote_admin"("p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_booking_period"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_booking_period"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_booking_period"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_bookings_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_bookings_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_bookings_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "service_role";


















GRANT ALL ON TABLE "public"."about_content" TO "anon";
GRANT ALL ON TABLE "public"."about_content" TO "authenticated";
GRANT ALL ON TABLE "public"."about_content" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."booking_items" TO "anon";
GRANT ALL ON TABLE "public"."booking_items" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_items" TO "service_role";



GRANT ALL ON TABLE "public"."business_breaks" TO "anon";
GRANT ALL ON TABLE "public"."business_breaks" TO "authenticated";
GRANT ALL ON TABLE "public"."business_breaks" TO "service_role";



GRANT ALL ON TABLE "public"."business_hours" TO "anon";
GRANT ALL ON TABLE "public"."business_hours" TO "authenticated";
GRANT ALL ON TABLE "public"."business_hours" TO "service_role";



GRANT ALL ON TABLE "public"."cancellation_tokens" TO "service_role";
GRANT SELECT ON TABLE "public"."cancellation_tokens" TO "authenticated";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."closures" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."closures" TO "authenticated";
GRANT ALL ON TABLE "public"."closures" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."email_logs" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."email_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."email_logs" TO "service_role";



GRANT ALL ON TABLE "public"."portfolio_categories" TO "anon";
GRANT ALL ON TABLE "public"."portfolio_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."portfolio_categories" TO "service_role";



GRANT ALL ON TABLE "public"."portfolio_items" TO "anon";
GRANT ALL ON TABLE "public"."portfolio_items" TO "authenticated";
GRANT ALL ON TABLE "public"."portfolio_items" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."promotions" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."promotions" TO "authenticated";
GRANT ALL ON TABLE "public"."promotions" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "service_role";
GRANT SELECT ON TABLE "public"."reviews" TO "anon";
GRANT SELECT ON TABLE "public"."reviews" TO "authenticated";



GRANT ALL ON TABLE "public"."service_item_members" TO "anon";
GRANT ALL ON TABLE "public"."service_item_members" TO "authenticated";
GRANT ALL ON TABLE "public"."service_item_members" TO "service_role";



GRANT ALL ON TABLE "public"."service_items" TO "service_role";
GRANT SELECT ON TABLE "public"."service_items" TO "anon";
GRANT SELECT ON TABLE "public"."service_items" TO "authenticated";



GRANT ALL ON TABLE "public"."service_items_with_minutes" TO "anon";
GRANT ALL ON TABLE "public"."service_items_with_minutes" TO "authenticated";
GRANT ALL ON TABLE "public"."service_items_with_minutes" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_settings" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
