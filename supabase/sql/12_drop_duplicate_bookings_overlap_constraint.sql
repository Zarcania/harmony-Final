-- Drop redundant duplicate exclusion constraint on bookings if it has identical definition
-- Keeps the descriptive 'bookings_no_overlap' and removes 'no_overlap' only when both are equivalent

DO $$
DECLARE
  def_primary text;
  def_duplicate text;
BEGIN
  SELECT pg_get_constraintdef(oid)
    INTO def_primary
  FROM pg_constraint
  WHERE conname = 'bookings_no_overlap'
    AND conrelid = 'public.bookings'::regclass
    AND contype = 'x';

  SELECT pg_get_constraintdef(oid)
    INTO def_duplicate
  FROM pg_constraint
  WHERE conname = 'no_overlap'
    AND conrelid = 'public.bookings'::regclass
    AND contype = 'x';

  IF def_primary IS NOT NULL AND def_duplicate IS NOT NULL AND def_primary = def_duplicate THEN
    EXECUTE 'ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS no_overlap';
  END IF;
END
$$;