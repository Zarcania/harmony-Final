drop policy "about_content_read_public" on "public"."about_content";

drop policy "Admin users can update their own data" on "public"."admin_users";

drop policy "Admin users can view their own data" on "public"."admin_users";

drop policy "booking_items_delete_owner_admin" on "public"."booking_items";

drop policy "booking_items_insert_owner_admin" on "public"."booking_items";

drop policy "booking_items_select_owner_admin" on "public"."booking_items";

drop policy "booking_items_update_owner_admin" on "public"."booking_items";

drop policy "Anyone can view bookings" on "public"."bookings";

drop policy "bookings_admin_update" on "public"."bookings";

drop policy "bookings_owner_update" on "public"."bookings";

drop policy "bookings_user_insert" on "public"."bookings";

drop policy "bookings_user_update_own" on "public"."bookings";

drop policy "business_breaks_admin_delete" on "public"."business_breaks";

drop policy "business_breaks_admin_insert" on "public"."business_breaks";

drop policy "business_breaks_admin_select" on "public"."business_breaks";

drop policy "business_breaks_admin_update" on "public"."business_breaks";

drop policy "business_hours_read_public" on "public"."business_hours";

drop policy "cancellation_tokens_select_authenticated" on "public"."cancellation_tokens";

drop policy "email_logs_select_owner_admin" on "public"."email_logs";

drop policy "portfolio_categories_read_public" on "public"."portfolio_categories";

drop policy "portfolio_items_read_public" on "public"."portfolio_items";

drop policy "profiles_select_self" on "public"."profiles";

drop policy "profiles_update_self" on "public"."profiles";

drop policy "reviews_public_published_only" on "public"."reviews";

drop policy "service_items_read_public" on "public"."service_items";

drop policy "services_read_public" on "public"."services";

drop policy "site_settings_select_admin" on "public"."site_settings";

revoke delete on table "public"."admin_users" from "anon";

revoke insert on table "public"."admin_users" from "anon";

revoke references on table "public"."admin_users" from "anon";

revoke select on table "public"."admin_users" from "anon";

revoke trigger on table "public"."admin_users" from "anon";

revoke truncate on table "public"."admin_users" from "anon";

revoke update on table "public"."admin_users" from "anon";

revoke delete on table "public"."admin_users" from "authenticated";

revoke insert on table "public"."admin_users" from "authenticated";

revoke references on table "public"."admin_users" from "authenticated";

revoke select on table "public"."admin_users" from "authenticated";

revoke trigger on table "public"."admin_users" from "authenticated";

revoke truncate on table "public"."admin_users" from "authenticated";

revoke update on table "public"."admin_users" from "authenticated";

revoke delete on table "public"."bookings" from "anon";

revoke references on table "public"."bookings" from "anon";

revoke select on table "public"."bookings" from "anon";

revoke trigger on table "public"."bookings" from "anon";

revoke truncate on table "public"."bookings" from "anon";

revoke update on table "public"."bookings" from "anon";

revoke delete on table "public"."bookings" from "authenticated";

revoke references on table "public"."bookings" from "authenticated";

revoke trigger on table "public"."bookings" from "authenticated";

revoke truncate on table "public"."bookings" from "authenticated";

revoke delete on table "public"."cancellation_tokens" from "anon";

revoke insert on table "public"."cancellation_tokens" from "anon";

revoke references on table "public"."cancellation_tokens" from "anon";

revoke select on table "public"."cancellation_tokens" from "anon";

revoke trigger on table "public"."cancellation_tokens" from "anon";

revoke truncate on table "public"."cancellation_tokens" from "anon";

revoke update on table "public"."cancellation_tokens" from "anon";

revoke delete on table "public"."cancellation_tokens" from "authenticated";

revoke insert on table "public"."cancellation_tokens" from "authenticated";

revoke references on table "public"."cancellation_tokens" from "authenticated";

revoke trigger on table "public"."cancellation_tokens" from "authenticated";

revoke truncate on table "public"."cancellation_tokens" from "authenticated";

revoke update on table "public"."cancellation_tokens" from "authenticated";

revoke delete on table "public"."closures" from "anon";

revoke insert on table "public"."closures" from "anon";

revoke update on table "public"."closures" from "anon";

revoke delete on table "public"."closures" from "authenticated";

