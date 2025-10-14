/*
  # Enable Supabase Auth and Admin Role

  1. Changes
    - Create admin role metadata function
    - Add RLS policies for admin access to all tables
    - Prepare for migration from custom admin_users to Supabase Auth
  
  2. Security
    - Admin users will be identified via auth.jwt() claims
    - All content management tables will check for admin role
    - Public read access maintained for public-facing content
  
  3. Notes
    - Existing admin_users table will remain for reference but won't be used
    - Admin user should be created via Supabase Auth Dashboard with email: castro.oceane@laposte.net
    - After user creation, add custom claim in Dashboard: { "role": "admin" }
*/

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for admin access
-- Portfolio items - admin can do everything
DROP POLICY IF EXISTS "Admin full access to portfolio_items" ON portfolio_items;
CREATE POLICY "Admin full access to portfolio_items"
  ON portfolio_items
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Portfolio categories - admin can do everything
DROP POLICY IF EXISTS "Admin full access to portfolio_categories" ON portfolio_categories;
CREATE POLICY "Admin full access to portfolio_categories"
  ON portfolio_categories
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Services - admin can do everything
DROP POLICY IF EXISTS "Admin full access to services" ON services;
CREATE POLICY "Admin full access to services"
  ON services
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Service items - admin can do everything
DROP POLICY IF EXISTS "Admin full access to service_items" ON service_items;
CREATE POLICY "Admin full access to service_items"
  ON service_items
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Reviews - admin can do everything
DROP POLICY IF EXISTS "Admin full access to reviews" ON reviews;
CREATE POLICY "Admin full access to reviews"
  ON reviews
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Promotions - admin can do everything
DROP POLICY IF EXISTS "Admin full access to promotions" ON promotions;
CREATE POLICY "Admin full access to promotions"
  ON promotions
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- About content - admin can do everything
DROP POLICY IF EXISTS "Admin full access to about_content" ON about_content;
CREATE POLICY "Admin full access to about_content"
  ON about_content
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Site settings - admin can do everything
DROP POLICY IF EXISTS "Admin full access to site_settings" ON site_settings;
CREATE POLICY "Admin full access to site_settings"
  ON site_settings
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Bookings - admin can do everything
DROP POLICY IF EXISTS "Admin full access to bookings" ON bookings;
CREATE POLICY "Admin full access to bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());