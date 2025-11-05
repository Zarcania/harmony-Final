drop extension if exists "pg_net";

create sequence "public"."obs_index_usage_snapshots_id_seq";

drop policy "Anyone can view bookings" on "public"."bookings";

drop policy "bookings_admin_all" on "public"."bookings";

drop policy "bookings_admin_update" on "public"."bookings";

drop policy "bookings_anon_insert" on "public"."bookings";

drop policy "bookings_owner_update" on "public"."bookings";

drop policy "bookings_user_insert" on "public"."bookings";

drop policy "bookings_user_update_own" on "public"."bookings";

drop policy "Anyone can view business_breaks" on "public"."business_breaks";

drop policy "Only admins can manage business_breaks" on "public"."business_breaks";

revoke delete on table "public"."business_breaks" from "anon";

revoke insert on table "public"."business_breaks" from "anon";

revoke references on table "public"."business_breaks" from "anon";

revoke select on table "public"."business_breaks" from "anon";

revoke trigger on table "public"."business_breaks" from "anon";

revoke truncate on table "public"."business_breaks" from "anon";

revoke update on table "public"."business_breaks" from "anon";

revoke delete on table "public"."business_breaks" from "authenticated";

revoke insert on table "public"."business_breaks" from "authenticated";

revoke references on table "public"."business_breaks" from "authenticated";

revoke select on table "public"."business_breaks" from "authenticated";

revoke trigger on table "public"."business_breaks" from "authenticated";

revoke truncate on table "public"."business_breaks" from "authenticated";

revoke update on table "public"."business_breaks" from "authenticated";

revoke delete on table "public"."business_breaks" from "service_role";

revoke insert on table "public"."business_breaks" from "service_role";

revoke references on table "public"."business_breaks" from "service_role";

revoke select on table "public"."business_breaks" from "service_role";

revoke trigger on table "public"."business_breaks" from "service_role";

revoke truncate on table "public"."business_breaks" from "service_role";

revoke update on table "public"."business_breaks" from "service_role";

alter table "public"."business_breaks" drop constraint "business_breaks_day_of_week_check";

alter table "public"."business_hours" drop constraint "uniq_business_hours_day";

drop view if exists "public"."bookings_public_busy";

alter table "public"."business_breaks" drop constraint "business_breaks_pkey";

drop index if exists "public"."business_breaks_pkey";

drop index if exists "public"."idx_about_order";

drop index if exists "public"."idx_booked_slots_public_ts";

drop index if exists "public"."idx_bookings_date";

drop index if exists "public"."idx_bookings_end_at";

drop index if exists "public"."idx_bookings_service_id";

drop index if exists "public"."idx_bookings_start_at";

drop index if exists "public"."idx_bookings_status";

drop index if exists "public"."idx_cancellation_tokens_expires_at";

drop index if exists "public"."idx_cancellation_tokens_token";

drop index if exists "public"."idx_email_logs_email_type";

drop index if exists "public"."idx_portfolio_category";

drop index if exists "public"."idx_reviews_is_published";

drop index if exists "public"."idx_service_items_order";

drop index if exists "public"."uniq_business_hours_day";

drop table "public"."business_breaks";


  create table "public"."obs_index_usage_snapshots" (
    "snapped_at" timestamp with time zone not null default now(),
    "schemaname" text,
    "table_name" text,
    "index_name" text,
    "idx_scan" bigint,
    "idx_tup_read" bigint,
    "idx_tup_fetch" bigint,
    "id" bigint not null default nextval('public.obs_index_usage_snapshots_id_seq'::regclass)
      );


alter table "public"."obs_index_usage_snapshots" enable row level security;

alter table "public"."booked_slots_public" add column "id" uuid not null default gen_random_uuid();

alter sequence "public"."obs_index_usage_snapshots_id_seq" owned by "public"."obs_index_usage_snapshots"."id";

select 1; 
-- CREATE INDEX booked_slots_no_overlap ON public.booked_slots_public USING gist (day, ts);

CREATE UNIQUE INDEX booked_slots_public_pkey ON public.booked_slots_public USING btree (id);

CREATE UNIQUE INDEX business_hours_unique_dow ON public.business_hours USING btree (day_of_week);

CREATE INDEX idx_booked_slots_public_ts_gist ON public.booked_slots_public USING gist (ts);

CREATE UNIQUE INDEX obs_index_usage_snapshots_pkey ON public.obs_index_usage_snapshots USING btree (id);

alter table "public"."booked_slots_public" add constraint "booked_slots_public_pkey" PRIMARY KEY using index "booked_slots_public_pkey";

alter table "public"."obs_index_usage_snapshots" add constraint "obs_index_usage_snapshots_pkey" PRIMARY KEY using index "obs_index_usage_snapshots_pkey";

alter table "public"."booked_slots_public" add constraint "booked_slots_no_overlap" EXCLUDE USING gist (day WITH =, ts WITH &&);

alter table "public"."business_hours" add constraint "business_hours_open_before_close" CHECK (((open_time IS NULL) OR (close_time IS NULL) OR (open_time < close_time))) not valid;

alter table "public"."business_hours" validate constraint "business_hours_open_before_close";