revoke insert on table "public"."closures" from "authenticated";

revoke update on table "public"."closures" from "authenticated";

revoke delete on table "public"."email_logs" from "anon";

revoke insert on table "public"."email_logs" from "anon";

revoke update on table "public"."email_logs" from "anon";

revoke delete on table "public"."email_logs" from "authenticated";

revoke insert on table "public"."email_logs" from "authenticated";

revoke update on table "public"."email_logs" from "authenticated";

revoke delete on table "public"."promotions" from "anon";

revoke insert on table "public"."promotions" from "anon";

revoke update on table "public"."promotions" from "anon";

revoke delete on table "public"."reviews" from "anon";

revoke insert on table "public"."reviews" from "anon";

revoke references on table "public"."reviews" from "anon";

revoke trigger on table "public"."reviews" from "anon";

revoke truncate on table "public"."reviews" from "anon";

revoke update on table "public"."reviews" from "anon";

revoke delete on table "public"."reviews" from "authenticated";

revoke insert on table "public"."reviews" from "authenticated";

revoke references on table "public"."reviews" from "authenticated";

revoke trigger on table "public"."reviews" from "authenticated";

revoke truncate on table "public"."reviews" from "authenticated";

revoke update on table "public"."reviews" from "authenticated";

revoke delete on table "public"."service_items" from "anon";

revoke insert on table "public"."service_items" from "anon";

revoke references on table "public"."service_items" from "anon";

revoke trigger on table "public"."service_items" from "anon";

revoke truncate on table "public"."service_items" from "anon";

revoke update on table "public"."service_items" from "anon";

revoke delete on table "public"."service_items" from "authenticated";

revoke insert on table "public"."service_items" from "authenticated";

revoke references on table "public"."service_items" from "authenticated";

revoke trigger on table "public"."service_items" from "authenticated";

revoke truncate on table "public"."service_items" from "authenticated";

revoke update on table "public"."service_items" from "authenticated";

revoke delete on table "public"."site_settings" from "anon";

revoke insert on table "public"."site_settings" from "anon";

revoke update on table "public"."site_settings" from "anon";

revoke delete on table "public"."site_settings" from "authenticated";

revoke insert on table "public"."site_settings" from "authenticated";

revoke update on table "public"."site_settings" from "authenticated";

alter table "public"."bookings" drop constraint "no_overlap";

drop function if exists "public"."get_booked_slots"(p_date date);

drop index if exists "public"."booking_items_service_item_idx";

drop index if exists "public"."cancellation_tokens_token_uidx";

drop index if exists "public"."idx_bookings_ts";

drop index if exists "public"."idx_reviews_published";

select 1; 
-- drop index if exists "public"."no_overlap";


  create table "public"."booked_slots_public" (
    "day" date not null,
    "ts" tstzrange not null
      );


alter table "public"."booked_slots_public" enable row level security;

alter table "public"."service_item_members" enable row level security;

CREATE UNIQUE INDEX booked_slots_public_day_ts_key ON public.booked_slots_public USING btree (day, ts);

CREATE INDEX idx_booked_slots_public_day ON public.booked_slots_public USING btree (day);

CREATE INDEX idx_booked_slots_public_ts ON public.booked_slots_public USING gist (ts);

