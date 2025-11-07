-- Restore missing core tables (services, promotions, portfolio, content, booking infra)
-- Idempotent: uses IF NOT EXISTS

-- Ensure helper function exists for generated column
create or replace function public.parse_duration_to_minutes(p_text text)
 returns integer
 language sql
 immutable
 set search_path to 'public', 'extensions'
as $$
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
$$;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  icon text not null,
  order_index integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.service_items (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  label text not null,
  price text not null,
  description text,
  duration text default ''::text,
  benefits text[],
  order_index integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  duration_minutes integer generated always as (public.parse_duration_to_minutes(duration)) stored
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price text not null,
  order_index integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  original_price text,
  badge text,
  icon text,
  service_item_ids uuid[]
);

create table if not exists public.portfolio_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  order_index integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title text not null,
  description text not null,
  detailed_description text default ''::text,
  alt text not null,
  category text not null default 'Cils'::text,
  show_on_home boolean default false,
  order_index integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.about_content (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  title text default ''::text,
  content text default ''::text,
  image_url text default ''::text,
  order_index integer default 0,
  updated_at timestamptz default now()
);
create unique index if not exists about_content_section_key_key on public.about_content(section_key);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  rating integer not null,
  comment text not null,
  service_type text not null default ''::text,
  is_published boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week integer not null,
  open_time time,
  close_time time,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  open_time_morning time,
  close_time_morning time,
  open_time_afternoon time,
  close_time_afternoon time
);
create unique index if not exists business_hours_day_of_week_key on public.business_hours(day_of_week);

create table if not exists public.business_breaks (
  id uuid primary key default gen_random_uuid(),
  day_of_week integer not null,
  break_start time,
  break_end time,
  enabled boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists business_breaks_day_of_week_key on public.business_breaks(day_of_week);

create table if not exists public.closures (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  reason text default ''::text,
  created_at timestamptz not null default now()
);

-- Minimal bookings infra (without all ancillary columns to avoid complexity)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_email text not null,
  client_phone text not null,
  service_id uuid,
  service_name text not null,
  preferred_date date not null,
  preferred_time text not null,
  message text default ''::text,
  status text not null default 'pending'::text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  reminder_sent boolean default false,
  cancellation_token uuid default gen_random_uuid(),
  canceled_at timestamptz,
  user_id uuid,
  duration_minutes integer not null default 60,
  start_at timestamp,
  end_at timestamp,
  ts tstzrange,
  period tstzrange,
  slot tstzrange
);
create unique index if not exists bookings_pkey on public.bookings(id);
create index if not exists idx_bookings_date on public.bookings(preferred_date);
create index if not exists idx_bookings_status on public.bookings(status);

-- Enable RLS + public read policies (anon+authenticated)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'services','service_items','promotions','portfolio_items','portfolio_categories','about_content','reviews','business_hours','business_breaks','closures','bookings'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_read_public') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', t||'_read_public', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_admin_all') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t||'_admin_all', t);
    END IF;
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
