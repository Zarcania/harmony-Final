-- Admin-only read access for service_item_members
-- Requires public.is_admin() function (defined in 01_rls_policies.sql)

DO $$
BEGIN
  -- Ensure RLS is enabled
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='service_item_members'
  ) THEN
    EXECUTE 'ALTER TABLE public.service_item_members ENABLE ROW LEVEL SECURITY';
  END IF;

  -- Create or alter a SELECT policy restricted to admins
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='service_item_members' AND policyname='service_item_members_admin_select'
  ) THEN
    EXECUTE $$
      ALTER POLICY service_item_members_admin_select ON public.service_item_members
      FOR SELECT TO authenticated
      USING (public.is_admin())
    $$;
  ELSE
    EXECUTE $$
      CREATE POLICY service_item_members_admin_select ON public.service_item_members
      FOR SELECT TO authenticated
      USING (public.is_admin())
    $$;
  END IF;
END $$;
