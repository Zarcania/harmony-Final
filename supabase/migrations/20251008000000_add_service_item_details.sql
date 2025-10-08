/*
  # Add Service Item Details

  1. Changes
    - Add `description` column to `service_items` table for detailed service information
    - Add `duration` column to `service_items` table for service duration
    - Add `benefits` column (text array) to `service_items` table for service benefits list

  2. Notes
    - All columns are optional (nullable) to maintain compatibility with existing data
    - Default values are not set to allow flexibility
*/

-- Add description column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_items' AND column_name = 'description'
  ) THEN
    ALTER TABLE service_items ADD COLUMN description text;
  END IF;
END $$;

-- Add duration column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_items' AND column_name = 'duration'
  ) THEN
    ALTER TABLE service_items ADD COLUMN duration text;
  END IF;
END $$;

-- Add benefits column (array of text)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_items' AND column_name = 'benefits'
  ) THEN
    ALTER TABLE service_items ADD COLUMN benefits text[];
  END IF;
END $$;