alter table "public"."booked_slots_public" add constraint "booked_slots_public_day_ts_key" UNIQUE using index "booked_slots_public_day_ts_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.sync_booked_slots_public()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_old_ts tstzrange;
  v_new_ts tstzrange;
  v_old_day date;
  v_new_day date;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('confirmed','pending') AND OLD.start_at IS NOT NULL AND OLD.end_at IS NOT NULL THEN
      v_old_day := (OLD.start_at AT TIME ZONE 'UTC')::date;
      v_old_ts := tstzrange(OLD.start_at, OLD.end_at, '[)');
      DELETE FROM public.booked_slots_public WHERE day = v_old_day AND ts = v_old_ts;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('confirmed','pending') AND NEW.start_at IS NOT NULL AND NEW.end_at IS NOT NULL THEN
      v_new_day := (NEW.start_at AT TIME ZONE 'UTC')::date;
      v_new_ts := tstzrange(NEW.start_at, NEW.end_at, '[)');
      INSERT INTO public.booked_slots_public(day, ts)
      VALUES (v_new_day, v_new_ts)
      ON CONFLICT (day, ts) DO NOTHING;
    END IF;
    RETURN NEW;
  ELSE -- UPDATE
    -- Supprime ancien si il était busy
    IF OLD.status IN ('confirmed','pending') AND OLD.start_at IS NOT NULL AND OLD.end_at IS NOT NULL THEN
      v_old_day := (OLD.start_at AT TIME ZONE 'UTC')::date;
      v_old_ts := tstzrange(OLD.start_at, OLD.end_at, '[)');
      DELETE FROM public.booked_slots_public WHERE day = v_old_day AND ts = v_old_ts;
    END IF;
    -- Ajoute nouveau si il est busy
    IF NEW.status IN ('confirmed','pending') AND NEW.start_at IS NOT NULL AND NEW.end_at IS NOT NULL THEN
      v_new_day := (NEW.start_at AT TIME ZONE 'UTC')::date;
      v_new_ts := tstzrange(NEW.start_at, NEW.end_at, '[)');
      INSERT INTO public.booked_slots_public(day, ts)
      VALUES (v_new_day, v_new_ts)
      ON CONFLICT (day, ts) DO NOTHING;
    END IF;
    RETURN NEW;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.booking_broadcast_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.booking_period(p_start timestamp with time zone, p_end timestamp with time zone)
 RETURNS tstzrange
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT tstzrange(p_start, p_end, '[)');
$function$
;

CREATE OR REPLACE FUNCTION public.bookings_compute_bounds()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  -- preferred_time may be TEXT or TIME; ::time handles both
  NEW.start_at := (NEW.preferred_date::date + NEW.preferred_time::time);
  NEW.end_at   := NEW.start_at + make_interval(mins => coalesce(NEW.duration_minutes, 60));
  NEW.ts       := tstzrange(NEW.start_at, NEW.end_at, '[)');
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.bookings_compute_times(p_date date, p_time text, p_duration integer)
 RETURNS TABLE(start_at timestamp with time zone, end_at timestamp with time zone, slot tstzrange)
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  select
    (p_date::timestamp + (p_time::time)) AT TIME ZONE 'Europe/Paris',
    ((p_date::timestamp + (p_time::time)) AT TIME ZONE 'Europe/Paris') + make_interval(mins => coalesce(p_duration, 60)),
    tstzrange(
      (p_date::timestamp + (p_time::time)) AT TIME ZONE 'Europe/Paris',
      ((p_date::timestamp + (p_time::time)) AT TIME ZONE 'Europe/Paris') + make_interval(mins => coalesce(p_duration, 60)),
      '[)'
    );
$function$
;

CREATE OR REPLACE FUNCTION public.bookings_normalize_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$
;

create or replace view "public"."bookings_public_busy" as  SELECT gen_random_uuid() AS id,
    ts,
    true AS is_busy
   FROM public.booked_slots_public;


CREATE OR REPLACE FUNCTION public.ceil_to_slot_minutes(total_minutes integer, slot integer DEFAULT 30)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE STRICT
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT CASE WHEN total_minutes % slot = 0 THEN total_minutes
              ELSE ((total_minutes / slot) + 1) * slot END;
$function$
;

