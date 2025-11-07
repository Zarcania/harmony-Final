-- Ensure proper table privileges for service_items
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='service_items'
  ) THEN
    -- Allow read to anon & authenticated
    EXECUTE 'GRANT SELECT ON TABLE public.service_items TO anon, authenticated';
    -- Allow write to authenticated (RLS will restrict to admins)
    EXECUTE 'GRANT INSERT, UPDATE, DELETE ON TABLE public.service_items TO authenticated';
  END IF;
END $$;
