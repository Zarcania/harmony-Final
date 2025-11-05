-- Duplicate index cleanup and unused index report

DO $$
BEGIN
  -- Drop duplicates safely if they exist (keep a single canonical index)
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='bookings_no_overlap') THEN
    EXECUTE 'DROP INDEX IF EXISTS public.bookings_no_overlap';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='no_overlap') THEN
    EXECUTE 'DROP INDEX IF EXISTS public.no_overlap';
  END IF;
  -- keep public.idx_bookings_ts

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='cancellation_tokens_token_key') THEN
    EXECUTE 'DROP INDEX IF EXISTS public.cancellation_tokens_token_key';
  END IF;
  -- keep public.cancellation_tokens_token_uidx

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='idx_reviews_published') THEN
    EXECUTE 'DROP INDEX IF EXISTS public.idx_reviews_published';
  END IF;
  -- keep public.idx_reviews_is_published

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='booking_items_service_item_idx') THEN
    EXECUTE 'DROP INDEX IF EXISTS public.booking_items_service_item_idx';
  END IF;
  -- keep public.idx_booking_items_service_item_id
END $$ LANGUAGE plpgsql;

-- Report unused indexes (informational)
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT 'public.bookings' AS table, 'idx_bookings_date' AS index
    UNION ALL SELECT 'public.bookings','idx_bookings_cancellation_token'
    UNION ALL SELECT 'public.bookings','idx_bookings_service_id'
    UNION ALL SELECT 'public.cancellation_tokens','idx_cancellation_tokens_expires_at'
    UNION ALL SELECT 'public.business_breaks','idx_business_breaks_enabled'
    UNION ALL SELECT 'public.bookings','idx_bookings_start_at'
    UNION ALL SELECT 'public.bookings','idx_bookings_end_at'
    UNION ALL SELECT 'public.bookings','idx_bookings_ts'
    UNION ALL SELECT 'public.business_breaks','idx_business_breaks_dow'
    UNION ALL SELECT 'public.service_items','idx_service_items_order'
    UNION ALL SELECT 'public.portfolio_items','idx_portfolio_category'
    UNION ALL SELECT 'public.about_content','idx_about_order'
    UNION ALL SELECT 'public.reviews','idx_reviews_published'
    UNION ALL SELECT 'public.bookings','idx_bookings_status'
    UNION ALL SELECT 'public.email_logs','idx_email_logs_email_type'
    UNION ALL SELECT 'public.cancellation_tokens','idx_cancellation_tokens_token'
    UNION ALL SELECT 'public.service_item_members','idx_service_item_members_user'
    UNION ALL SELECT 'public.profiles','profiles_admin_idx'
    UNION ALL SELECT 'public.booking_items','booking_items_service_item_idx'
    UNION ALL SELECT 'public.booking_items','idx_booking_items_service_item_id'
    UNION ALL SELECT 'public.booking_items','idx_booking_items_booking_id'
    UNION ALL SELECT 'public.bookings','idx_bookings_start_end'
    UNION ALL SELECT 'public.business_hours','idx_business_hours_dow'
    UNION ALL SELECT 'public.bookings','idx_bookings_user_id'
    UNION ALL SELECT 'public.reviews','idx_reviews_is_published'
  ) LOOP
    RAISE NOTICE 'Unused index candidate: % on %', r.index, r.table;
  END LOOP;
END $$ LANGUAGE plpgsql;
