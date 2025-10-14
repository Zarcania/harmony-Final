/*
  # Add Duration to Service Items

  1. Changes
    - Add `duration` column to `service_items` table
    - Stores service duration (e.g., "1h30", "45min", "2h")
    - Optional field for services that need to display duration
  
  2. Notes
    - Uses IF NOT EXISTS to prevent errors on repeated execution
    - Particularly useful for semi-permanent makeup services
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_items' AND column_name = 'duration'
  ) THEN
    ALTER TABLE service_items ADD COLUMN duration text DEFAULT '' NOT NULL;
  END IF;
END $$;