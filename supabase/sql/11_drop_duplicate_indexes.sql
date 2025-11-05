-- Safe duplicate index cleanup for known pairs flagged by advisors
-- Drops only non-constraint-backed duplicate indexes to avoid breaking constraints

DO $$
BEGIN
  -- cancellation_tokens: prefer keeping the constraint-backed index; drop duplicate unique index if safe
  IF to_regclass('public.cancellation_tokens_token_uidx') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint con WHERE con.conindid = to_regclass('public.cancellation_tokens_token_uidx')
     ) THEN
    EXECUTE 'DROP INDEX IF EXISTS public.cancellation_tokens_token_uidx';
  END IF;

  -- bookings: two identical indexes reported {bookings_no_overlap, no_overlap}
  -- Drop whichever is NOT constraint-backed, keeping the one tied to the constraint if any
  IF to_regclass('public.bookings_no_overlap') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint con WHERE con.conindid = to_regclass('public.bookings_no_overlap')
     ) THEN
    EXECUTE 'DROP INDEX IF EXISTS public.bookings_no_overlap';
  ELSIF to_regclass('public.no_overlap') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint con WHERE con.conindid = to_regclass('public.no_overlap')
     ) THEN
    EXECUTE 'DROP INDEX IF EXISTS public.no_overlap';
  END IF;
END
$$;