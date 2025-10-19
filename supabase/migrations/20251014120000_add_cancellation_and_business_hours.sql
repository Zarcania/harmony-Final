--
-- Migration: add cancellation token + RPC, business hours and closures
-- Date: 2025-10-14
--

-- 1) Bookings: add cancellation columns if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cancellation_token'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cancellation_token uuid UNIQUE DEFAULT gen_random_uuid();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'canceled_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN canceled_at timestamptz;
  END IF;
END $$;

-- Helpful index if UNIQUE wasn't created (guarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_bookings_cancellation_token'
  ) THEN
    CREATE INDEX idx_bookings_cancellation_token ON bookings(cancellation_token);
  END IF;
END $$;

-- 2) RPC: public.cancel_booking(p_token uuid)
-- Cancels a booking by token and returns a simple JSON payload for the UI
CREATE OR REPLACE FUNCTION public.cancel_booking(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_result jsonb;
BEGIN
  SELECT * INTO v_booking
  FROM bookings
  WHERE cancellation_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Lien d\'annulation invalide'
    );
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Ce rendez-vous a déjà été annulé',
      'booking', jsonb_build_object(
        'service', v_booking.service_name,
        'date', to_char(v_booking.preferred_date, 'YYYY-MM-DD'),
        'time', v_booking.preferred_time
      )
    );
  END IF;

  -- Mark as cancelled
  UPDATE bookings
  SET status = 'cancelled',
      canceled_at = now(),
      updated_at = now()
  WHERE id = v_booking.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Votre rendez-vous a bien été annulé',
    'booking', jsonb_build_object(
      'service', v_booking.service_name,
      'date', to_char(v_booking.preferred_date, 'YYYY-MM-DD'),
      'time', v_booking.preferred_time
    )
  );
END;
$$;

-- Allow anonymous execution (used by public cancellation page)
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated;

-- 3) Business hours configuration
CREATE TABLE IF NOT EXISTS public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = lundi (align with date-fns fr? 0-6 arbitrary)
  open_time time,
  close_time time,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_hours_time_check CHECK (
    (is_closed = true) OR (open_time IS NOT NULL AND close_time IS NOT NULL AND close_time > open_time)
  )
);

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'business_hours' AND policyname = 'Authenticated can read business hours'
  ) THEN
    CREATE POLICY "Authenticated can read business hours"
      ON public.business_hours FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'business_hours' AND policyname = 'Authenticated can manage business hours'
  ) THEN
    CREATE POLICY "Authenticated can manage business hours"
      ON public.business_hours FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Ensure single row per day (optional unique constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_business_hours_day'
  ) THEN
    ALTER TABLE public.business_hours ADD CONSTRAINT uniq_business_hours_day UNIQUE(day_of_week);
  END IF;
END $$;

-- 4) Closures (exceptional closures / vacations)
CREATE TABLE IF NOT EXISTS public.closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.closures ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'closures' AND policyname = 'Authenticated can read closures'
  ) THEN
    CREATE POLICY "Authenticated can read closures"
      ON public.closures FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'closures' AND policyname = 'Authenticated can manage closures'
  ) THEN
    CREATE POLICY "Authenticated can manage closures"
      ON public.closures FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Helpful index for date range queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_closures_range'
  ) THEN
    CREATE INDEX idx_closures_range ON public.closures(start_date, end_date);
  END IF;
END $$;
