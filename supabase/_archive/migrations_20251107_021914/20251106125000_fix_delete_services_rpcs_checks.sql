-- Migration: fix checks for delete_service_item and delete_service RPCs
-- - service_item: check booking_items joined with bookings for future confirmed
-- - service (category): also check any future confirmed bookings referencing this category

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
    SELECT 1
    FROM public.booking_items bi
    JOIN public.bookings b ON b.id = bi.booking_id
    WHERE bi.service_item_id = p_id
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
  -- Category must be empty
  IF EXISTS (SELECT 1 FROM public.service_items si WHERE si.service_id = p_id) THEN
    RAISE EXCEPTION 'cannot delete: category not empty' USING ERRCODE = '45000';
  END IF;
  -- Also block if any future confirmed booking still references this category
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.service_id = p_id
      AND lower(b.status) = 'confirmed'
      AND ((b.start_at IS NOT NULL AND b.start_at > now()) OR (b.preferred_date IS NOT NULL AND b.preferred_date >= current_date))
  ) OR EXISTS (
    SELECT 1
    FROM public.booking_items bi
    JOIN public.bookings b ON b.id = bi.booking_id
    JOIN public.service_items si ON si.id = bi.service_item_id
    WHERE si.service_id = p_id
      AND lower(b.status) = 'confirmed'
      AND ((b.start_at IS NOT NULL AND b.start_at > now()) OR (b.preferred_date IS NOT NULL AND b.preferred_date >= current_date))
  ) THEN
    RAISE EXCEPTION 'cannot delete: future confirmed bookings exist' USING ERRCODE = '45000';
  END IF;
  DELETE FROM public.services WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_service_item(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_service(uuid) TO authenticated;
