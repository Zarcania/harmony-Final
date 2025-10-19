/*
  # Create Complete Harmonie Cils Database Schema
  
  ## Overview
  This migration creates a comprehensive database schema for the Harmonie Cils beauty salon website,
  including admin management, services, portfolio, reviews, promotions, bookings, and content management.
  
  ## 1. New Tables
  
  ### admin_users
  Stores admin user credentials for backend management
  - `id` (uuid, primary key) - Unique identifier
  - `username` (text, unique, required) - Admin username for login
  - `password_hash` (text, required) - Securely hashed password
  - `email` (text, optional) - Admin email address
  - `created_at` (timestamptz, default now) - Account creation timestamp
  - `updated_at` (timestamptz, default now) - Last update timestamp
  
  ### services
  Stores service categories (Extensions de Cils, Rehaussement, etc.)
  - `id` (uuid, primary key) - Unique identifier
  - `title` (text, required) - Service category name
  - `icon` (text, required) - Lucide icon name for display
  - `order_index` (integer, default 0) - Display order on website
  - `created_at` (timestamptz, default now) - Creation timestamp
  - `updated_at` (timestamptz, default now) - Last update timestamp
  
  ### service_items
  Stores individual services within each category with full details
  - `id` (uuid, primary key) - Unique identifier
  - `service_id` (uuid, foreign key to services) - Parent service category
  - `label` (text, required) - Service name/title
  - `price` (text, required) - Price display (e.g., "80€", "À partir de 120€")
  - `description` (text, optional) - Detailed service description
  - `duration` (text, default '') - Service duration (e.g., "1h30", "2h")
  - `benefits` (text[], optional) - Array of service benefits/features
  - `order_index` (integer, default 0) - Display order within category
  - `created_at` (timestamptz, default now) - Creation timestamp
  - `updated_at` (timestamptz, default now) - Last update timestamp
  
  ### portfolio_categories
  Stores portfolio image categories for filtering
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text, unique, required) - Category name (Cils, Sourcils, Lèvres, Maquillage)
  - `order_index` (integer, default 0) - Display order
  - `created_at` (timestamptz, default now) - Creation timestamp
  - `updated_at` (timestamptz, default now) - Last update timestamp
  
  ### portfolio_items
  Stores portfolio images showcasing work
  - `id` (uuid, primary key) - Unique identifier
  - `url` (text, required) - Image URL/path
  - `title` (text, required) - Image title
  - `description` (text, required) - Short description
  - `detailed_description` (text, default '') - Extended description for modal view
  - `alt` (text, required) - Alt text for accessibility
  - `category` (text, default 'Cils', required) - Portfolio category name
  - `show_on_home` (boolean, default false) - Display on homepage
  - `order_index` (integer, default 0) - Display order
  - `created_at` (timestamptz, default now) - Creation timestamp
  - `updated_at` (timestamptz, default now) - Last update timestamp
  
  ### reviews
  Stores client reviews and testimonials
  - `id` (uuid, primary key) - Unique identifier
  - `client_name` (text, required) - Client's name
  - `rating` (integer, required, 1-5) - Star rating (constrained to 1-5)
  - `comment` (text, required) - Review text
  - `service_type` (text, default '', required) - Service received
  - `is_published` (boolean, default false, required) - Visibility status
  - `order_index` (integer, default 0, required) - Display order
  - `created_at` (timestamptz, default now) - Creation timestamp
  - `updated_at` (timestamptz, default now) - Last update timestamp
  
  ### promotions
  Stores special offers and promotional packages
  - `id` (uuid, primary key) - Unique identifier
  - `title` (text, required) - Promotion title
  - `description` (text, required) - Promotion description
  - `price` (text, required) - Promotional price
  - `order_index` (integer, default 0) - Display order
  - `created_at` (timestamptz, default now) - Creation timestamp
  - `updated_at` (timestamptz, default now) - Last update timestamp
  
  ### about_content
  Stores editable content sections for About page
  - `id` (uuid, primary key) - Unique identifier
  - `section_key` (text, unique, required) - Section identifier key
  - `title` (text, default '') - Section title
  - `content` (text, default '') - Section content/body text
  - `image_url` (text, default '') - Associated image URL
  - `order_index` (integer, default 0) - Display order
  - `updated_at` (timestamptz, default now) - Last update timestamp
  
  ### site_settings
  Stores general site configuration and settings
  - `id` (uuid, primary key) - Unique identifier
  - `setting_key` (text, unique, required) - Setting identifier key
  - `setting_value` (text, default '') - Setting value
  - `updated_at` (timestamptz, default now) - Last update timestamp
  
  ### bookings
  Stores client appointment bookings
  - `id` (uuid, primary key) - Unique identifier
  - `client_name` (text, required) - Client's full name
  - `client_email` (text, required) - Client's email address
  - `client_phone` (text, required) - Client's phone number
  - `service_id` (uuid, optional) - Reference to selected service
  - `service_name` (text, required) - Service name (for display)
  - `preferred_date` (date, required) - Preferred appointment date
  - `preferred_time` (text, required) - Preferred time slot
  - `message` (text, default '') - Additional client message/notes
  - `status` (text, default 'pending') - Booking status (pending, confirmed, cancelled)
  - `created_at` (timestamptz, default now) - Booking creation timestamp
  - `updated_at` (timestamptz, default now) - Last update timestamp
  
  ## 2. Security - Row Level Security (RLS)
  
  All tables have RLS enabled with the following security model:
  
  ### Public Access (anon + authenticated)
  - READ access to: services, service_items, portfolio_items, portfolio_categories, 
    promotions, about_content, site_settings, published reviews
  
  ### Authenticated Admin Access Only
  - FULL CRUD access to: all content tables for admin management
  - Special policies for admin_users (users can only view/update their own data)
  
  ### Specific Policies
  
  #### admin_users
  - Authenticated users can only SELECT/UPDATE their own records (auth.uid() = id)
  
  #### reviews
  - Public can only view published reviews (is_published = true)
  - Authenticated users have full CRUD for admin moderation
  
  #### bookings
  - Public can INSERT bookings (customer-facing)
  - Authenticated users have full CRUD for admin management
  
  ## 3. Performance Optimizations
  
  Indexes created on:
  - `service_items.service_id` - Foreign key lookup optimization
  - `promotions.order_index` - Sorting optimization
  - `services.order_index` - Sorting optimization
  - `service_items.order_index` - Sorting optimization
  - `portfolio_items.order_index` - Sorting optimization
  - `portfolio_items.category` - Category filtering optimization
  - `about_content.order_index` - Sorting optimization
  - `reviews.is_published` - Published reviews filtering
  - `bookings.status` - Status filtering optimization
  - `bookings.preferred_date` - Date-based queries optimization
  
  ## 4. Data Constraints
  
  - Rating values constrained between 1 and 5
  - Foreign key CASCADE deletion on service_items when parent service deleted
  - Unique constraints on usernames, category names, section keys, setting keys
  
  ## 5. Initial Data
  
  The migration seeds:
  - Default admin user (username: admin)
  - Four default portfolio categories: Cils, Sourcils, Lèvres, Maquillage
  
  ## Important Notes
  
  - All timestamps use timestamptz for timezone awareness
  - Uses gen_random_uuid() for secure UUID generation
  - All IF NOT EXISTS checks prevent migration re-run errors
  - Password hash format: custom application-specific hash
  - All text fields use appropriate defaults to prevent null issues
  - Array type used for service benefits to store multiple items
*/

