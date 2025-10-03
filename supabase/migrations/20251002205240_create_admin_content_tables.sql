/*
  # Create Admin Content Management Tables

  1. New Tables
    - `promotions` - Stores exclusive offers/promotions for homepage
      - `id` (uuid, primary key)
      - `title` (text) - Promotion title
      - `description` (text) - Promotion description
      - `price` (text) - Price display
      - `order_index` (integer) - Display order
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `services` - Stores service categories and items
      - `id` (uuid, primary key)
      - `title` (text) - Service category title
      - `icon` (text) - Icon name
      - `order_index` (integer) - Display order
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `service_items` - Stores individual service items
      - `id` (uuid, primary key)
      - `service_id` (uuid, foreign key to services)
      - `label` (text) - Service name
      - `price` (text) - Service price
      - `order_index` (integer) - Display order
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `portfolio_items` - Stores portfolio images and details
      - `id` (uuid, primary key)
      - `url` (text) - Image URL
      - `title` (text) - Image title
      - `description` (text) - Short description
      - `detailed_description` (text) - Detailed description
      - `alt` (text) - Alt text
      - `show_on_home` (boolean) - Show on homepage
      - `order_index` (integer) - Display order
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `about_content` - Stores About section content
      - `id` (uuid, primary key)
      - `section_key` (text, unique) - Section identifier
      - `title` (text) - Section title
      - `content` (text) - Section content
      - `image_url` (text) - Image URL
      - `order_index` (integer) - Display order
      - `updated_at` (timestamp)
    
    - `site_settings` - Stores general site settings
      - `id` (uuid, primary key)
      - `setting_key` (text, unique) - Setting identifier
      - `setting_value` (text) - Setting value
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated admin write access
*/

-- Create promotions table
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

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  icon text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

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

-- Create service_items table
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

-- Create portfolio_items table
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

-- Create about_content table
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

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_items_service_id ON service_items(service_id);
CREATE INDEX IF NOT EXISTS idx_promotions_order ON promotions(order_index);
CREATE INDEX IF NOT EXISTS idx_services_order ON services(order_index);
CREATE INDEX IF NOT EXISTS idx_service_items_order ON service_items(order_index);
CREATE INDEX IF NOT EXISTS idx_portfolio_order ON portfolio_items(order_index);
CREATE INDEX IF NOT EXISTS idx_about_order ON about_content(order_index);