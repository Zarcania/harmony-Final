drop extension if exists "pg_net";

create extension if not exists "btree_gist" with schema "public";


  create table "public"."about_content" (
    "id" uuid not null default gen_random_uuid(),
    "section_key" text not null,
    "title" text default ''::text,
    "content" text default ''::text,
    "image_url" text default ''::text,
    "order_index" integer default 0,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."about_content" enable row level security;


  create table "public"."admin_users" (
    "id" uuid not null default gen_random_uuid(),
    "username" text not null,
    "password_hash" text not null,
    "email" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."admin_users" enable row level security;


  create table "public"."booked_slots_public" (
    "day" date not null,
    "ts" tstzrange not null
      );


alter table "public"."booked_slots_public" enable row level security;


  create table "public"."booking_items" (
    "id" uuid not null default gen_random_uuid(),
    "booking_id" uuid,
    "service_item_id" uuid,
    "duration_minutes" integer not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."booking_items" enable row level security;


  create table "public"."bookings" (
    "id" uuid not null default gen_random_uuid(),
    "client_name" text not null,
    "client_email" text not null,
    "client_phone" text not null,
    "service_id" uuid,
    "service_name" text not null,
    "preferred_date" date not null,
    "preferred_time" text not null,
    "message" text default ''::text,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "reminder_sent" boolean default false,
    "cancellation_token" uuid default gen_random_uuid(),
    "canceled_at" timestamp with time zone,
    "user_id" uuid,
    "duration_minutes" integer not null default 60,
    "start_at" timestamp without time zone,
    "end_at" timestamp without time zone,
    "ts" tstzrange,
    "period" tstzrange,
    "slot" tstzrange
      );


alter table "public"."bookings" enable row level security;


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


  create table "public"."business_hours" (
    "id" uuid not null default gen_random_uuid(),
    "day_of_week" integer not null,
    "open_time" time without time zone,
    "close_time" time without time zone,
    "is_closed" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "open_time_morning" time without time zone,
    "close_time_morning" time without time zone,
    "open_time_afternoon" time without time zone,
    "close_time_afternoon" time without time zone
      );


alter table "public"."business_hours" enable row level security;


  create table "public"."cancellation_tokens" (
    "id" uuid not null default gen_random_uuid(),
    "booking_id" uuid not null,
    "token" text not null,
    "expires_at" timestamp with time zone not null,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."cancellation_tokens" enable row level security;


  create table "public"."closures" (
    "id" uuid not null default gen_random_uuid(),
    "start_date" date not null,
    "end_date" date not null,
    "reason" text default ''::text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."closures" enable row level security;


  create table "public"."email_logs" (
    "id" uuid not null default gen_random_uuid(),
    "booking_id" uuid,
    "email_type" text not null,
    "recipient_email" text not null,
    "sent_at" timestamp with time zone default now(),
    "status" text not null default 'sent'::text,
    "error_message" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."email_logs" enable row level security;


  create table "public"."portfolio_categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "order_index" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."portfolio_categories" enable row level security;


  create table "public"."portfolio_items" (
    "id" uuid not null default gen_random_uuid(),
    "url" text not null,
    "title" text not null,
    "description" text not null,
    "detailed_description" text default ''::text,
    "alt" text not null,
    "category" text not null default 'Cils'::text,
    "show_on_home" boolean default false,
    "order_index" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."portfolio_items" enable row level security;


  create table "public"."profiles" (
    "user_id" uuid not null,
    "is_admin" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."promotions" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text not null,
    "price" text not null,
    "order_index" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "original_price" text,
    "badge" text,
    "icon" text,
    "service_item_ids" uuid[]
      );


alter table "public"."promotions" enable row level security;


  create table "public"."reviews" (
    "id" uuid not null default gen_random_uuid(),
    "client_name" text not null,
    "rating" integer not null,
    "comment" text not null,
    "service_type" text not null default ''::text,
    "is_published" boolean not null default false,
    "order_index" integer not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."reviews" enable row level security;


  create table "public"."service_item_members" (
    "service_item_id" uuid not null,
    "user_id" uuid not null,
    "role" text not null default 'member'::text,
    "inserted_at" timestamp with time zone not null default now()
      );


alter table "public"."service_item_members" enable row level security;


-- Ensure function exists before using it in generated column
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


  create table "public"."service_items" (
    "id" uuid not null default gen_random_uuid(),
    "service_id" uuid not null,
    "label" text not null,
    "price" text not null,
    "description" text,
    "duration" text default ''::text,
    "benefits" text[],
    "order_index" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "duration_minutes" integer generated always as (public.parse_duration_to_minutes(duration)) stored
      );


alter table "public"."service_items" enable row level security;


  create table "public"."services" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "icon" text not null,
    "order_index" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."services" enable row level security;


  create table "public"."site_settings" (
    "id" uuid not null default gen_random_uuid(),
    "setting_key" text not null,
    "setting_value" text default ''::text,
    "updated_at" timestamp with time zone default now(),
    "is_public" boolean not null default false
      );


alter table "public"."site_settings" enable row level security;

CREATE UNIQUE INDEX about_content_pkey ON public.about_content USING btree (id);

CREATE UNIQUE INDEX about_content_section_key_key ON public.about_content USING btree (section_key);

CREATE UNIQUE INDEX admin_users_pkey ON public.admin_users USING btree (id);

CREATE UNIQUE INDEX admin_users_username_key ON public.admin_users USING btree (username);

CREATE UNIQUE INDEX booked_slots_public_day_ts_key ON public.booked_slots_public USING btree (day, ts);

CREATE UNIQUE INDEX booking_items_pkey ON public.booking_items USING btree (id);

CREATE UNIQUE INDEX bookings_cancellation_token_key ON public.bookings USING btree (cancellation_token);

select 1; 
-- CREATE INDEX bookings_no_overlap ON public.bookings USING gist (ts);

select 1; 
-- CREATE INDEX bookings_no_overlap_excl ON public.bookings USING gist (tsrange(start_at, end_at, '[)'::text), ((status IS DISTINCT FROM 'cancelled'::text)));

select 1; 
-- CREATE INDEX bookings_no_time_overlap ON public.bookings USING gist (ts) WHERE (status <> 'cancelled'::text);

CREATE UNIQUE INDEX bookings_pkey ON public.bookings USING btree (id);

CREATE UNIQUE INDEX business_breaks_day_of_week_key ON public.business_breaks USING btree (day_of_week);

CREATE UNIQUE INDEX business_breaks_pkey ON public.business_breaks USING btree (id);

CREATE UNIQUE INDEX business_hours_pkey ON public.business_hours USING btree (id);

CREATE UNIQUE INDEX cancellation_tokens_pkey ON public.cancellation_tokens USING btree (id);

CREATE UNIQUE INDEX cancellation_tokens_token_key ON public.cancellation_tokens USING btree (token);

CREATE UNIQUE INDEX closures_pkey ON public.closures USING btree (id);

CREATE UNIQUE INDEX email_logs_pkey ON public.email_logs USING btree (id);

CREATE INDEX idx_about_order ON public.about_content USING btree (order_index);

CREATE INDEX idx_booked_slots_public_day ON public.booked_slots_public USING btree (day);

CREATE INDEX idx_booked_slots_public_ts ON public.booked_slots_public USING gist (ts);

CREATE INDEX idx_booking_items_booking_id ON public.booking_items USING btree (booking_id);

CREATE INDEX idx_booking_items_service_item_id ON public.booking_items USING btree (service_item_id);

CREATE INDEX idx_bookings_cancellation_token ON public.bookings USING btree (cancellation_token);

CREATE INDEX idx_bookings_date ON public.bookings USING btree (preferred_date);

CREATE INDEX idx_bookings_end_at ON public.bookings USING btree (end_at);

CREATE INDEX idx_bookings_period_gist ON public.bookings USING gist (period);

CREATE INDEX idx_bookings_service_id ON public.bookings USING btree (service_id);

CREATE INDEX idx_bookings_start_at ON public.bookings USING btree (start_at);

CREATE INDEX idx_bookings_start_end ON public.bookings USING btree (start_at, end_at);

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);

CREATE INDEX idx_bookings_user_id ON public.bookings USING btree (user_id);

CREATE INDEX idx_business_breaks_dow ON public.business_breaks USING btree (day_of_week);

CREATE INDEX idx_business_breaks_enabled ON public.business_breaks USING btree (enabled);

CREATE INDEX idx_business_hours_dow ON public.business_hours USING btree (day_of_week);

CREATE INDEX idx_cancellation_tokens_booking_id ON public.cancellation_tokens USING btree (booking_id);

CREATE INDEX idx_cancellation_tokens_expires_at ON public.cancellation_tokens USING btree (expires_at);

CREATE INDEX idx_cancellation_tokens_token ON public.cancellation_tokens USING btree (token);

CREATE INDEX idx_cancellation_tokens_used_at ON public.cancellation_tokens USING btree (used_at);

CREATE INDEX idx_closures_range ON public.closures USING btree (start_date, end_date);

CREATE INDEX idx_email_logs_booking_id ON public.email_logs USING btree (booking_id);

CREATE INDEX idx_email_logs_email_type ON public.email_logs USING btree (email_type);

CREATE INDEX idx_portfolio_category ON public.portfolio_items USING btree (category);

CREATE INDEX idx_portfolio_order ON public.portfolio_items USING btree (order_index);

CREATE INDEX idx_promotions_order ON public.promotions USING btree (order_index);

CREATE INDEX idx_reviews_is_published ON public.reviews USING btree (is_published);

CREATE INDEX idx_service_item_members_user ON public.service_item_members USING btree (user_id);

CREATE INDEX idx_service_items_order ON public.service_items USING btree (order_index);

CREATE INDEX idx_service_items_service_id ON public.service_items USING btree (service_id);

CREATE INDEX idx_services_order ON public.services USING btree (order_index);

CREATE UNIQUE INDEX portfolio_categories_name_key ON public.portfolio_categories USING btree (name);

CREATE UNIQUE INDEX portfolio_categories_pkey ON public.portfolio_categories USING btree (id);

CREATE UNIQUE INDEX portfolio_items_pkey ON public.portfolio_items USING btree (id);

CREATE INDEX profiles_admin_idx ON public.profiles USING btree (is_admin);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (user_id);

CREATE UNIQUE INDEX promotions_pkey ON public.promotions USING btree (id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE UNIQUE INDEX service_item_members_pkey ON public.service_item_members USING btree (service_item_id, user_id);

CREATE UNIQUE INDEX service_items_pkey ON public.service_items USING btree (id);

CREATE UNIQUE INDEX services_pkey ON public.services USING btree (id);

CREATE UNIQUE INDEX site_settings_pkey ON public.site_settings USING btree (id);

CREATE UNIQUE INDEX site_settings_setting_key_key ON public.site_settings USING btree (setting_key);

CREATE UNIQUE INDEX uniq_bookings_start_active ON public.bookings USING btree (preferred_date, preferred_time) WHERE (status IS DISTINCT FROM 'cancelled'::text);

CREATE UNIQUE INDEX uniq_business_hours_day ON public.business_hours USING btree (day_of_week);

alter table "public"."about_content" add constraint "about_content_pkey" PRIMARY KEY using index "about_content_pkey";

alter table "public"."admin_users" add constraint "admin_users_pkey" PRIMARY KEY using index "admin_users_pkey";

alter table "public"."booking_items" add constraint "booking_items_pkey" PRIMARY KEY using index "booking_items_pkey";

alter table "public"."bookings" add constraint "bookings_pkey" PRIMARY KEY using index "bookings_pkey";

alter table "public"."business_breaks" add constraint "business_breaks_pkey" PRIMARY KEY using index "business_breaks_pkey";

alter table "public"."business_hours" add constraint "business_hours_pkey" PRIMARY KEY using index "business_hours_pkey";

alter table "public"."cancellation_tokens" add constraint "cancellation_tokens_pkey" PRIMARY KEY using index "cancellation_tokens_pkey";

alter table "public"."closures" add constraint "closures_pkey" PRIMARY KEY using index "closures_pkey";

alter table "public"."email_logs" add constraint "email_logs_pkey" PRIMARY KEY using index "email_logs_pkey";

alter table "public"."portfolio_categories" add constraint "portfolio_categories_pkey" PRIMARY KEY using index "portfolio_categories_pkey";

alter table "public"."portfolio_items" add constraint "portfolio_items_pkey" PRIMARY KEY using index "portfolio_items_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."promotions" add constraint "promotions_pkey" PRIMARY KEY using index "promotions_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."service_item_members" add constraint "service_item_members_pkey" PRIMARY KEY using index "service_item_members_pkey";

alter table "public"."service_items" add constraint "service_items_pkey" PRIMARY KEY using index "service_items_pkey";

alter table "public"."services" add constraint "services_pkey" PRIMARY KEY using index "services_pkey";

alter table "public"."site_settings" add constraint "site_settings_pkey" PRIMARY KEY using index "site_settings_pkey";

alter table "public"."about_content" add constraint "about_content_section_key_key" UNIQUE using index "about_content_section_key_key";

alter table "public"."admin_users" add constraint "admin_users_username_key" UNIQUE using index "admin_users_username_key";

alter table "public"."booked_slots_public" add constraint "booked_slots_public_day_ts_key" UNIQUE using index "booked_slots_public_day_ts_key";

alter table "public"."booking_items" add constraint "booking_items_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE not valid;

alter table "public"."booking_items" validate constraint "booking_items_booking_id_fkey";

alter table "public"."booking_items" add constraint "booking_items_service_item_id_fkey" FOREIGN KEY (service_item_id) REFERENCES public.service_items(id) ON DELETE RESTRICT not valid;

alter table "public"."booking_items" validate constraint "booking_items_service_item_id_fkey";

alter table "public"."bookings" add constraint "bookings_cancellation_token_key" UNIQUE using index "bookings_cancellation_token_key";

alter table "public"."bookings" add constraint "bookings_no_overlap" EXCLUDE USING gist (ts WITH &&);

alter table "public"."bookings" add constraint "bookings_no_overlap_excl" EXCLUDE USING gist (tsrange(start_at, end_at, '[)'::text) WITH &&, ((status IS DISTINCT FROM 'cancelled'::text)) WITH =);

alter table "public"."bookings" add constraint "bookings_no_time_overlap" EXCLUDE USING gist (ts WITH &&) WHERE ((status <> 'cancelled'::text));

alter table "public"."bookings" add constraint "bookings_start_not_past_active" CHECK (((start_at >= now()) OR (status = ANY (ARRAY['cancelled'::text, 'completed'::text])))) not valid;

alter table "public"."bookings" validate constraint "bookings_start_not_past_active";

alter table "public"."bookings" add constraint "bookings_status_allowed" CHECK ((status = ANY (ARRAY['confirmed'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."bookings" validate constraint "bookings_status_allowed";

alter table "public"."bookings" add constraint "bookings_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text]))) not valid;

alter table "public"."bookings" validate constraint "bookings_status_check";

alter table "public"."bookings" add constraint "bookings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."bookings" validate constraint "bookings_user_id_fkey";

alter table "public"."business_breaks" add constraint "business_breaks_day_of_week_check" CHECK (((day_of_week >= 0) AND (day_of_week <= 6))) not valid;

alter table "public"."business_breaks" validate constraint "business_breaks_day_of_week_check";

alter table "public"."business_breaks" add constraint "business_breaks_day_of_week_key" UNIQUE using index "business_breaks_day_of_week_key";

alter table "public"."business_hours" add constraint "business_hours_day_of_week_check" CHECK (((day_of_week >= 0) AND (day_of_week <= 6))) not valid;

alter table "public"."business_hours" validate constraint "business_hours_day_of_week_check";

alter table "public"."business_hours" add constraint "business_hours_time_check" CHECK (((is_closed = true) OR ((open_time IS NOT NULL) AND (close_time IS NOT NULL) AND (close_time > open_time)))) not valid;

alter table "public"."business_hours" validate constraint "business_hours_time_check";

alter table "public"."business_hours" add constraint "uniq_business_hours_day" UNIQUE using index "uniq_business_hours_day";

alter table "public"."cancellation_tokens" add constraint "cancellation_tokens_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE not valid;

alter table "public"."cancellation_tokens" validate constraint "cancellation_tokens_booking_id_fkey";

alter table "public"."cancellation_tokens" add constraint "cancellation_tokens_token_key" UNIQUE using index "cancellation_tokens_token_key";

alter table "public"."closures" add constraint "chk_closures_dates" CHECK ((end_date >= start_date)) not valid;

alter table "public"."closures" validate constraint "chk_closures_dates";

alter table "public"."email_logs" add constraint "email_logs_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE not valid;

alter table "public"."email_logs" validate constraint "email_logs_booking_id_fkey";

alter table "public"."email_logs" add constraint "email_logs_email_type_check" CHECK ((email_type = ANY (ARRAY['confirmation'::text, 'reminder'::text, 'cancellation'::text]))) not valid;

alter table "public"."email_logs" validate constraint "email_logs_email_type_check";

alter table "public"."email_logs" add constraint "email_logs_status_check" CHECK ((status = ANY (ARRAY['sent'::text, 'failed'::text]))) not valid;

alter table "public"."email_logs" validate constraint "email_logs_status_check";

alter table "public"."portfolio_categories" add constraint "portfolio_categories_name_key" UNIQUE using index "portfolio_categories_name_key";

alter table "public"."profiles" add constraint "profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_user_id_fkey";

alter table "public"."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_check";

alter table "public"."service_items" add constraint "service_items_service_id_fkey" FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE not valid;

alter table "public"."service_items" validate constraint "service_items_service_id_fkey";

alter table "public"."site_settings" add constraint "site_settings_setting_key_key" UNIQUE using index "site_settings_setting_key_key";

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


CREATE OR REPLACE FUNCTION public.cancel_booking(p_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_booking_tx(p_booking_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_booking_with_log(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

CREATE OR REPLACE FUNCTION public.generate_cancellation_token(p_booking_id uuid, p_expires_at timestamp with time zone)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles(user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
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

CREATE OR REPLACE FUNCTION public.promote_admin(p_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

create or replace view "public"."service_items_with_minutes" as  SELECT id,
    service_id,
    label,
    price,
    description,
    duration,
    benefits,
    order_index,
    created_at,
    updated_at,
    (NULLIF(TRIM(BOTH FROM duration), ''::text))::integer AS duration_minutes_norm
   FROM public.service_items si;


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

CREATE OR REPLACE FUNCTION public.set_bookings_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
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

grant delete on table "public"."about_content" to "anon";

grant insert on table "public"."about_content" to "anon";

grant references on table "public"."about_content" to "anon";

grant select on table "public"."about_content" to "anon";

grant trigger on table "public"."about_content" to "anon";

grant truncate on table "public"."about_content" to "anon";

grant update on table "public"."about_content" to "anon";

grant delete on table "public"."about_content" to "authenticated";

grant insert on table "public"."about_content" to "authenticated";

grant references on table "public"."about_content" to "authenticated";

grant select on table "public"."about_content" to "authenticated";

grant trigger on table "public"."about_content" to "authenticated";

grant truncate on table "public"."about_content" to "authenticated";

grant update on table "public"."about_content" to "authenticated";

grant delete on table "public"."about_content" to "service_role";

grant insert on table "public"."about_content" to "service_role";

grant references on table "public"."about_content" to "service_role";

grant select on table "public"."about_content" to "service_role";

grant trigger on table "public"."about_content" to "service_role";

grant truncate on table "public"."about_content" to "service_role";

grant update on table "public"."about_content" to "service_role";

grant delete on table "public"."admin_users" to "service_role";

grant insert on table "public"."admin_users" to "service_role";

grant references on table "public"."admin_users" to "service_role";

grant select on table "public"."admin_users" to "service_role";

grant trigger on table "public"."admin_users" to "service_role";

grant truncate on table "public"."admin_users" to "service_role";

grant update on table "public"."admin_users" to "service_role";

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

grant delete on table "public"."booking_items" to "anon";

grant insert on table "public"."booking_items" to "anon";

grant references on table "public"."booking_items" to "anon";

grant select on table "public"."booking_items" to "anon";

grant trigger on table "public"."booking_items" to "anon";

grant truncate on table "public"."booking_items" to "anon";

grant update on table "public"."booking_items" to "anon";

grant delete on table "public"."booking_items" to "authenticated";

grant insert on table "public"."booking_items" to "authenticated";

grant references on table "public"."booking_items" to "authenticated";

grant select on table "public"."booking_items" to "authenticated";

grant trigger on table "public"."booking_items" to "authenticated";

grant truncate on table "public"."booking_items" to "authenticated";

grant update on table "public"."booking_items" to "authenticated";

grant delete on table "public"."booking_items" to "service_role";

grant insert on table "public"."booking_items" to "service_role";

grant references on table "public"."booking_items" to "service_role";

grant select on table "public"."booking_items" to "service_role";

grant trigger on table "public"."booking_items" to "service_role";

grant truncate on table "public"."booking_items" to "service_role";

grant update on table "public"."booking_items" to "service_role";

grant insert on table "public"."bookings" to "anon";

grant insert on table "public"."bookings" to "authenticated";

grant select on table "public"."bookings" to "authenticated";

grant update on table "public"."bookings" to "authenticated";

grant delete on table "public"."bookings" to "service_role";

grant insert on table "public"."bookings" to "service_role";

grant references on table "public"."bookings" to "service_role";

grant select on table "public"."bookings" to "service_role";

grant trigger on table "public"."bookings" to "service_role";

grant truncate on table "public"."bookings" to "service_role";

grant update on table "public"."bookings" to "service_role";

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

grant delete on table "public"."business_hours" to "anon";

grant insert on table "public"."business_hours" to "anon";

grant references on table "public"."business_hours" to "anon";

grant select on table "public"."business_hours" to "anon";

grant trigger on table "public"."business_hours" to "anon";

grant truncate on table "public"."business_hours" to "anon";

grant update on table "public"."business_hours" to "anon";

grant delete on table "public"."business_hours" to "authenticated";

grant insert on table "public"."business_hours" to "authenticated";

grant references on table "public"."business_hours" to "authenticated";

grant select on table "public"."business_hours" to "authenticated";

grant trigger on table "public"."business_hours" to "authenticated";

grant truncate on table "public"."business_hours" to "authenticated";

grant update on table "public"."business_hours" to "authenticated";

grant delete on table "public"."business_hours" to "service_role";

grant insert on table "public"."business_hours" to "service_role";

grant references on table "public"."business_hours" to "service_role";

grant select on table "public"."business_hours" to "service_role";

grant trigger on table "public"."business_hours" to "service_role";

grant truncate on table "public"."business_hours" to "service_role";

grant update on table "public"."business_hours" to "service_role";

grant select on table "public"."cancellation_tokens" to "authenticated";

grant delete on table "public"."cancellation_tokens" to "service_role";

grant insert on table "public"."cancellation_tokens" to "service_role";

grant references on table "public"."cancellation_tokens" to "service_role";

grant select on table "public"."cancellation_tokens" to "service_role";

grant trigger on table "public"."cancellation_tokens" to "service_role";

grant truncate on table "public"."cancellation_tokens" to "service_role";

grant update on table "public"."cancellation_tokens" to "service_role";

grant references on table "public"."closures" to "anon";

grant select on table "public"."closures" to "anon";

grant trigger on table "public"."closures" to "anon";

grant truncate on table "public"."closures" to "anon";

grant references on table "public"."closures" to "authenticated";

grant select on table "public"."closures" to "authenticated";

grant trigger on table "public"."closures" to "authenticated";

grant truncate on table "public"."closures" to "authenticated";

grant delete on table "public"."closures" to "service_role";

grant insert on table "public"."closures" to "service_role";

grant references on table "public"."closures" to "service_role";

grant select on table "public"."closures" to "service_role";

grant trigger on table "public"."closures" to "service_role";

grant truncate on table "public"."closures" to "service_role";

grant update on table "public"."closures" to "service_role";

grant references on table "public"."email_logs" to "anon";

grant select on table "public"."email_logs" to "anon";

grant trigger on table "public"."email_logs" to "anon";

grant truncate on table "public"."email_logs" to "anon";

grant references on table "public"."email_logs" to "authenticated";

grant select on table "public"."email_logs" to "authenticated";

grant trigger on table "public"."email_logs" to "authenticated";

grant truncate on table "public"."email_logs" to "authenticated";

grant delete on table "public"."email_logs" to "service_role";

grant insert on table "public"."email_logs" to "service_role";

grant references on table "public"."email_logs" to "service_role";

grant select on table "public"."email_logs" to "service_role";

grant trigger on table "public"."email_logs" to "service_role";

grant truncate on table "public"."email_logs" to "service_role";

grant update on table "public"."email_logs" to "service_role";

grant delete on table "public"."portfolio_categories" to "anon";

grant insert on table "public"."portfolio_categories" to "anon";

grant references on table "public"."portfolio_categories" to "anon";

grant select on table "public"."portfolio_categories" to "anon";

grant trigger on table "public"."portfolio_categories" to "anon";

grant truncate on table "public"."portfolio_categories" to "anon";

grant update on table "public"."portfolio_categories" to "anon";

grant delete on table "public"."portfolio_categories" to "authenticated";

grant insert on table "public"."portfolio_categories" to "authenticated";

grant references on table "public"."portfolio_categories" to "authenticated";

grant select on table "public"."portfolio_categories" to "authenticated";

grant trigger on table "public"."portfolio_categories" to "authenticated";

grant truncate on table "public"."portfolio_categories" to "authenticated";

grant update on table "public"."portfolio_categories" to "authenticated";

grant delete on table "public"."portfolio_categories" to "service_role";

grant insert on table "public"."portfolio_categories" to "service_role";

grant references on table "public"."portfolio_categories" to "service_role";

grant select on table "public"."portfolio_categories" to "service_role";

grant trigger on table "public"."portfolio_categories" to "service_role";

grant truncate on table "public"."portfolio_categories" to "service_role";

grant update on table "public"."portfolio_categories" to "service_role";

grant delete on table "public"."portfolio_items" to "anon";

grant insert on table "public"."portfolio_items" to "anon";

grant references on table "public"."portfolio_items" to "anon";

grant select on table "public"."portfolio_items" to "anon";

grant trigger on table "public"."portfolio_items" to "anon";

grant truncate on table "public"."portfolio_items" to "anon";

grant update on table "public"."portfolio_items" to "anon";

grant delete on table "public"."portfolio_items" to "authenticated";

grant insert on table "public"."portfolio_items" to "authenticated";

grant references on table "public"."portfolio_items" to "authenticated";

grant select on table "public"."portfolio_items" to "authenticated";

grant trigger on table "public"."portfolio_items" to "authenticated";

grant truncate on table "public"."portfolio_items" to "authenticated";

grant update on table "public"."portfolio_items" to "authenticated";

grant delete on table "public"."portfolio_items" to "service_role";

grant insert on table "public"."portfolio_items" to "service_role";

grant references on table "public"."portfolio_items" to "service_role";

grant select on table "public"."portfolio_items" to "service_role";

grant trigger on table "public"."portfolio_items" to "service_role";

grant truncate on table "public"."portfolio_items" to "service_role";

grant update on table "public"."portfolio_items" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant references on table "public"."promotions" to "anon";

grant select on table "public"."promotions" to "anon";

grant trigger on table "public"."promotions" to "anon";

grant truncate on table "public"."promotions" to "anon";

grant delete on table "public"."promotions" to "authenticated";

grant insert on table "public"."promotions" to "authenticated";

grant references on table "public"."promotions" to "authenticated";

grant select on table "public"."promotions" to "authenticated";

grant trigger on table "public"."promotions" to "authenticated";

grant truncate on table "public"."promotions" to "authenticated";

grant update on table "public"."promotions" to "authenticated";

grant delete on table "public"."promotions" to "service_role";

grant insert on table "public"."promotions" to "service_role";

grant references on table "public"."promotions" to "service_role";

grant select on table "public"."promotions" to "service_role";

grant trigger on table "public"."promotions" to "service_role";

grant truncate on table "public"."promotions" to "service_role";

grant update on table "public"."promotions" to "service_role";

grant select on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";

grant delete on table "public"."service_item_members" to "anon";

grant insert on table "public"."service_item_members" to "anon";

grant references on table "public"."service_item_members" to "anon";

grant select on table "public"."service_item_members" to "anon";

grant trigger on table "public"."service_item_members" to "anon";

grant truncate on table "public"."service_item_members" to "anon";

grant update on table "public"."service_item_members" to "anon";

grant delete on table "public"."service_item_members" to "authenticated";

grant insert on table "public"."service_item_members" to "authenticated";

grant references on table "public"."service_item_members" to "authenticated";

grant select on table "public"."service_item_members" to "authenticated";

grant trigger on table "public"."service_item_members" to "authenticated";

grant truncate on table "public"."service_item_members" to "authenticated";

grant update on table "public"."service_item_members" to "authenticated";

grant delete on table "public"."service_item_members" to "service_role";

grant insert on table "public"."service_item_members" to "service_role";

grant references on table "public"."service_item_members" to "service_role";

grant select on table "public"."service_item_members" to "service_role";

grant trigger on table "public"."service_item_members" to "service_role";

grant truncate on table "public"."service_item_members" to "service_role";

grant update on table "public"."service_item_members" to "service_role";

grant select on table "public"."service_items" to "anon";

grant select on table "public"."service_items" to "authenticated";

grant delete on table "public"."service_items" to "service_role";

grant insert on table "public"."service_items" to "service_role";

grant references on table "public"."service_items" to "service_role";

grant select on table "public"."service_items" to "service_role";

grant trigger on table "public"."service_items" to "service_role";

grant truncate on table "public"."service_items" to "service_role";

grant update on table "public"."service_items" to "service_role";

grant delete on table "public"."services" to "anon";

grant insert on table "public"."services" to "anon";

grant references on table "public"."services" to "anon";

grant select on table "public"."services" to "anon";

grant trigger on table "public"."services" to "anon";

grant truncate on table "public"."services" to "anon";

grant update on table "public"."services" to "anon";

grant delete on table "public"."services" to "authenticated";

grant insert on table "public"."services" to "authenticated";

grant references on table "public"."services" to "authenticated";

grant select on table "public"."services" to "authenticated";

grant trigger on table "public"."services" to "authenticated";

grant truncate on table "public"."services" to "authenticated";

grant update on table "public"."services" to "authenticated";

grant delete on table "public"."services" to "service_role";

grant insert on table "public"."services" to "service_role";

grant references on table "public"."services" to "service_role";

grant select on table "public"."services" to "service_role";

grant trigger on table "public"."services" to "service_role";

grant truncate on table "public"."services" to "service_role";

grant update on table "public"."services" to "service_role";

grant references on table "public"."site_settings" to "anon";

grant select on table "public"."site_settings" to "anon";

grant trigger on table "public"."site_settings" to "anon";

grant truncate on table "public"."site_settings" to "anon";

grant references on table "public"."site_settings" to "authenticated";

grant select on table "public"."site_settings" to "authenticated";

grant trigger on table "public"."site_settings" to "authenticated";

grant truncate on table "public"."site_settings" to "authenticated";

grant delete on table "public"."site_settings" to "service_role";

grant insert on table "public"."site_settings" to "service_role";

grant references on table "public"."site_settings" to "service_role";

grant select on table "public"."site_settings" to "service_role";

grant trigger on table "public"."site_settings" to "service_role";

grant truncate on table "public"."site_settings" to "service_role";

grant update on table "public"."site_settings" to "service_role";


  create policy "about_content_admin_all"
  on "public"."about_content"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



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



  create policy "admin_users_admin_all"
  on "public"."admin_users"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "public_can_read"
  on "public"."booked_slots_public"
  as permissive
  for select
  to anon, authenticated
using (true);



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



  create policy "bookings_admin_all"
  on "public"."bookings"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



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



  create policy "admin_business_hours_all"
  on "public"."business_hours"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



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



  create policy "closures_select_all_authenticated"
  on "public"."closures"
  as permissive
  for select
  to authenticated
using (true);



  create policy "closures_select_upcoming_anon"
  on "public"."closures"
  as permissive
  for select
  to anon
using ((end_date >= CURRENT_DATE));



  create policy "email_logs_select_owner_admin"
  on "public"."email_logs"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.bookings b
     LEFT JOIN public.profiles p ON ((p.user_id = b.user_id)))
  WHERE ((b.id = email_logs.booking_id) AND ((b.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ((p.is_admin = true) AND (p.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))))))));



  create policy "portfolio_categories_admin_all"
  on "public"."portfolio_categories"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "portfolio_categories_read_public"
  on "public"."portfolio_categories"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "portfolio_items_admin_all"
  on "public"."portfolio_items"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



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



  create policy "promotions_admin_all"
  on "public"."promotions"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "promotions_select_authenticated"
  on "public"."promotions"
  as permissive
  for select
  to authenticated
using (true);



  create policy "promotions_select_public"
  on "public"."promotions"
  as permissive
  for select
  to anon
using (true);



  create policy "Authenticated users can manage reviews"
  on "public"."reviews"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "reviews_public_published_only"
  on "public"."reviews"
  as permissive
  for select
  to anon, authenticated
using ((is_published = true));



  create policy "service_item_members_admin_select"
  on "public"."service_item_members"
  as permissive
  for select
  to authenticated
using (public.is_admin());



  create policy "service_items_read_public"
  on "public"."service_items"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "admin_services_all"
  on "public"."services"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



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



  create policy "site_settings_select_public"
  on "public"."site_settings"
  as permissive
  for select
  to anon
using ((is_public = true));


CREATE TRIGGER bookings_compute_bounds_trg BEFORE INSERT OR UPDATE OF preferred_date, preferred_time, duration_minutes ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.bookings_compute_bounds();

CREATE TRIGGER bookings_set_times_biu BEFORE INSERT OR UPDATE OF preferred_date, preferred_time, duration_minutes ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.trg_bookings_set_times();

CREATE TRIGGER bookings_set_user_id BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_bookings_user_id();

CREATE TRIGGER bookings_sync_booked_slots_public AFTER INSERT OR DELETE OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.sync_booked_slots_public();

CREATE TRIGGER trg_bookings_broadcast AFTER INSERT OR DELETE OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.booking_broadcast_trigger();

CREATE TRIGGER trg_bookings_normalize_status BEFORE INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.bookings_normalize_status();

CREATE TRIGGER trg_bookings_set_period BEFORE INSERT OR UPDATE OF start_at, end_at ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_booking_period();

CREATE TRIGGER trg_business_breaks_updated_at BEFORE UPDATE ON public.business_breaks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


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



