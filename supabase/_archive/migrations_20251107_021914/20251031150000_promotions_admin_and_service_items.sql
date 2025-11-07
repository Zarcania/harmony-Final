-- Add service_item_ids to promotions and allow admin CRUD via RLS
BEGIN;

ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS service_item_ids uuid[] NULL;

-- Ensure RLS policy grants admins full access
DROP POLICY IF EXISTS promotions_admin_all ON public.promotions;
CREATE POLICY promotions_admin_all ON public.promotions
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;
