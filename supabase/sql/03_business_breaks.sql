-- Business breaks (one pause per day)
create table if not exists public.business_breaks (
  day_of_week smallint primary key check (day_of_week between 0 and 6), -- 0=lundi .. 6=dimanche
  break_start time null,
  break_end time null,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

-- RLS: allow read to anon, write restricted to service role
alter table public.business_breaks enable row level security;

create policy if not exists business_breaks_select_public
on public.business_breaks for select
using (true);

-- Upsert seed rows if empty (0..6)
insert into public.business_breaks (day_of_week, enabled)
select d, false from generate_series(0,6) as d
on conflict (day_of_week) do nothing;
