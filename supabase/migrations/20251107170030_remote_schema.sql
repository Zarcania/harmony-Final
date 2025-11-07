drop trigger if exists "bookings_enforce_window_biu" on "public"."bookings";

drop policy "about_content_read_public" on "public"."about_content";

drop policy "business_hours_read_public" on "public"."business_hours";

drop policy "public_can_read_business_hours" on "public"."business_hours";

drop policy "closures_select_all_authenticated" on "public"."closures";

drop policy "closures_select_upcoming_anon" on "public"."closures";

drop policy "public_can_read_closures" on "public"."closures";

drop policy "portfolio_categories_read_public" on "public"."portfolio_categories";

drop policy "public_can_read_portfolio_categories" on "public"."portfolio_categories";

drop policy "portfolio_items_read_public" on "public"."portfolio_items";

drop policy "public_can_read_portfolio_items" on "public"."portfolio_items";

drop policy "promotions_select_authenticated" on "public"."promotions";

drop policy "promotions_select_public" on "public"."promotions";

drop policy "public_can_read_promotions" on "public"."promotions";

drop policy "reviews_public_published_only" on "public"."reviews";

drop policy "public_can_read_service_items" on "public"."service_items";

drop policy "service_items_read_public" on "public"."service_items";

drop policy "public_can_read_services" on "public"."services";

drop policy "services_read_public" on "public"."services";

drop policy "site_settings_select_admin" on "public"."site_settings";

drop policy "site_settings_select_public" on "public"."site_settings";

drop policy "public_can_read" on "public"."booked_slots_public";

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

revoke delete on table "public"."app_settings" from "anon";

revoke insert on table "public"."app_settings" from "anon";

revoke references on table "public"."app_settings" from "anon";

revoke select on table "public"."app_settings" from "anon";

revoke trigger on table "public"."app_settings" from "anon";

revoke truncate on table "public"."app_settings" from "anon";

revoke update on table "public"."app_settings" from "anon";

revoke delete on table "public"."app_settings" from "authenticated";

revoke insert on table "public"."app_settings" from "authenticated";

revoke references on table "public"."app_settings" from "authenticated";

revoke select on table "public"."app_settings" from "authenticated";

revoke trigger on table "public"."app_settings" from "authenticated";

revoke truncate on table "public"."app_settings" from "authenticated";

revoke update on table "public"."app_settings" from "authenticated";

revoke delete on table "public"."app_settings" from "service_role";

revoke insert on table "public"."app_settings" from "service_role";

revoke references on table "public"."app_settings" from "service_role";

revoke select on table "public"."app_settings" from "service_role";

revoke trigger on table "public"."app_settings" from "service_role";

revoke truncate on table "public"."app_settings" from "service_role";

revoke update on table "public"."app_settings" from "service_role";

revoke delete on table "public"."bookings" from "anon";

revoke references on table "public"."bookings" from "anon";

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

revoke delete on table "public"."obs_index_usage_snapshots" from "anon";

revoke insert on table "public"."obs_index_usage_snapshots" from "anon";

revoke references on table "public"."obs_index_usage_snapshots" from "anon";

revoke select on table "public"."obs_index_usage_snapshots" from "anon";

revoke trigger on table "public"."obs_index_usage_snapshots" from "anon";

revoke truncate on table "public"."obs_index_usage_snapshots" from "anon";

revoke update on table "public"."obs_index_usage_snapshots" from "anon";

revoke delete on table "public"."obs_index_usage_snapshots" from "authenticated";

revoke insert on table "public"."obs_index_usage_snapshots" from "authenticated";

revoke references on table "public"."obs_index_usage_snapshots" from "authenticated";

revoke select on table "public"."obs_index_usage_snapshots" from "authenticated";

revoke trigger on table "public"."obs_index_usage_snapshots" from "authenticated";

revoke truncate on table "public"."obs_index_usage_snapshots" from "authenticated";

revoke update on table "public"."obs_index_usage_snapshots" from "authenticated";

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

drop function if exists "public"."enforce_booking_window"();

drop function if exists "public"."get_booking_max_days"();

drop function if exists "public"."get_setting_int"(p_key text, p_default integer);

alter table "public"."app_settings" drop constraint "app_settings_pkey";

drop index if exists "public"."app_settings_pkey";

drop table "public"."app_settings";


  create table "public"."business_breaks" (
    "id" uuid not null default gen_random_uuid(),
    "day_of_week" integer not null,
    "break_start" time without time zone,
    "break_end" time without time zone,
    "enabled" boolean not null default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."business_breaks" enable row level security;

alter table "public"."portfolio_items" disable row level security;

alter table "public"."promotions" disable row level security;

alter table "public"."service_items" disable row level security;

alter table "public"."services" disable row level security;

CREATE UNIQUE INDEX business_breaks_day_of_week_key ON public.business_breaks USING btree (day_of_week);

CREATE UNIQUE INDEX business_breaks_pkey ON public.business_breaks USING btree (id);

CREATE UNIQUE INDEX business_hours_day_of_week_key ON public.business_hours USING btree (day_of_week);

CREATE INDEX idx_bookings_date ON public.bookings USING btree (preferred_date);

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);

alter table "public"."business_breaks" add constraint "business_breaks_pkey" PRIMARY KEY using index "business_breaks_pkey";

alter table "public"."bookings" add constraint "bookings_start_not_past_active" CHECK (((start_at >= now()) OR (status = ANY (ARRAY['cancelled'::text, 'completed'::text])))) not valid;

