-- Advisors remediation: security & performance basics
-- 1) Enable RLS on public.booking_items (service role bypasses; client access remains denied unless policies added)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='booking_items'
  ) THEN
    EXECUTE 'ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- 2) Make view run as invoker if supported (Postgres 15+). Wrap to avoid migration break on older versions.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema='public' AND table_name='service_items_with_minutes'
  ) THEN
    BEGIN
      EXECUTE 'ALTER VIEW public.service_items_with_minutes SET (security_invoker=true)';
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not set security_invoker on view public.service_items_with_minutes (unsupported or already set).';
    END;
  END IF;
END $$;

-- 3) Set immutable search_path on key functions flagged by advisors
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
        'create_booking_multi',
        'list_available_slots',
        'get_availability_overview',
        'list_available_slots_by_service',
        'parse_duration_to_minutes',
        'get_available_slots',
        'ceil_to_slot_minutes'
      )
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public, extensions', r.schema, r.proname, r.args);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipping search_path fix for %.% (%): %', r.schema, r.proname, r.args, SQLERRM;
    END;
  END LOOP;
END $$;

-- 4) Note: Extension btree_gist is in schema public; moving it would disrupt dependent indexes.
--    Keeping as-is; consider fresh install to a dedicated schema in a future major migration if needed.
