-- Advisors Round 2: Security-focused fixes
-- 1) Enable RLS on public.service_item_members (deny by default)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='service_item_members'
  ) THEN
    EXECUTE 'ALTER TABLE public.service_item_members ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- 2) Set immutable search_path on additional functions flagged by advisors
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema,
           p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'booking_period',
        'set_updated_at',
        'trg_bookings_set_times',
        'confirm_booking',
        'bookings_normalize_status',
        'bookings_compute_bounds',
        'bookings_compute_times',
        'set_booking_period',
        'booking_broadcast_trigger'
      )
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public, extensions', r.schema, r.proname, r.args);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipping search_path fix for %.% (%): %', r.schema, r.proname, r.args, SQLERRM;
    END;
  END LOOP;
END $$;