alter table "public"."business_hours" add constraint "business_hours_unique_dow" UNIQUE using index "business_hours_unique_dow";

set check_function_bodies = off;

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

CREATE OR REPLACE FUNCTION public.get_available_slots(date_from date, date_to date, slot_minutes integer DEFAULT 60)
 RETURNS TABLE(day date, start_at timestamp with time zone, end_at timestamp with time zone)
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
BEGIN
  IF date_to < date_from THEN
    RAISE EXCEPTION 'date_to must be >= date_from';
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
    WHILE slot_start + make_interval(mins => slot_minutes) <= day_close LOOP
      slot_end := slot_start + make_interval(mins => slot_minutes);

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
      RETURN NEXT;
      slot_start := slot_end;
    END LOOP;
  END LOOP;
  RETURN;
END$function$
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

create or replace view "public"."obs_index_usage" as  SELECT schemaname,
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
   FROM pg_stat_user_indexes
  ORDER BY idx_scan;


create or replace view "public"."obs_rls_audit" as  SELECT n.nspname AS schema,
    c.relname AS "table",
    c.relrowsecurity AS rls_enabled
   FROM (pg_class c
     JOIN pg_namespace n ON ((n.oid = c.relnamespace)))
  WHERE ((c.relkind = 'r'::"char") AND (n.nspname = 'public'::name))
  ORDER BY n.nspname, c.relname;


create or replace view "public"."obs_top_queries" as  SELECT queryid,
    calls,
    total_exec_time,
    mean_exec_time,
    rows,
    shared_blks_hit,
    shared_blks_read,
    local_blks_hit,
    local_blks_read,
    query
   FROM extensions.pg_stat_statements
  ORDER BY total_exec_time DESC
 LIMIT 200;


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

create or replace view "public"."bookings_public_busy" as  SELECT day,
    ts
   FROM public.booked_slots_public;


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

grant delete on table "public"."obs_index_usage_snapshots" to "service_role";

grant insert on table "public"."obs_index_usage_snapshots" to "service_role";

grant references on table "public"."obs_index_usage_snapshots" to "service_role";

grant select on table "public"."obs_index_usage_snapshots" to "service_role";

grant trigger on table "public"."obs_index_usage_snapshots" to "service_role";

grant truncate on table "public"."obs_index_usage_snapshots" to "service_role";

grant update on table "public"."obs_index_usage_snapshots" to "service_role";


  create policy "public_can_read_booked_slots"
  on "public"."booked_slots_public"
  as permissive
  for select
  to anon
using (true);



  create policy "admins_can_all_bookings"
  on "public"."bookings"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (p.is_admin = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (p.is_admin = true)))));



  create policy "public_can_read_business_hours"
  on "public"."business_hours"
  as permissive
  for select
  to anon
using (true);



  create policy "public_can_read_closures"
  on "public"."closures"
  as permissive
  for select
  to anon
using (true);



  create policy "obs_snapshots_admin_read"
  on "public"."obs_index_usage_snapshots"
  as permissive
  for select
  to authenticated
using (((auth.jwt() ->> 'user_role'::text) = 'admin'::text));



  create policy "public_can_read_portfolio_categories"
  on "public"."portfolio_categories"
  as permissive
  for select
  to anon
using (true);



  create policy "public_can_read_portfolio_items"
  on "public"."portfolio_items"
  as permissive
  for select
  to anon
using (true);



  create policy "public_can_read_promotions"
  on "public"."promotions"
  as permissive
  for select
  to anon
using (true);



  create policy "public_can_read_service_items"
  on "public"."service_items"
  as permissive
  for select
  to anon
using (true);



  create policy "public_can_read_services"
  on "public"."services"
  as permissive
  for select
  to anon
using (true);


CREATE TRIGGER tr_bookings_broadcast AFTER INSERT OR DELETE OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.bookings_broadcast_trigger();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "admins_can_read_realtime"
  on "realtime"."messages"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (p.is_admin = true)))));



  create policy "admins_can_write_realtime"
  on "realtime"."messages"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (p.is_admin = true)))));



  create policy "members_can_receive"
  on "realtime"."messages"
  as permissive
  for select
  to authenticated
using (((topic ~~ 'service_item:%'::text) AND (EXISTS ( SELECT 1
   FROM public.service_item_members m
  WHERE ((m.user_id = ( SELECT auth.uid() AS uid)) AND (m.service_item_id = (split_part(messages.topic, ':'::text, 2))::uuid))))));



  create policy "members_can_send"
  on "realtime"."messages"
  as permissive
  for insert
  to authenticated
with check (((topic ~~ 'service_item:%'::text) AND (EXISTS ( SELECT 1
   FROM public.service_item_members m
  WHERE ((m.user_id = ( SELECT auth.uid() AS uid)) AND (m.service_item_id = (split_part(messages.topic, ':'::text, 2))::uuid))))));



  create policy "st_admin_all_images"
  on "storage"."objects"
  as permissive
  for all
  to authenticated
using (((bucket_id = 'images'::text) AND public.is_admin()))
with check (((bucket_id = 'images'::text) AND public.is_admin()));



  create policy "st_read_images_public"
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using ((bucket_id = 'images'::text));