CREATE OR REPLACE FUNCTION public.confirm_booking(p_service_item uuid, p_start timestamp with time zone, p_end timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_booking(p_client_name text, p_client_email text, p_client_phone text, p_service_name text, p_start_at timestamp with time zone, p_duration_minutes integer, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS public.bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_booking_by_service(p_client_name text, p_client_email text, p_client_phone text, p_service_item_id uuid, p_start_at timestamp with time zone, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS public.bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_booking_multi(p_client_name text, p_client_email text, p_client_phone text, p_service_item_ids uuid[], p_status text DEFAULT 'pending'::text, p_search_start_date date DEFAULT ((now() AT TIME ZONE 'UTC'::text))::date, p_search_days integer DEFAULT 14)
 RETURNS TABLE(id uuid, start_at timestamp without time zone, end_at timestamp without time zone, duration_minutes integer, status text)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.delete_promotion(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Accès refusé: admin requis' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.promotions WHERE id = p_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_availability_overview(p_start_date date, p_end_date date, p_duration_minutes integer, p_slot_step_minutes integer DEFAULT 15, p_buffer_minutes integer DEFAULT 0)
 RETURNS TABLE(the_date date, has_availability boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_available_slots(p_date date, p_duration_minutes integer, p_slot_step_minutes integer DEFAULT 15, p_buffer_minutes integer DEFAULT 0)
 RETURNS TABLE(slot_start timestamp with time zone, slot_end timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
      RETURN;
    END IF;
  END IF;

  FOR i IN 1..array_length(windows,1) BY 2 LOOP
    open_t := windows[i];
    close_t := windows[i+1];
    start_ts := (p_date::timestamptz + open_t) AT TIME ZONE tz;
    end_ts   := (p_date::timestamptz + close_t) AT TIME ZONE tz;

    slot_start_ts := start_ts;
    LOOP
      slot_end_ts := slot_start_ts + duration;
      EXIT WHEN slot_end_ts > end_ts;

      IF NOT (has_break AND slot_start_ts < break_end_ts AND slot_end_ts > break_start_ts) THEN
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
      END IF;

      slot_start_ts := slot_start_ts + make_interval(mins => p_slot_step_minutes);
      EXIT WHEN slot_start_ts + duration > end_ts;
    END LOOP;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_booked_slots(p_date date)
 RETURNS SETOF tstzrange
 LANGUAGE sql
 STABLE
AS $function$
  SELECT ts
  FROM public.booked_slots_public
  WHERE day = p_date;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS(
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_admin = true
  );
$function$
;

CREATE OR REPLACE FUNCTION public.list_available_slots(p_day date, p_duration_minutes integer)
 RETURNS TABLE(start_at timestamp with time zone, end_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.list_available_slots_by_service(p_day date, p_service_item_id uuid)
 RETURNS TABLE(start_at timestamp with time zone, end_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.parse_duration_to_minutes(p_text text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_booking_period()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  NEW.period := public.booking_period(NEW.start_at, NEW.end_at);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.trg_bookings_set_times()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_start timestamptz;
  v_end   timestamptz;
  v_slot  tstzrange;
begin
  select s, e, r into v_start, v_end, v_slot
  from (
    select (t).start_at as s, (t).end_at as e, (t).slot as r
    from (
      select public.bookings_compute_times(new.preferred_date, new.preferred_time, new.duration_minutes) as t
    ) q
  ) z;

  new.start_at := v_start;
  new.end_at   := v_end;
  new.slot     := v_slot;
  return new;
end;
$function$
;

grant delete on table "public"."booked_slots_public" to "anon";

grant insert on table "public"."booked_slots_public" to "anon";

grant references on table "public"."booked_slots_public" to "anon";

grant select on table "public"."booked_slots_public" to "anon";

grant trigger on table "public"."booked_slots_public" to "anon";

grant truncate on table "public"."booked_slots_public" to "anon";

grant update on table "public"."booked_slots_public" to "anon";

grant delete on table "public"."booked_slots_public" to "authenticated";

grant insert on table "public"."booked_slots_public" to "authenticated";

grant references on table "public"."booked_slots_public" to "authenticated";

grant select on table "public"."booked_slots_public" to "authenticated";

grant trigger on table "public"."booked_slots_public" to "authenticated";

grant truncate on table "public"."booked_slots_public" to "authenticated";

grant update on table "public"."booked_slots_public" to "authenticated";

grant delete on table "public"."booked_slots_public" to "service_role";

grant insert on table "public"."booked_slots_public" to "service_role";

grant references on table "public"."booked_slots_public" to "service_role";

grant select on table "public"."booked_slots_public" to "service_role";

grant trigger on table "public"."booked_slots_public" to "service_role";

grant truncate on table "public"."booked_slots_public" to "service_role";

grant update on table "public"."booked_slots_public" to "service_role";


  create policy "public_can_read"
  on "public"."booked_slots_public"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "service_item_members_admin_select"
  on "public"."service_item_members"
  as permissive
  for select
  to authenticated
using (public.is_admin());



  create policy "about_content_read_public"
  on "public"."about_content"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Admin users can update their own data"
  on "public"."admin_users"
  as permissive
  for update
  to authenticated
using (((( SELECT ( SELECT auth.uid() AS uid) AS uid))::text = (id)::text))
with check (((( SELECT ( SELECT auth.uid() AS uid) AS uid))::text = (id)::text));



  create policy "Admin users can view their own data"
  on "public"."admin_users"
  as permissive
  for select
  to authenticated
using (((( SELECT ( SELECT auth.uid() AS uid) AS uid))::text = (id)::text));



  create policy "booking_items_delete_owner_admin"
  on "public"."booking_items"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.bookings b
     JOIN public.profiles p ON ((p.user_id = b.user_id)))
  WHERE ((b.id = booking_items.booking_id) AND ((b.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ((p.is_admin = true) AND (p.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))))))));



  create policy "booking_items_insert_owner_admin"
  on "public"."booking_items"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM (public.bookings b
     JOIN public.profiles p ON ((p.user_id = b.user_id)))
  WHERE ((b.id = booking_items.booking_id) AND ((b.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ((p.is_admin = true) AND (p.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))))))));



  create policy "booking_items_select_owner_admin"
  on "public"."booking_items"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.bookings b
     LEFT JOIN public.profiles p ON ((p.user_id = b.user_id)))
  WHERE ((b.id = booking_items.booking_id) AND ((b.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ((p.is_admin = true) AND (p.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))))))));



  create policy "booking_items_update_owner_admin"
  on "public"."booking_items"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.bookings b
     JOIN public.profiles p ON ((p.user_id = b.user_id)))
  WHERE ((b.id = booking_items.booking_id) AND ((b.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ((p.is_admin = true) AND (p.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))))))))
