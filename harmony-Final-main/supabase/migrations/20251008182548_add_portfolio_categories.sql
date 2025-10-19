/*
  # Add Portfolio Categories

  1. Changes
    - Add `category` column to `portfolio_items` table
    - Categories: 'Cils', 'Sourcils', 'Lèvres', 'Maquillage'
    - Default to 'Cils' for existing entries
  
  2. Notes
    - Uses IF NOT EXISTS to prevent errors on repeated execution
    - All existing images will default to 'Cils' category
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portfolio_items' AND column_name = 'category'
  ) THEN
    ALTER TABLE portfolio_items ADD COLUMN category text DEFAULT 'Cils' NOT NULL;
  END IF;
END $$;

-- Add constraint to ensure only valid categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'portfolio_items_category_check'
  ) THEN
    ALTER TABLE portfolio_items ADD CONSTRAINT portfolio_items_category_check 
      CHECK (category IN ('Cils', 'Sourcils', 'Lèvres', 'Maquillage'));
  END IF;
END $$;