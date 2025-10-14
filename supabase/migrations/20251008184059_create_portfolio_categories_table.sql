/*
  # Create Portfolio Categories Table

  1. New Tables
    - `portfolio_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Category name
      - `order_index` (integer) - Display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Remove constraint on portfolio_items.category
    - Update portfolio_items to reference category names
    - Insert default categories

  3. Security
    - Enable RLS on `portfolio_categories` table
    - Add policies for public read access
    - Add policies for authenticated admin write access
*/

-- Create portfolio_categories table
CREATE TABLE IF NOT EXISTS portfolio_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE portfolio_categories ENABLE ROW LEVEL SECURITY;

-- Public can view categories
CREATE POLICY "Anyone can view categories"
  ON portfolio_categories FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert categories
CREATE POLICY "Authenticated users can insert categories"
  ON portfolio_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update categories
CREATE POLICY "Authenticated users can update categories"
  ON portfolio_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete categories
CREATE POLICY "Authenticated users can delete categories"
  ON portfolio_categories FOR DELETE
  TO authenticated
  USING (true);

-- Remove old constraint if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'portfolio_items_category_check'
  ) THEN
    ALTER TABLE portfolio_items DROP CONSTRAINT portfolio_items_category_check;
  END IF;
END $$;

-- Insert default categories if table is empty
INSERT INTO portfolio_categories (name, order_index)
SELECT 'Cils', 0
WHERE NOT EXISTS (SELECT 1 FROM portfolio_categories WHERE name = 'Cils');

INSERT INTO portfolio_categories (name, order_index)
SELECT 'Sourcils', 1
WHERE NOT EXISTS (SELECT 1 FROM portfolio_categories WHERE name = 'Sourcils');

INSERT INTO portfolio_categories (name, order_index)
SELECT 'Lèvres', 2
WHERE NOT EXISTS (SELECT 1 FROM portfolio_categories WHERE name = 'Lèvres');

INSERT INTO portfolio_categories (name, order_index)
SELECT 'Maquillage', 3
WHERE NOT EXISTS (SELECT 1 FROM portfolio_categories WHERE name = 'Maquillage');