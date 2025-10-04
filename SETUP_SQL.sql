-- =========================================
-- SCRIPT DE CRÉATION DES TABLES
-- À exécuter dans Supabase SQL Editor
-- =========================================

-- 1. TABLE ADMIN_USERS
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin users can view their own data" ON admin_users;
DROP POLICY IF EXISTS "Admin users can update their own data" ON admin_users;

CREATE POLICY "Admin users can view their own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Admin users can update their own data"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

INSERT INTO admin_users (username, password_hash, email)
VALUES ('admin', '2HwCnCl8UuPgZQxw:57667763:3416049', 'admin@harmoniecils.fr')
ON CONFLICT (username) DO NOTHING;

-- 2. TABLE PROMOTIONS
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view promotions" ON promotions;
DROP POLICY IF EXISTS "Authenticated users can insert promotions" ON promotions;
DROP POLICY IF EXISTS "Authenticated users can update promotions" ON promotions;
DROP POLICY IF EXISTS "Authenticated users can delete promotions" ON promotions;

CREATE POLICY "Anyone can view promotions"
  ON promotions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert promotions"
  ON promotions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update promotions"
  ON promotions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete promotions"
  ON promotions FOR DELETE
  TO authenticated
  USING (true);

-- 3. TABLE SERVICES
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  icon text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view services" ON services;
DROP POLICY IF EXISTS "Authenticated users can insert services" ON services;
DROP POLICY IF EXISTS "Authenticated users can update services" ON services;
DROP POLICY IF EXISTS "Authenticated users can delete services" ON services;

CREATE POLICY "Anyone can view services"
  ON services FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update services"
  ON services FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete services"
  ON services FOR DELETE
  TO authenticated
  USING (true);

-- 4. TABLE SERVICE_ITEMS
CREATE TABLE IF NOT EXISTS service_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  label text NOT NULL,
  price text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view service items" ON service_items;
DROP POLICY IF EXISTS "Authenticated users can insert service items" ON service_items;
DROP POLICY IF EXISTS "Authenticated users can update service items" ON service_items;
DROP POLICY IF EXISTS "Authenticated users can delete service items" ON service_items;

CREATE POLICY "Anyone can view service items"
  ON service_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert service items"
  ON service_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update service items"
  ON service_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete service items"
  ON service_items FOR DELETE
  TO authenticated
  USING (true);

-- 5. TABLE PORTFOLIO_ITEMS
CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  detailed_description text DEFAULT '',
  alt text NOT NULL,
  show_on_home boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view portfolio items" ON portfolio_items;
DROP POLICY IF EXISTS "Authenticated users can insert portfolio items" ON portfolio_items;
DROP POLICY IF EXISTS "Authenticated users can update portfolio items" ON portfolio_items;
DROP POLICY IF EXISTS "Authenticated users can delete portfolio items" ON portfolio_items;

CREATE POLICY "Anyone can view portfolio items"
  ON portfolio_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert portfolio items"
  ON portfolio_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update portfolio items"
  ON portfolio_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete portfolio items"
  ON portfolio_items FOR DELETE
  TO authenticated
  USING (true);

-- 6. TABLE ABOUT_CONTENT
CREATE TABLE IF NOT EXISTS about_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  title text DEFAULT '',
  content text DEFAULT '',
  image_url text DEFAULT '',
  order_index integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view about content" ON about_content;
DROP POLICY IF EXISTS "Authenticated users can insert about content" ON about_content;
DROP POLICY IF EXISTS "Authenticated users can update about content" ON about_content;
DROP POLICY IF EXISTS "Authenticated users can delete about content" ON about_content;

CREATE POLICY "Anyone can view about content"
  ON about_content FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert about content"
  ON about_content FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update about content"
  ON about_content FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete about content"
  ON about_content FOR DELETE
  TO authenticated
  USING (true);

-- 7. TABLE SITE_SETTINGS
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can insert site settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can delete site settings" ON site_settings;

CREATE POLICY "Anyone can view site settings"
  ON site_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert site settings"
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete site settings"
  ON site_settings FOR DELETE
  TO authenticated
  USING (true);

-- 8. INDEXES POUR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_service_items_service_id ON service_items(service_id);
CREATE INDEX IF NOT EXISTS idx_promotions_order ON promotions(order_index);
CREATE INDEX IF NOT EXISTS idx_services_order ON services(order_index);
CREATE INDEX IF NOT EXISTS idx_service_items_order ON service_items(order_index);
CREATE INDEX IF NOT EXISTS idx_portfolio_order ON portfolio_items(order_index);
CREATE INDEX IF NOT EXISTS idx_about_order ON about_content(order_index);
