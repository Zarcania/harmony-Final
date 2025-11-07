-- Enforce no-overlap bookings at the database level
-- This migration adds computed columns and an exclusion constraint preventing
-- overlapping reservations (except when status = 'cancelled').

-- Optional but harmless: enable extension commonly used with GiST
create extension if not exists btree_gist;

-- Remplacer les colonnes générées (immuables requises) par des colonnes simples + triggers
-- 1) Colonnes (sans expression generated)
alter table public.bookings
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz,
  add column if not exists slot tstzrange;

-- 2) Fonction de calcul (idempotente)
create or replace function public.bookings_compute_times(p_date date, p_time text, p_duration int)
returns table (start_at timestamptz, end_at timestamptz, slot tstzrange)
language sql immutable as $$
  select
    (p_date::timestamp + (p_time::time)) AT TIME ZONE 'Europe/Paris',
    ((p_date::timestamp + (p_time::time)) AT TIME ZONE 'Europe/Paris') + make_interval(mins => coalesce(p_duration, 60)),
    tstzrange(
      (p_date::timestamp + (p_time::time)) AT TIME ZONE 'Europe/Paris',
      ((p_date::timestamp + (p_time::time)) AT TIME ZONE 'Europe/Paris') + make_interval(mins => coalesce(p_duration, 60)),
      '[)'
    );
$$;

-- 3) Trigger BEFORE INSERT/UPDATE pour remplir les colonnes
create or replace function public.trg_bookings_set_times()
returns trigger
language plpgsql as $$
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
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'bookings_set_times_biu'
  ) then
    create trigger bookings_set_times_biu
      before insert or update of preferred_date, preferred_time, duration_minutes on public.bookings
      for each row execute function public.trg_bookings_set_times();
  end if;
end$$;

-- 4) Backfill existant
update public.bookings b
set start_at = t.start_at,
    end_at   = t.end_at,
    slot     = t.slot
from (
  select id,
         (x).start_at as start_at,
         (x).end_at   as end_at,
         (x).slot     as slot
  from (
    select id, public.bookings_compute_times(preferred_date, preferred_time, duration_minutes) as x
    from public.bookings
  ) q
) t
where t.id = b.id
  and (b.start_at is distinct from t.start_at
    or b.end_at   is distinct from t.end_at
    or b.slot     is distinct from t.slot);

-- Exclusion constraint: two active bookings cannot overlap
-- Use GiST && (overlaps) on the tstzrange. Cancelled bookings are ignored.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_overlap_excl'
  ) THEN
    alter table public.bookings
      add constraint bookings_no_overlap_excl
      exclude using gist (slot WITH &&)
      where ((status) <> 'cancelled');
  END IF;
END$$;

-- Optional supportive uniqueness on exact same start time for active bookings (defensive)
DO $$
BEGIN
  IF to_regclass('public.uniq_bookings_start_active') IS NULL THEN
    create unique index uniq_bookings_start_active
      on public.bookings(preferred_date, preferred_time)
      where (status <> 'cancelled');
  END IF;
END$$;