alter table "public"."bookings" validate constraint "bookings_start_not_past_active";

set check_function_bodies = off;

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
  min_allowed_date date := today;            -- CHANGÉ: autoriser aujourd'hui
  max_allowed_date date := today + 30;       -- 30 jours glissants
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

CREATE OR REPLACE FUNCTION public.parse_duration_to_minutes(p_text text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'extensions'
AS $function$
with norm as (
  select lower(trim(p_text)) as t
), t1 as (
  select regexp_replace(
           replace(replace(replace(replace(replace(replace(t,'minutes','min'),'minute','min'),'mins','min'),'mns','min'),'hours','h'),'hour','h'),
           '\\s+', ' ', 'g'
         ) as t
  from norm
), hms as (
  select t,
         case when t ~ '^[0-9]+:[0-9]{1,2}$' then split_part(t, ':', 1)::int else null end as hh_colon,
         case when t ~ '^[0-9]+:[0-9]{1,2}$' then split_part(t, ':', 2)::int else null end as mm_colon
  from t1
), parsed as (
  select t,
    coalesce(
      case when hh_colon is not null then hh_colon*60 + mm_colon end,
      case when t ~ '^[0-9]+\\s*h\\s*[0-9]{1,2}\\s*min?$' then
        (regexp_replace(t, '^.*?([0-9]+)\\s*h.*$', '\\1'))::int*60 + (regexp_replace(t, '^.*?([0-9]{1,2})\\s*min.*$', '\\1'))::int
      end,
      case when t ~ '^[0-9]+h[0-9]{1,2}$' then
        (regexp_replace(t, '^([0-9]+)h[0-9]{1,2}$', '\\1'))::int*60 + (regexp_replace(t, '^[0-9]+h([0-9]{1,2})$', '\\1'))::int
      end,
      case when t ~ '^[0-9]+\\s*h\\s*$' or t ~ '^[0-9]+h$' then (regexp_replace(t, '[^0-9]', '', 'g'))::int * 60 end,
      case when t ~ '^[0-9]+\\s*min$' or t ~ '^[0-9]+m$' or t ~ '^[0-9]+$' then (regexp_replace(t, '[^0-9]', '', 'g'))::int end,
      nullif(regexp_replace(t, '[^0-9]', '', 'g'), '')::int
    ) as minutes
  from hms
)
select minutes from parsed;
$function$
;

grant delete on table "public"."business_breaks" to "anon";

grant insert on table "public"."business_breaks" to "anon";

grant references on table "public"."business_breaks" to "anon";

grant select on table "public"."business_breaks" to "anon";

grant trigger on table "public"."business_breaks" to "anon";

grant truncate on table "public"."business_breaks" to "anon";

grant update on table "public"."business_breaks" to "anon";

grant delete on table "public"."business_breaks" to "authenticated";

grant insert on table "public"."business_breaks" to "authenticated";

grant references on table "public"."business_breaks" to "authenticated";

grant select on table "public"."business_breaks" to "authenticated";

grant trigger on table "public"."business_breaks" to "authenticated";

grant truncate on table "public"."business_breaks" to "authenticated";

grant update on table "public"."business_breaks" to "authenticated";

grant delete on table "public"."business_breaks" to "service_role";

grant insert on table "public"."business_breaks" to "service_role";

grant references on table "public"."business_breaks" to "service_role";

grant select on table "public"."business_breaks" to "service_role";

grant trigger on table "public"."business_breaks" to "service_role";

grant truncate on table "public"."business_breaks" to "service_role";

grant update on table "public"."business_breaks" to "service_role";


  create policy "about_content_public_read"
  on "public"."about_content"
  as permissive
  for select
  to public
using (true);



  create policy "bookings_admin_all"
  on "public"."bookings"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "bookings_read_public"
  on "public"."bookings"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "business_breaks_admin_all"
  on "public"."business_breaks"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "business_breaks_public_read"
  on "public"."business_breaks"
  as permissive
  for select
  to public
using (true);



  create policy "business_hours_admin_all"
  on "public"."business_hours"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "business_hours_public_read"
  on "public"."business_hours"
  as permissive
  for select
  to public
using (true);



  create policy "closures_admin_all"
  on "public"."closures"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "closures_public_read"
  on "public"."closures"
  as permissive
  for select
  to public
using (true);



  create policy "portfolio_categories_public_read"
  on "public"."portfolio_categories"
  as permissive
  for select
  to public
using (true);



  create policy "portfolio_items_public_read"
  on "public"."portfolio_items"
  as permissive
  for select
  to public
using (true);



  create policy "promotions_public_read"
  on "public"."promotions"
  as permissive
  for select
  to public
using (true);



  create policy "reviews_admin_all"
  on "public"."reviews"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "reviews_public_read"
  on "public"."reviews"
  as permissive
  for select
  to public
using (true);



  create policy "admin_service_items_all"
  on "public"."service_items"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "service_items_admin_all"
  on "public"."service_items"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "service_items_public_read"
  on "public"."service_items"
  as permissive
  for select
  to public
using (true);



  create policy "services_admin_all"
  on "public"."services"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "services_public_read"
  on "public"."services"
  as permissive
  for select
  to public
using (true);



  create policy "site_settings_public_read"
  on "public"."site_settings"
  as permissive
  for select
  to public
using (true);



  create policy "public_can_read"
  on "public"."booked_slots_public"
  as permissive
  for select
  to anon, authenticated
using (true);



