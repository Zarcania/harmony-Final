-- Secure delete RPCs for services and service_items with business rules
-- - delete_service_item(p_id): forbid if any future confirmed booking references the item
-- - delete_service(p_id): forbid if the category still has items

DO $$
BEGIN
  -- delete_service_item
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'delete_service_item'
  ) THEN
    EXECUTE 'CREATE OR REPLACE FUNCTION public.delete_service_item(p_id uuid)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        IF NOT public.is_admin() THEN
          RAISE EXCEPTION ''forbidden: admin only'' USING ERRCODE = ''42501'';
        END IF;
        -- Block if a future confirmed booking references this service_item
        IF EXISTS (
          SELECT 1
          FROM public.booking_items bi
          JOIN public.bookings b ON b.id = bi.booking_id
          WHERE bi.service_item_id = p_id
            AND lower(b.status) = ''confirmed''
            AND ((b.start_at IS NOT NULL AND b.start_at > now()) OR (b.preferred_date IS NOT NULL AND b.preferred_date >= current_date))
        ) THEN
          RAISE EXCEPTION ''cannot delete: future confirmed bookings exist'' USING ERRCODE = ''45000'';
        END IF;
        DELETE FROM public.service_items WHERE id = p_id;
      END;
      $$';
  END IF;

  -- delete_service
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'delete_service'
  ) THEN
    EXECUTE 'CREATE OR REPLACE FUNCTION public.delete_service(p_id uuid)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        IF NOT public.is_admin() THEN
          RAISE EXCEPTION ''forbidden: admin only'' USING ERRCODE = ''42501'';
        END IF;
        -- Refuse if category still has items
        IF EXISTS (SELECT 1 FROM public.service_items si WHERE si.service_id = p_id) THEN
          RAISE EXCEPTION ''cannot delete: category not empty'' USING ERRCODE = ''45000'';
        END IF;
        -- Also refuse if any future confirmed booking relates to this category
        IF EXISTS (
          SELECT 1 FROM public.bookings b
          WHERE b.service_id = p_id
            AND lower(b.status) = ''confirmed''
            AND ((b.start_at IS NOT NULL AND b.start_at > now()) OR (b.preferred_date IS NOT NULL AND b.preferred_date >= current_date))
        ) OR EXISTS (
          SELECT 1
          FROM public.booking_items bi
          JOIN public.bookings b ON b.id = bi.booking_id
          JOIN public.service_items si ON si.id = bi.service_item_id
          WHERE si.service_id = p_id
            AND lower(b.status) = ''confirmed''
            AND ((b.start_at IS NOT NULL AND b.start_at > now()) OR (b.preferred_date IS NOT NULL AND b.preferred_date >= current_date))
        ) THEN
          RAISE EXCEPTION ''cannot delete: future confirmed bookings exist'' USING ERRCODE = ''45000'';
        END IF;
        DELETE FROM public.services WHERE id = p_id;
      END;
      $$';
  END IF;

  -- Grants
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.delete_service_item(uuid) TO authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.delete_service(uuid) TO authenticated';
END $$;
