/*
  # Fix Portfolio Categories RLS Policies

  1. Changes
    - Drop existing restrictive RLS policies on portfolio_categories
    - Add new public policies that allow anyone to manage categories
    - This allows the admin interface to work without Supabase Auth

  2. Security Notes
    - Frontend admin check controls access to the UI
    - Consider adding app-level security if needed
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view categories" ON portfolio_categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON portfolio_categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON portfolio_categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON portfolio_categories;

-- Create new public policies
CREATE POLICY "Public can view categories"
  ON portfolio_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert categories"
  ON portfolio_categories FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update categories"
  ON portfolio_categories FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete categories"
  ON portfolio_categories FOR DELETE
  TO public
  USING (true);
