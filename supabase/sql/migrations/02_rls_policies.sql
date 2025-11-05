-- 02_rls_policies.sql
-- Enable RLS and minimal public access policies (idempotent)

ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;

-- REVOKE baseline
DO $$
DECLARE role_name text;
BEGIN
  FOR role_name IN SELECT unnest(ARRAY['anon','authenticated']) LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.bookings FROM %I', role_name);
    EXECUTE format('REVOKE ALL ON TABLE public.service_items FROM %I', role_name);
    EXECUTE format('REVOKE ALL ON TABLE public.reviews FROM %I', role_name);
    EXECUTE format('REVOKE ALL ON TABLE public.admin_users FROM %I', role_name);
  END LOOP;
END $$;

-- Minimal GRANTs
GRANT INSERT ON TABLE public.bookings TO anon;
GRANT SELECT ON TABLE public.service_items TO anon;

-- Policies (create if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='service_items' AND policyname='service_items_public_read'
  ) THEN
    CREATE POLICY service_items_public_read ON public.service_items FOR SELECT TO anon USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='contents_public_read'
  ) THEN
    CREATE POLICY contents_public_read ON public.reviews FOR SELECT TO anon, authenticated USING (is_published = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bookings' AND policyname='bookings_public_create'
  ) THEN
    CREATE POLICY bookings_public_create ON public.bookings FOR INSERT TO anon WITH CHECK (
      status = 'pending' AND preferred_date IS NOT NULL AND service_id IS NOT NULL
    );
  END IF;
END $$;
