-- Align business_hours schema with frontend expectations (is_closed boolean) and constraints
-- Safe to run multiple times (guards for existing objects). Run in production to fix 42703 errors.

BEGIN;

-- 1) Ensure column is_closed exists and contains correct values; handle legacy 'closed' column
DO $$
DECLARE
  has_is_closed boolean;
  has_closed boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='business_hours' AND column_name='is_closed'
  ) INTO has_is_closed;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='business_hours' AND column_name='closed'
  ) INTO has_closed;

  IF has_closed AND NOT has_is_closed THEN
    -- Simple rename if legacy column exists and new one doesn't
    EXECUTE 'ALTER TABLE public.business_hours RENAME COLUMN "closed" TO is_closed';
  ELSIF NOT has_is_closed THEN
    -- Column missing entirely -> create with default false
    EXECUTE 'ALTER TABLE public.business_hours ADD COLUMN is_closed boolean NOT NULL DEFAULT false';
  END IF;

  -- If both existed (rare), merge data to is_closed then drop legacy
  IF has_closed AND has_is_closed THEN
    EXECUTE 'UPDATE public.business_hours SET is_closed = COALESCE(is_closed, false) OR COALESCE("closed", false)';
    -- Try drop legacy column safely
    BEGIN
      EXECUTE 'ALTER TABLE public.business_hours DROP COLUMN "closed"';
    EXCEPTION WHEN undefined_column THEN
      -- ignore
    END;
  END IF;
END $$;

-- 2) Ensure defaults and NOT NULL
ALTER TABLE public.business_hours ALTER COLUMN is_closed SET DEFAULT false;
ALTER TABLE public.business_hours ALTER COLUMN is_closed SET NOT NULL;

-- 3) Data normalization to satisfy time check: when is_closed = true, times must be NULL
UPDATE public.business_hours
SET open_time = NULL, close_time = NULL
WHERE is_closed = true AND (open_time IS NOT NULL OR close_time IS NOT NULL);

-- If open business row has missing times, mark as closed to avoid invalid state
UPDATE public.business_hours
SET is_closed = true, open_time = NULL, close_time = NULL
WHERE is_closed = false AND (open_time IS NULL OR close_time IS NULL);

-- If open_time >= close_time, mark closed (manual correction can follow in UI)
UPDATE public.business_hours
SET is_closed = true, open_time = NULL, close_time = NULL
WHERE is_closed = false AND open_time IS NOT NULL AND close_time IS NOT NULL AND open_time >= close_time;

-- 4) Recreate CHECK constraint (use NOT VALID first to avoid locking; then validate)
DO $$
BEGIN
  -- Drop existing check with known name if present
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'business_hours_time_check'
  ) THEN
    ALTER TABLE public.business_hours DROP CONSTRAINT business_hours_time_check;
  END IF;

  -- Create NOT VALID, then validate
  ALTER TABLE public.business_hours
    ADD CONSTRAINT business_hours_time_check
    CHECK ((is_closed = true) OR (open_time IS NOT NULL AND close_time IS NOT NULL AND close_time > open_time)) NOT VALID;

  ALTER TABLE public.business_hours VALIDATE CONSTRAINT business_hours_time_check;
END $$;

-- 5) Ensure unique row per day_of_week
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_business_hours_day'
  ) THEN
    ALTER TABLE public.business_hours ADD CONSTRAINT uniq_business_hours_day UNIQUE(day_of_week);
  END IF;
END $$;

COMMIT;

-- Tests rapides (exécuter dans SQL Editor si besoin):
-- SELECT day_of_week, open_time, close_time, is_closed FROM public.business_hours ORDER BY day_of_week;
-- La requête REST suivante doit fonctionner ensuite (remplacer <PROJECT_URL> et <ANON_KEY>):
-- GET https://<PROJECT_URL>.supabase.co/rest/v1/business_hours?select=day_of_week,open_time,close_time,is_closed
-- Headers: apikey: <ANON_KEY>, Authorization: Bearer <ANON_KEY>
