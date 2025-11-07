-- Ensure public read SELECT policies exist for anon+authenticated on all site tables
-- Idempotent: only creates policies if missing
-- Also re-grants SELECT in case privileges were lost
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- List of tables needing public read access
  FOR rec IN SELECT unnest(ARRAY[
    'services', 'service_items', 'promotions', 'portfolio_items', 'portfolio_categories',
    'about_content', 'reviews', 'business_hours', 'business_breaks', 'closures'
  ]) AS tbl LOOP
    -- Enable RLS if not already (safe)
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rec.tbl);
    -- (Optional) do NOT FORCE row level security to allow service_role bypass
    -- Create read policy if missing
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = rec.tbl AND p.policyname = rec.tbl || '_read_public'
    ) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', rec.tbl || '_read_public', rec.tbl);
    END IF;
    -- Simple admin full-access policy (write) if missing (authenticated must pass is_admin())
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = rec.tbl AND p.policyname = rec.tbl || '_admin_all'
    ) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', rec.tbl || '_admin_all', rec.tbl);
    END IF;
    -- Re-grant SELECT privilege (separate from RLS)
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', rec.tbl);
  END LOOP;
END $$;

-- Extra: ensure schema usage (anon/authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