with check ((EXISTS ( SELECT 1
   FROM (public.bookings b
     JOIN public.profiles p ON ((p.user_id = b.user_id)))
  WHERE ((b.id = booking_items.booking_id) AND ((b.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ((p.is_admin = true) AND (p.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))))))));



  create policy "Anyone can view bookings"
  on "public"."bookings"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "bookings_admin_update"
  on "public"."bookings"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (p.is_admin = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (p.is_admin = true)))));



  create policy "bookings_owner_update"
  on "public"."bookings"
  as permissive
  for update
  to authenticated
using ((( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id))
with check ((( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id));



  create policy "bookings_user_insert"
  on "public"."bookings"
  as permissive
  for insert
  to authenticated
with check ((( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id));



  create policy "bookings_user_update_own"
  on "public"."bookings"
  as permissive
  for update
  to authenticated
using ((( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id))
with check ((( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id));



  create policy "business_breaks_admin_delete"
  on "public"."business_breaks"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (p.is_admin = true)))));



  create policy "business_breaks_admin_insert"
  on "public"."business_breaks"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (p.is_admin = true)))));



  create policy "business_breaks_admin_select"
  on "public"."business_breaks"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (p.is_admin = true)))));



  create policy "business_breaks_admin_update"
  on "public"."business_breaks"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (p.is_admin = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (p.is_admin = true)))));



  create policy "business_hours_read_public"
  on "public"."business_hours"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "cancellation_tokens_select_authenticated"
  on "public"."cancellation_tokens"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.bookings b
     LEFT JOIN public.profiles p ON ((p.user_id = b.user_id)))
  WHERE ((b.id = cancellation_tokens.booking_id) AND ((b.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ((p.is_admin = true) AND (p.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))))))));



  create policy "email_logs_select_owner_admin"
  on "public"."email_logs"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.bookings b
     LEFT JOIN public.profiles p ON ((p.user_id = b.user_id)))
  WHERE ((b.id = email_logs.booking_id) AND ((b.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ((p.is_admin = true) AND (p.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))))))));



  create policy "portfolio_categories_read_public"
  on "public"."portfolio_categories"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "portfolio_items_read_public"
  on "public"."portfolio_items"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "profiles_select_self"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)));



  create policy "profiles_update_self"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)))
with check ((user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)));



  create policy "reviews_public_published_only"
  on "public"."reviews"
  as permissive
  for select
  to anon, authenticated
using ((is_published = true));



  create policy "service_items_read_public"
  on "public"."service_items"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "services_read_public"
  on "public"."services"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "site_settings_select_admin"
  on "public"."site_settings"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (p.is_admin = true)))));


CREATE TRIGGER bookings_sync_booked_slots_public AFTER INSERT OR DELETE OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.sync_booked_slots_public();


