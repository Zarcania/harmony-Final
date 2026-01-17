set check_function_bodies = off;

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

CREATE OR REPLACE FUNCTION public.bookings_broadcast_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  PERFORM realtime.broadcast_changes(
    'admin:bookings',
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

CREATE OR REPLACE FUNCTION public.get_available_slots_by_service(date_from date, date_to date, service_item_id uuid)
 RETURNS TABLE(day date, start_at timestamp with time zone, end_at timestamp with time zone, duration_minutes integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  d date;
  dow int;
  open_t time;
  close_t time;
  slot_start timestamptz;
  slot_end timestamptz;
  day_open timestamptz;
  day_close timestamptz;
  svc_duration int;
BEGIN
  IF date_to < date_from THEN
    RAISE EXCEPTION 'date_to must be >= date_from';
  END IF;

  SELECT COALESCE(si.duration_minutes, 60) INTO svc_duration
  FROM public.service_items si WHERE si.id = service_item_id;
  IF svc_duration IS NULL OR svc_duration <= 0 THEN
    svc_duration := 60;
  END IF;

  FOR d IN SELECT generate_series(date_from, date_to, interval '1 day')::date LOOP
    IF EXISTS (
      SELECT 1 FROM public.closures c
      WHERE d BETWEEN c.start_date AND c.end_date
    ) THEN
      CONTINUE;
    END IF;

    dow := EXTRACT(dow FROM d);

    SELECT bh.open_time, bh.close_time
    INTO open_t, close_t
    FROM public.business_hours bh
    WHERE bh.day_of_week = dow AND bh.is_closed IS NOT TRUE;

    IF NOT FOUND OR open_t IS NULL OR close_t IS NULL OR close_t <= open_t THEN
      CONTINUE;
    END IF;

    day_open := (d::timestamptz + open_t);
    day_close := (d::timestamptz + close_t);

    slot_start := day_open;
    WHILE slot_start + make_interval(mins => svc_duration) <= day_close LOOP
      slot_end := slot_start + make_interval(mins => svc_duration);

      IF EXISTS (
        SELECT 1 FROM public.booked_slots_public b
        WHERE b.day = d
          AND tstzrange(slot_start, slot_end, '[)') && b.ts
      ) THEN
        slot_start := slot_end;
        CONTINUE;
      END IF;

      day := d;
      start_at := slot_start;
      end_at := slot_end;
      duration_minutes := svc_duration;
      RETURN NEXT;
      slot_start := slot_end;
    END LOOP;
  END LOOP;
  RETURN;
END$function$
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

CREATE OR REPLACE FUNCTION public.sync_booked_slots_public()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
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

CREATE OR REPLACE FUNCTION public.take_index_usage_snapshot()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  INSERT INTO public.obs_index_usage_snapshots (schemaname, table_name, index_name, idx_scan, idx_tup_read, idx_tup_fetch)
  SELECT schemaname, relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
  FROM pg_stat_user_indexes;
$function$
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


