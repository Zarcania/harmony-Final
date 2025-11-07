-- Admin policies for service_items (idempotent)
-- Allows authenticated admins to INSERT/UPDATE/DELETE service_items
-- Requires public.is_admin() (defined in 01_rls_policies.sql)

DO $$
BEGIN
  -- Ensure RLS enabled
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='service_items'
  ) THEN
    EXECUTE 'ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY';
  END IF;

  -- UPDATE policy for admins
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='service_items' AND policyname='service_items_admin_update'
  ) THEN
    EXECUTE 'ALTER POLICY service_items_admin_update ON public.service_items TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
  ELSE
    EXECUTE 'CREATE POLICY service_items_admin_update ON public.service_items FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
  END IF;

  -- INSERT policy for admins
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='service_items' AND policyname='service_items_admin_insert'
  ) THEN
    EXECUTE 'ALTER POLICY service_items_admin_insert ON public.service_items TO authenticated WITH CHECK (public.is_admin())';
  ELSE
    EXECUTE 'CREATE POLICY service_items_admin_insert ON public.service_items FOR INSERT TO authenticated WITH CHECK (public.is_admin())';
  END IF;

  -- DELETE policy for admins
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='service_items' AND policyname='service_items_admin_delete'
  ) THEN
    EXECUTE 'ALTER POLICY service_items_admin_delete ON public.service_items TO authenticated USING (public.is_admin())';
  ELSE
    EXECUTE 'CREATE POLICY service_items_admin_delete ON public.service_items FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;
