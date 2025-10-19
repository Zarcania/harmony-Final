-- 01_indexes_constraints.sql
-- Idempotent indexes and constraints for Harmony Cils

-- service_items(service_id)
DO $$
BEGIN
  IF to_regclass('public.service_items') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='service_items' AND column_name='service_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_service_items_service_id ON public.service_items(service_id)';
  END IF;
END $$;

-- bookings(service_id), bookings(status), bookings(preferred_date)
DO $$
BEGIN
  IF to_regclass('public.bookings') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='service_id'
    ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id)';
    END IF;
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_bookings_preferred_date ON public.bookings(preferred_date)';
  END IF;
END $$;

-- email_logs(booking_id)
DO $$
BEGIN
  IF to_regclass('public.email_logs') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='email_logs' AND column_name='booking_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_email_logs_booking_id ON public.email_logs(booking_id)';
  END IF;
END $$;

-- cancellation_tokens(booking_id), (expires_at), (used_at)
DO $$
BEGIN
  IF to_regclass('public.cancellation_tokens') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cancellation_tokens' AND column_name='booking_id'
    ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_cancellation_tokens_booking_id ON public.cancellation_tokens(booking_id)';
    END IF;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cancellation_tokens' AND column_name='expires_at'
    ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_cancellation_tokens_expires_at ON public.cancellation_tokens(expires_at)';
    END IF;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cancellation_tokens' AND column_name='used_at'
    ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_cancellation_tokens_used_at ON public.cancellation_tokens(used_at)';
    END IF;
  END IF;
END $$;

-- closures: CHECK end_date >= start_date
DO $$
BEGIN
  IF to_regclass('public.closures') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid='public.closures'::regclass AND conname='chk_closures_dates'
  ) THEN
    EXECUTE 'ALTER TABLE public.closures ADD CONSTRAINT chk_closures_dates CHECK (end_date >= start_date) NOT VALID';
    BEGIN
      EXECUTE 'ALTER TABLE public.closures VALIDATE CONSTRAINT chk_closures_dates';
    EXCEPTION WHEN others THEN NULL; END;
  END IF;
END $$;

-- email_logs.email_type must allow "cancellation"
DO $$
DECLARE v_name text; v_def text;
BEGIN
  IF to_regclass('public.email_logs') IS NOT NULL THEN
    SELECT conname, pg_get_constraintdef(oid) INTO v_name, v_def
    FROM pg_constraint
    WHERE conrelid='public.email_logs'::regclass AND contype='c' AND pg_get_constraintdef(oid) ILIKE '%email_type%IN%';

    IF v_name IS NOT NULL AND v_def NOT ILIKE '%cancellation%' THEN
      EXECUTE format('ALTER TABLE public.email_logs DROP CONSTRAINT %I', v_name);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conrelid='public.email_logs'::regclass AND conname='email_logs_email_type_check'
    ) THEN
      EXECUTE $$ALTER TABLE public.email_logs ADD CONSTRAINT email_logs_email_type_check CHECK (email_type IN ('confirmation','reminder','cancellation'))$$;
    END IF;
  END IF;
END $$;
