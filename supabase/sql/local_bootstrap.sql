-- Local bootstrap schema for bookings flow (dev/testing)
-- Safe to run multiple times (IF NOT EXISTS where possible)

create extension if not exists pgcrypto;

-- bookings table
do $$
begin
  if to_regclass('public.bookings') is null then
    create table public.bookings (
      id uuid primary key default gen_random_uuid(),
      client_name text,
      client_email text not null,
      client_phone text,
      service_id uuid,
      service_name text not null,
      preferred_date date,
      preferred_time text,
      message text,
      status text not null default 'pending',
      reminder_sent boolean,
      duration_minutes integer,
      start_at timestamp without time zone,
      end_at timestamp without time zone,
      user_id uuid,
      canceled_at timestamptz,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  end if;
end $$;

-- status constraint (idempotent)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints where table_schema='public' and table_name='bookings' and constraint_name='bookings_status_check'
  ) then
    alter table public.bookings
      add constraint bookings_status_check check (status = any (array['pending','confirmed','cancelled','completed']));
  end if;
end $$;

-- cancellation_tokens table
do $$
begin
  if to_regclass('public.cancellation_tokens') is null then
    create table public.cancellation_tokens (
      id uuid primary key default gen_random_uuid(),
      booking_id uuid not null references public.bookings(id) on delete cascade,
      token text unique not null default gen_random_uuid()::text,
      used_at timestamptz,
      expires_at timestamptz,
      created_at timestamptz default now()
    );
  end if;
end $$;

-- email_logs table
do $$
begin
  if to_regclass('public.email_logs') is null then
    create table public.email_logs (
      id uuid primary key default gen_random_uuid(),
      booking_id uuid references public.bookings(id) on delete set null,
      email_type text,
      recipient_email text,
      recipient_name text,
      subject text,
      status text,
      error_message text,
      sent_at timestamptz,
      created_at timestamptz default now()
    );
  end if;
end $$;

-- helpful indexes
do $$
begin
  if not exists (select 1 from pg_indexes where schemaname='public' and indexname='bookings_status_idx') then
    create index bookings_status_idx on public.bookings(status);
  end if;
  if not exists (select 1 from pg_indexes where schemaname='public' and indexname='bookings_preferred_date_idx') then
    create index bookings_preferred_date_idx on public.bookings(preferred_date);
  end if;
end $$;
