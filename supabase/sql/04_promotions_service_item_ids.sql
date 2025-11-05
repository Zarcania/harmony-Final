-- Add service_item_ids (uuid[]) to promotions to link promotions to specific service items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promotions' AND column_name = 'service_item_ids'
  ) THEN
    ALTER TABLE public.promotions ADD COLUMN service_item_ids uuid[];
  END IF;
END $$;

-- Optional: create a GIN index for array queries (e.g., promotions containing an item)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_promotions_service_item_ids' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_promotions_service_item_ids ON public.promotions USING GIN (service_item_ids);
  END IF;
END $$;

COMMENT ON COLUMN public.promotions.service_item_ids IS 'List of linked service_items (UUIDs) for this promotion';