-- ============================================
-- 1. ADMIN_USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view their own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Admin users can update their own data"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Insert default admin user
INSERT INTO admin_users (username, password_hash, email)
VALUES ('admin', '2HwCnCl8UuPgZQxw:57667763:3416049', 'admin@harmoniecils.fr')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- 2. SERVICES TABLE
-- ============================================

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

-- ============================================
-- 3. SERVICE_ITEMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS service_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  label text NOT NULL,
  price text NOT NULL,
  description text,
  duration text DEFAULT '',
  benefits text[],
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

-- ============================================
-- 4. PORTFOLIO_CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS portfolio_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE portfolio_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON portfolio_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON portfolio_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON portfolio_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON portfolio_categories FOR DELETE
  TO authenticated
  USING (true);

-- Insert default categories
INSERT INTO portfolio_categories (name, order_index)
VALUES 
  ('Cils', 0),
  ('Sourcils', 1),
  ('Lèvres', 2),
  ('Maquillage', 3)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 5. PORTFOLIO_ITEMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  detailed_description text DEFAULT '',
  alt text NOT NULL,
  category text DEFAULT 'Cils' NOT NULL,
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

-- ============================================
-- 6. REVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  service_type text DEFAULT '' NOT NULL,
  is_published boolean DEFAULT false NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 7. PROMOTIONS TABLE
-- ============================================

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

-- ============================================
-- 8. ABOUT_CONTENT TABLE
-- ============================================

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

-- ============================================
-- 9. SITE_SETTINGS TABLE
-- ============================================

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

-- ============================================
-- 10. BOOKINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text NOT NULL,
  service_id uuid,
  service_name text NOT NULL,
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  message text DEFAULT '',
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert bookings"
  ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 11. PERFORMANCE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_service_items_service_id ON service_items(service_id);
CREATE INDEX IF NOT EXISTS idx_promotions_order ON promotions(order_index);
CREATE INDEX IF NOT EXISTS idx_services_order ON services(order_index);
CREATE INDEX IF NOT EXISTS idx_service_items_order ON service_items(order_index);
CREATE INDEX IF NOT EXISTS idx_portfolio_order ON portfolio_items(order_index);
CREATE INDEX IF NOT EXISTS idx_portfolio_category ON portfolio_items(category);
CREATE INDEX IF NOT EXISTS idx_about_order ON about_content(order_index);
CREATE INDEX IF NOT EXISTS idx_reviews_published ON reviews(is_published);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(preferred_date);
