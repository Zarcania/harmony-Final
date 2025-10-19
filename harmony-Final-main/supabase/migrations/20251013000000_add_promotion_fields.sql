-- Add original_price, badge, and icon fields to promotions table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'original_price') THEN
    ALTER TABLE promotions ADD COLUMN original_price TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'badge') THEN
    ALTER TABLE promotions ADD COLUMN badge TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'icon') THEN
    ALTER TABLE promotions ADD COLUMN icon TEXT;
  END IF;
END $$;

-- Update existing promotions with default values based on common patterns
UPDATE promotions SET 
  original_price = '115€',
  badge = 'Nouveau',
  icon = 'Sparkles'
WHERE title = 'Première visite' AND original_price IS NULL;

UPDATE promotions SET 
  original_price = '90€',
  badge = 'Populaire',
  icon = 'Heart'
WHERE title = 'Pack Beauté' AND original_price IS NULL;

UPDATE promotions SET 
  original_price = '120€',
  badge = 'Premium',
  icon = 'Crown'
WHERE title = 'Premium' AND original_price IS NULL;

UPDATE promotions SET 
  original_price = '140€',
  badge = 'Limité',
  icon = 'Gift'
WHERE title = 'Duo Complice' AND original_price IS NULL;
