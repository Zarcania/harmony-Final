-- Migration: create/replace secure delete RPCs for services and service_items
-- Ensures admin-only deletions and enforces business constraints

CREATE OR REPLACE FUNCTION public.delete_service_item(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: admin only' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.service_id = p_id
      AND lower(b.status) = 'confirmed'
      AND ((b.start_at IS NOT NULL AND b.start_at > now()) OR (b.preferred_date IS NOT NULL AND b.preferred_date >= current_date))
  ) THEN
    RAISE EXCEPTION 'cannot delete: future confirmed bookings exist' USING ERRCODE = '45000';
  END IF;
  DELETE FROM public.service_items WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_service(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: admin only' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.service_items si WHERE si.service_id = p_id) THEN
    RAISE EXCEPTION 'cannot delete: category not empty' USING ERRCODE = '45000';
  END IF;
  DELETE FROM public.services WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_service_item(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_service(uuid) TO authenticated;
