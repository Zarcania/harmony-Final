-- Create or update a public view exposing only busy time ranges for bookings
-- and adjust privileges so only the view is queryable by anon/authenticated.

-- 1) View exposing id, ts, and busy flag (non-cancelled)
create or replace view public.bookings_public_busy as
select
  id,
  ts,
  (status <> 'cancelled') as is_busy
from public.bookings;

-- 2) Ensure base table isn't directly readable by PUBLIC
revoke all on table public.bookings from public;

-- 3) Allow read access to the view for anon/authenticated
grant select on public.bookings_public_busy to anon, authenticated;
