-- >>> BEGIN FILE: 20251002205240_create_admin_content_tables.sql
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
-- <<< END FILE: 20251002205240_create_admin_content_tables.sql

-- >>> BEGIN FILE: 20251004171103_create_admin_users.sql
/*
  # Create Admin Users Table

  1. New Tables
    - `admin_users` - Stores admin credentials
      - `id` (uuid, primary key)
      - `username` (text, unique) - Admin username
      - `password_hash` (text) - Hashed password
      - `email` (text) - Admin email
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on admin_users table
    - Add policy for authenticated admin access
*/

-- Create admin_users table
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

-- Insert default admin user (password will be hashed in the application)
INSERT INTO admin_users (username, password_hash, email)
VALUES ('admin', '2HwCnCl8UuPgZQxw:57667763:3416049', 'admin@harmoniecils.fr')
ON CONFLICT (username) DO NOTHING;
-- <<< END FILE: 20251004171103_create_admin_users.sql

-- >>> BEGIN FILE: 20251008000000_add_service_item_details.sql
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
-- <<< END FILE: 20251008000000_add_service_item_details.sql

-- >>> BEGIN FILE: 20251008182548_add_portfolio_categories.sql
/*
  # Add Portfolio Categories

  1. Changes
    - Add `category` column to `portfolio_items` table
    - Categories: 'Cils', 'Sourcils', 'LÃ¨vres', 'Maquillage'
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
      CHECK (category IN ('Cils', 'Sourcils', 'LÃ¨vres', 'Maquillage'));
  END IF;
END $$;
-- <<< END FILE: 20251008182548_add_portfolio_categories.sql

-- >>> BEGIN FILE: 20251008182559_add_duration_to_service_items.sql
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
-- <<< END FILE: 20251008182559_add_duration_to_service_items.sql

-- >>> BEGIN FILE: 20251008182851_create_reviews_table.sql
/*
  # Create Reviews Table

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `client_name` (text) - Name of the client
      - `rating` (integer) - Rating from 1 to 5
      - `comment` (text) - Review comment
      - `service_type` (text) - Type of service received
      - `is_published` (boolean) - Whether review is visible publicly
      - `order_index` (integer) - Display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `reviews` table
    - Add policy for public read access to published reviews
    - Add policy for authenticated admin users to manage reviews
  
  3. Notes
    - Reviews are manually added by admin
    - Only published reviews are visible to public
    - Rating constraint ensures values between 1 and 5
*/

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

-- Public can read published reviews
CREATE POLICY "Public can read published reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Authenticated users can manage all reviews (for admin)
CREATE POLICY "Authenticated users can manage reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
-- <<< END FILE: 20251008182851_create_reviews_table.sql

-- >>> BEGIN FILE: 20251008184059_create_portfolio_categories_table.sql
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
SELECT 'LÃ¨vres', 2
WHERE NOT EXISTS (SELECT 1 FROM portfolio_categories WHERE name = 'LÃ¨vres');

INSERT INTO portfolio_categories (name, order_index)
SELECT 'Maquillage', 3
WHERE NOT EXISTS (SELECT 1 FROM portfolio_categories WHERE name = 'Maquillage');
-- <<< END FILE: 20251008184059_create_portfolio_categories_table.sql

-- >>> BEGIN FILE: 20251008185121_remote_baseline.sql
-- Placeholder: migration dÃ©jÃ  appliquÃ©e en remote (20251008185121)
-- Aucun changement. Sert uniquement Ã  aligner lâ€™historique local/remote.
-- Safe to keep.
-- <<< END FILE: 20251008185121_remote_baseline.sql

-- >>> BEGIN FILE: 20251008185201_remote_baseline.sql
-- Placeholder: migration dÃ©jÃ  appliquÃ©e en remote (20251008185201)
-- Aucun changement. Sert uniquement Ã  aligner lâ€™historique local/remote.
-- Safe to keep.
-- <<< END FILE: 20251008185201_remote_baseline.sql

-- >>> BEGIN FILE: 20251008185451_create_complete_harmonie_cils_schema.sql
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
  - `price` (text, required) - Price display (e.g., "80â‚¬", "Ã€ partir de 120â‚¬")
  - `description` (text, optional) - Detailed service description
  - `duration` (text, default '') - Service duration (e.g., "1h30", "2h")
  - `benefits` (text[], optional) - Array of service benefits/features
  - `order_index` (integer, default 0) - Display order within category
  - `created_at` (timestamptz, default now) - Creation timestamp
  - `updated_at` (timestamptz, default now) - Last update timestamp
  
  ### portfolio_categories
  Stores portfolio image categories for filtering
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text, unique, required) - Category name (Cils, Sourcils, LÃ¨vres, Maquillage)
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
  - Four default portfolio categories: Cils, Sourcils, LÃ¨vres, Maquillage
  
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
  ('LÃ¨vres', 2),
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
-- <<< END FILE: 20251008185451_create_complete_harmonie_cils_schema.sql

-- >>> BEGIN FILE: 20251008194323_fix_portfolio_categories_rls.sql
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
-- <<< END FILE: 20251008194323_fix_portfolio_categories_rls.sql

-- >>> BEGIN FILE: 20251008194951_enable_supabase_auth.sql
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
-- <<< END FILE: 20251008194951_enable_supabase_auth.sql

-- >>> BEGIN FILE: 20251008213011_update_bookings_table_structure.sql
/*
  # Mise Ã  jour de la structure de la table bookings

  1. Modifications
    - Ajout de la colonne `client_first_name` (prÃ©nom sÃ©parÃ© du nom)
    - Renommage de `preferred_date` en `date` via une vue
    - Renommage de `preferred_time` en `time` via une vue
    - Renommage de `service_name` en `service` via une vue

  2. CompatibilitÃ©
    - Garde la structure originale intacte
    - Utilise des colonnes calculÃ©es pour la compatibilitÃ©

  Note: Cette migration adapte la table existante pour fonctionner avec le nouveau systÃ¨me de gestion des rendez-vous
*/

-- Ajouter la colonne client_first_name si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'client_first_name'
  ) THEN
    ALTER TABLE bookings ADD COLUMN client_first_name text DEFAULT '';
  END IF;
END $$;

-- Mettre Ã  jour les anciennes donnÃ©es (sÃ©parer prÃ©nom et nom si besoin)
UPDATE bookings 
SET client_first_name = split_part(client_name, ' ', 1)
WHERE client_first_name = '' OR client_first_name IS NULL;

-- Rendre client_first_name NOT NULL aprÃ¨s mise Ã  jour
ALTER TABLE bookings ALTER COLUMN client_first_name SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN client_first_name SET DEFAULT '';
-- <<< END FILE: 20251008213011_update_bookings_table_structure.sql

-- >>> BEGIN FILE: 20251008214033_fix_bookings_rls_select_policy.sql
/*
  # Correction des politiques RLS pour la lecture des rendez-vous

  1. Modifications
    - Ajouter une politique SELECT pour les utilisateurs anonymes (anon)
    - Permet aux visiteurs du site de voir les crÃ©neaux disponibles
    - Les utilisateurs authentifiÃ©s (admins) gardent leur accÃ¨s complet

  2. SÃ©curitÃ©
    - Les utilisateurs anonymes peuvent lire les rendez-vous (pour voir les crÃ©neaux disponibles)
    - Les utilisateurs anonymes peuvent crÃ©er des rendez-vous (rÃ©servations publiques)
    - Seuls les utilisateurs authentifiÃ©s peuvent modifier/supprimer

  Note: Cette correction permet aux visiteurs du site de voir les crÃ©neaux disponibles
  et Ã  l'admin de voir tous les rendez-vous dans le planning.
*/

-- Supprimer l'ancienne politique SELECT restrictive si elle existe
DROP POLICY IF EXISTS "Anyone can view bookings" ON bookings;

-- CrÃ©er une nouvelle politique SELECT pour tout le monde (anon + authenticated)
CREATE POLICY "Anyone can view bookings"
  ON bookings FOR SELECT
  TO anon, authenticated
  USING (true);
-- <<< END FILE: 20251008214033_fix_bookings_rls_select_policy.sql

-- >>> BEGIN FILE: 20251009200220_remote_baseline.sql
-- Placeholder: migration dÃ©jÃ  appliquÃ©e en remote (20251009200220)
-- Aucun changement. Sert uniquement Ã  aligner lâ€™historique local/remote.
-- Safe to keep.
-- <<< END FILE: 20251009200220_remote_baseline.sql

-- >>> BEGIN FILE: 20251009200440_add_email_notifications_system.sql
/*
  # SystÃ¨me de notifications par email

  1. Nouvelles Tables
    - `email_logs`
      - `id` (uuid, primary key) - Identifiant unique
      - `booking_id` (uuid, foreign key) - RÃ©fÃ©rence Ã  la rÃ©servation
      - `email_type` (text) - Type d'email (confirmation, reminder)
      - `recipient_email` (text) - Email du destinataire
      - `sent_at` (timestamptz) - Date et heure d'envoi
      - `status` (text) - Statut de l'envoi (sent, failed)
      - `error_message` (text) - Message d'erreur si Ã©chec
      - `created_at` (timestamptz) - Date de crÃ©ation
    
    - `cancellation_tokens`
      - `id` (uuid, primary key) - Identifiant unique
      - `booking_id` (uuid, foreign key) - RÃ©fÃ©rence Ã  la rÃ©servation
      - `token` (text, unique) - Token de sÃ©curitÃ© pour l'annulation
      - `expires_at` (timestamptz) - Date d'expiration du token
      - `used_at` (timestamptz) - Date d'utilisation du token (null si non utilisÃ©)
      - `created_at` (timestamptz) - Date de crÃ©ation

  2. SÃ©curitÃ©
    - Enable RLS sur les deux tables
    - Politiques restrictives pour protÃ©ger les donnÃ©es sensibles
    - Les tokens sont sÃ©curisÃ©s et ont une durÃ©e de vie limitÃ©e

  3. Notes Importantes
    - Les logs permettent de tracer tous les emails envoyÃ©s
    - Les tokens permettent l'annulation sÃ©curisÃ©e sans authentification
    - Les tokens expirent aprÃ¨s la date du rendez-vous
*/

-- CrÃ©er la table des logs d'emails
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  email_type text NOT NULL CHECK (email_type IN ('confirmation', 'reminder')),
  recipient_email text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text NOT NULL CHECK (status IN ('sent', 'failed')) DEFAULT 'sent',
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- CrÃ©er la table des tokens d'annulation
CREATE TABLE IF NOT EXISTS cancellation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- CrÃ©er un index pour amÃ©liorer les performances
CREATE INDEX IF NOT EXISTS idx_email_logs_booking_id ON email_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_cancellation_tokens_token ON cancellation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_cancellation_tokens_booking_id ON cancellation_tokens(booking_id);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_tokens ENABLE ROW LEVEL SECURITY;

-- Politique pour email_logs: Seuls les admins peuvent lire les logs
CREATE POLICY "Admins can view all email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'admin'
        OR auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- Politique pour cancellation_tokens: Personne ne peut lire directement
-- Les tokens seront validÃ©s via une Edge Function
CREATE POLICY "No direct access to cancellation tokens"
  ON cancellation_tokens
  FOR SELECT
  TO authenticated
  USING (false);

-- Ajouter une colonne pour tracker si le reminder a Ã©tÃ© envoyÃ©
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'reminder_sent'
  ) THEN
    ALTER TABLE bookings ADD COLUMN reminder_sent boolean DEFAULT false;
  END IF;
END $$;

-- Fonction pour gÃ©nÃ©rer un token de sÃ©curitÃ©
CREATE OR REPLACE FUNCTION generate_cancellation_token(p_booking_id uuid, p_expires_at timestamptz)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
BEGIN
  -- GÃ©nÃ©rer un token alÃ©atoire sÃ©curisÃ©
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- InsÃ©rer le token dans la table
  INSERT INTO cancellation_tokens (booking_id, token, expires_at)
  VALUES (p_booking_id, v_token, p_expires_at);
  
  RETURN v_token;
END;
$$;
-- <<< END FILE: 20251009200440_add_email_notifications_system.sql

-- >>> BEGIN FILE: 20251013000000_add_promotion_fields.sql
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
  original_price = '115â‚¬',
  badge = 'Nouveau',
  icon = 'Sparkles'
WHERE title = 'PremiÃ¨re visite' AND original_price IS NULL;

UPDATE promotions SET 
  original_price = '90â‚¬',
  badge = 'Populaire',
  icon = 'Heart'
WHERE title = 'Pack BeautÃ©' AND original_price IS NULL;

UPDATE promotions SET 
  original_price = '120â‚¬',
  badge = 'Premium',
  icon = 'Crown'
WHERE title = 'Premium' AND original_price IS NULL;

UPDATE promotions SET 
  original_price = '140â‚¬',
  badge = 'LimitÃ©',
  icon = 'Gift'
WHERE title = 'Duo Complice' AND original_price IS NULL;
-- <<< END FILE: 20251013000000_add_promotion_fields.sql

-- >>> BEGIN FILE: 20251014120000_add_cancellation_and_business_hours.sql
--
-- Migration: add cancellation token + RPC, business hours and closures
-- Date: 2025-10-14
--

-- 1) Bookings: add cancellation columns if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cancellation_token'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cancellation_token uuid UNIQUE DEFAULT gen_random_uuid();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'canceled_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN canceled_at timestamptz;
  END IF;
END $$;

-- Helpful index if UNIQUE wasn't created (guarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_bookings_cancellation_token'
  ) THEN
    CREATE INDEX idx_bookings_cancellation_token ON bookings(cancellation_token);
  END IF;
END $$;

-- 2) RPC: public.cancel_booking(p_token uuid)
-- Cancels a booking by token and returns a simple JSON payload for the UI
CREATE OR REPLACE FUNCTION public.cancel_booking(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_result jsonb;
BEGIN
  SELECT * INTO v_booking
  FROM bookings
  WHERE cancellation_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Lien d''annulation invalide'
    );
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Ce rendez-vous a dÃ©jÃ  Ã©tÃ© annulÃ©',
      'booking', jsonb_build_object(
        'service', v_booking.service_name,
        'date', to_char(v_booking.preferred_date, 'YYYY-MM-DD'),
        'time', v_booking.preferred_time
      )
    );
  END IF;

  -- Mark as cancelled
  UPDATE bookings
  SET status = 'cancelled',
      canceled_at = now(),
      updated_at = now()
  WHERE id = v_booking.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Votre rendez-vous a bien Ã©tÃ© annulÃ©',
    'booking', jsonb_build_object(
      'service', v_booking.service_name,
      'date', to_char(v_booking.preferred_date, 'YYYY-MM-DD'),
      'time', v_booking.preferred_time
    )
  );
END;
$$;

-- Allow anonymous execution (used by public cancellation page)
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated;

-- 3) Business hours configuration
CREATE TABLE IF NOT EXISTS public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = lundi (align with date-fns fr? 0-6 arbitrary)
  open_time time,
  close_time time,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_hours_time_check CHECK (
    (is_closed = true) OR (open_time IS NOT NULL AND close_time IS NOT NULL AND close_time > open_time)
  )
);

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'business_hours' AND policyname = 'Authenticated can read business hours'
  ) THEN
    CREATE POLICY "Authenticated can read business hours"
      ON public.business_hours FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'business_hours' AND policyname = 'Authenticated can manage business hours'
  ) THEN
    CREATE POLICY "Authenticated can manage business hours"
      ON public.business_hours FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Ensure single row per day (optional unique constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_business_hours_day'
  ) THEN
    ALTER TABLE public.business_hours ADD CONSTRAINT uniq_business_hours_day UNIQUE(day_of_week);
  END IF;
END $$;

-- 4) Closures (exceptional closures / vacations)
CREATE TABLE IF NOT EXISTS public.closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.closures ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'closures' AND policyname = 'Authenticated can read closures'
  ) THEN
    CREATE POLICY "Authenticated can read closures"
      ON public.closures FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'closures' AND policyname = 'Authenticated can manage closures'
  ) THEN
    CREATE POLICY "Authenticated can manage closures"
      ON public.closures FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Helpful index for date range queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_closures_range'
  ) THEN
    CREATE INDEX idx_closures_range ON public.closures(start_date, end_date);
  END IF;
END $$;
-- <<< END FILE: 20251014120000_add_cancellation_and_business_hours.sql

-- >>> BEGIN FILE: 20251018110000_create_get_available_slots.sql
-- Create RPC to compute available slots per day (30-min steps)
-- Inputs:
--   p_date text or date (YYYY-MM-DD)
--   p_service_id uuid (optional, reserved for future duration-based logic)
-- Output: text[] of 'HH:MM' sorted ascending, Europe/Paris future-only for current day

create or replace function public.get_available_slots(p_date text, p_service_id uuid default null)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date := to_date(p_date, 'YYYY-MM-DD');
  v_isodow int := extract(isodow from v_date); -- 1(lundi)..7(dimanche)
  v_dow_for_bh int := v_isodow - 1;            -- our business_hours uses 0=lundi
  v_open time;
  v_close time;
  v_closed boolean := false;
  v_is_date_closed boolean := false;
  v_now_paris time := (now() at time zone 'Europe/Paris')::time;
  v_today_paris date := (now() at time zone 'Europe/Paris')::date;
  v_slots text[] := '{}';
begin
  -- Get business hours for that day
  select 
    coalesce(open_time, null)::time,
    coalesce(close_time, null)::time,
    coalesce(closed, is_closed, false)
  into v_open, v_close, v_closed
  from business_hours
  where day_of_week = v_dow_for_bh
  limit 1;

  if v_closed is null then
    v_closed := true; -- no row = considered closed
  end if;

  -- Check closures
  select exists (
    select 1 from closures c
    where v_date between c.start_date and c.end_date
  ) into v_is_date_closed;

  if v_closed or v_open is null or v_close is null or v_is_date_closed then
    return v_slots; -- empty
  end if;

  -- Generate 30-min slots between open and close (exclusive of end)
  with s as (
    select generate_series(
      (v_date::timestamp + v_open::interval),
      (v_date::timestamp + v_close::interval - interval '30 minutes'),
      interval '30 minutes'
    ) as ts
  ),
  s2 as (
    -- remove past times if same Paris day
    select to_char(ts::time, 'HH24:MI') as hhmm
    from s
    where case when v_date = v_today_paris then (ts::time > v_now_paris) else true end
  ),
  booked as (
    select b.preferred_time as hhmm
    from bookings b
    where b.preferred_date = v_date
      and coalesce(b.status, 'pending') <> 'cancelled'
  )
  select coalesce(array_agg(hhmm order by hhmm), '{}') into v_slots
  from (
    select s2.hhmm
    from s2
    where not exists (
      select 1 from booked b where b.hhmm = s2.hhmm
    )
  ) x;

  return v_slots;
end;
$$;

grant execute on function public.get_available_slots(text, uuid) to anon, authenticated;
-- <<< END FILE: 20251018110000_create_get_available_slots.sql

-- >>> BEGIN FILE: 20251021111000_align_business_hours_is_closed.sql
-- Align business_hours schema with frontend expectations (is_closed boolean) and constraints
-- Safe to run multiple times (guards for existing objects). Run in production to fix 42703 errors.

BEGIN;

-- 1) Ensure column is_closed exists and contains correct values; handle legacy 'closed' column
DO $$
DECLARE
  has_is_closed boolean;
  has_closed boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='business_hours' AND column_name='is_closed'
  ) INTO has_is_closed;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='business_hours' AND column_name='closed'
  ) INTO has_closed;

  IF has_closed AND NOT has_is_closed THEN
    -- Simple rename if legacy column exists and new one doesn't
    EXECUTE 'ALTER TABLE public.business_hours RENAME COLUMN "closed" TO is_closed';
  ELSIF NOT has_is_closed THEN
    -- Column missing entirely -> create with default false
    EXECUTE 'ALTER TABLE public.business_hours ADD COLUMN is_closed boolean NOT NULL DEFAULT false';
  END IF;

  -- If both existed (rare), merge data to is_closed then drop legacy
  IF has_closed AND has_is_closed THEN
    EXECUTE 'UPDATE public.business_hours SET is_closed = COALESCE(is_closed, false) OR COALESCE("closed", false)';
    -- Try drop legacy column safely
    BEGIN
      EXECUTE 'ALTER TABLE public.business_hours DROP COLUMN "closed"';
    EXCEPTION WHEN undefined_column THEN
      -- ignore
    END;
  END IF;
END $$;

-- 2) Ensure defaults and NOT NULL
ALTER TABLE public.business_hours ALTER COLUMN is_closed SET DEFAULT false;
ALTER TABLE public.business_hours ALTER COLUMN is_closed SET NOT NULL;

-- 3) Data normalization to satisfy time check: when is_closed = true, times must be NULL
UPDATE public.business_hours
SET open_time = NULL, close_time = NULL
WHERE is_closed = true AND (open_time IS NOT NULL OR close_time IS NOT NULL);

-- If open business row has missing times, mark as closed to avoid invalid state
UPDATE public.business_hours
SET is_closed = true, open_time = NULL, close_time = NULL
WHERE is_closed = false AND (open_time IS NULL OR close_time IS NULL);

-- If open_time >= close_time, mark closed (manual correction can follow in UI)
UPDATE public.business_hours
SET is_closed = true, open_time = NULL, close_time = NULL
WHERE is_closed = false AND open_time IS NOT NULL AND close_time IS NOT NULL AND open_time >= close_time;

-- 4) Recreate CHECK constraint (use NOT VALID first to avoid locking; then validate)
DO $$
BEGIN
  -- Drop existing check with known name if present
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'business_hours_time_check'
  ) THEN
    ALTER TABLE public.business_hours DROP CONSTRAINT business_hours_time_check;
  END IF;

  -- Create NOT VALID, then validate
  ALTER TABLE public.business_hours
    ADD CONSTRAINT business_hours_time_check
    CHECK ((is_closed = true) OR (open_time IS NOT NULL AND close_time IS NOT NULL AND close_time > open_time)) NOT VALID;

  ALTER TABLE public.business_hours VALIDATE CONSTRAINT business_hours_time_check;
END $$;

-- 5) Ensure unique row per day_of_week
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_business_hours_day'
  ) THEN
    ALTER TABLE public.business_hours ADD CONSTRAINT uniq_business_hours_day UNIQUE(day_of_week);
  END IF;
END $$;

COMMIT;

-- Tests rapides (exÃ©cuter dans SQL Editor si besoin):
-- SELECT day_of_week, open_time, close_time, is_closed FROM public.business_hours ORDER BY day_of_week;
-- La requÃªte REST suivante doit fonctionner ensuite (remplacer <PROJECT_URL> et <ANON_KEY>):
-- GET https://<PROJECT_URL>.supabase.co/rest/v1/business_hours?select=day_of_week,open_time,close_time,is_closed
-- Headers: apikey: <ANON_KEY>, Authorization: Bearer <ANON_KEY>
-- <<< END FILE: 20251021111000_align_business_hours_is_closed.sql

-- >>> BEGIN FILE: 20251022103000_enable_pgcrypto.sql
-- Enable required extensions for token generation
-- gen_random_bytes() and gen_random_uuid() are provided by pgcrypto

create extension if not exists pgcrypto;
-- <<< END FILE: 20251022103000_enable_pgcrypto.sql

-- >>> BEGIN FILE: 20251022104000_replace_generate_cancellation_token.sql
-- Ensure a simple token generator that doesn't rely on external secrets
-- Replaces any prior version that might RAISE when a secret is missing

create or replace function public.generate_cancellation_token(p_booking_id uuid, p_expires_at timestamptz)
returns text
language plpgsql
security definer
as $$
declare
  v_token text;
begin
  -- Requires pgcrypto (gen_random_bytes)
  v_token := encode(gen_random_bytes(32), 'hex');

  insert into public.cancellation_tokens (booking_id, token, expires_at)
  values (p_booking_id, v_token, p_expires_at);

  return v_token;
end;
$$;
-- <<< END FILE: 20251022104000_replace_generate_cancellation_token.sql

-- >>> BEGIN FILE: 20251022111000_public_read_and_seed_business_hours.sql
-- Open read access to business_hours and closures for public (anon)
-- and seed default hours if empty. Idempotent.

-- 1) RLS policies: allow SELECT to anon on business_hours & closures
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='business_hours' and policyname='Public can read business hours'
  ) then
    create policy "Public can read business hours"
      on public.business_hours for select
      to anon
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='closures' and policyname='Public can read closures'
  ) then
    create policy "Public can read closures"
      on public.closures for select
      to anon
      using (true);
  end if;
end $$;

-- 2) Seed defaults for business_hours if table is empty
do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.business_hours;
  if coalesce(v_count,0) = 0 then
    insert into public.business_hours (day_of_week, open_time, close_time, is_closed)
    values
      (0, time '09:00', time '18:00', false), -- lundi
      (1, time '09:00', time '18:00', false), -- mardi
      (2, time '09:00', time '18:00', false), -- mercredi
      (3, time '09:00', time '18:00', false), -- jeudi
      (4, time '09:00', time '18:00', false), -- vendredi
      (5, time '09:00', time '13:00', false), -- samedi
      (6, null, null, true);                   -- dimanche fermÃ©
  end if;
end $$;

-- 3) Optional: seed minimal services/service_items if empty (to populate Prestations)
do $$
declare
  v_svc_count int;
  v_sid uuid;
begin
  select count(*) into v_svc_count from public.services;
  if coalesce(v_svc_count,0) = 0 then
    -- Example service sections
    insert into public.services (id, title, icon, order_index)
    values
      (gen_random_uuid(), 'Ã‰pilation au fil', 'Scissors', 0),
      (gen_random_uuid(), 'Poses & Volumes',  'Eye',      1),
      (gen_random_uuid(), 'Rehaussement',     'Eye',      2);

    -- Items for first section
    select id into v_sid from public.services where title='Ã‰pilation au fil' limit 1;
    insert into public.service_items (service_id, label, price, description, duration, order_index)
    values
      (v_sid, 'Sourcils', '12â‚¬', 'Ã‰pilation prÃ©cise des sourcils au fil', '15 min', 0),
      (v_sid, 'LÃ¨vre',    '8â‚¬',  'Ã‰pilation au fil de la lÃ¨vre supÃ©rieure', '10 min', 1);

    -- Items for second section
    select id into v_sid from public.services where title='Poses & Volumes' limit 1;
    insert into public.service_items (service_id, label, price, description, duration, order_index)
    values
      (v_sid, 'Pose cil Ã  cil', '55â‚¬', 'Pose naturelle pour un regard sublimÃ©', '1h30', 0),
      (v_sid, 'Volume russe',   '75â‚¬', 'Volume intense pour un effet glamour', '2h', 1);

    -- Items for third section
    select id into v_sid from public.services where title='Rehaussement' limit 1;
    insert into public.service_items (service_id, label, price, description, duration, order_index)
    values
      (v_sid, 'Rehaussement de cils', '40â‚¬', 'Courbure naturelle et durable des cils', '45 min', 0);
  end if;
end $$;
-- <<< END FILE: 20251022111000_public_read_and_seed_business_hours.sql

-- >>> BEGIN FILE: 20251022123000_prevent_duplicate_start_times.sql
-- Prevent exact duplicate start-times for active bookings (excluding cancelled)
-- This avoids double-booking at the same start time, while keeping cancelled slots reusable.
-- Note: This does not enforce overlap for multi-slot durations; that is handled client-side for now.

create unique index if not exists uniq_bookings_start_active
  on public.bookings(preferred_date, preferred_time)
  where status is distinct from 'cancelled';
-- <<< END FILE: 20251022123000_prevent_duplicate_start_times.sql

-- >>> BEGIN FILE: 20251022130000_enforce_non_overlapping_bookings.sql
-- Harden scheduling: duration-aware, to-the-second non-overlap using EXCLUDE constraint
-- 1) Ensure required extension for boolean equality with GiST
create extension if not exists btree_gist;

-- 2) Add duration_minutes to bookings (default 60)
alter table public.bookings
  add column if not exists duration_minutes integer not null default 60;

-- 3) Create an exclusion constraint preventing overlaps for non-cancelled bookings
--    We consider the half-open range [start, end) built from preferred_date + preferred_time and duration_minutes.
--    We use a boolean expression (status is distinct from 'cancelled') with equality to scope the constraint to active rows.
--    Note: this requires btree_gist for boolean equality support in GiST.

alter table public.bookings
  add constraint bookings_no_overlap_excl
  exclude using gist (
    tsrange(
      (preferred_date::timestamp + preferred_time),
      (preferred_date::timestamp + preferred_time + (duration_minutes::text || ' minutes')::interval),
      '[)'
    ) with &&,
    (status is distinct from 'cancelled') with =
  );
-- <<< END FILE: 20251022130000_enforce_non_overlapping_bookings.sql

-- >>> BEGIN FILE: 20251023120500_get_booked_slots_fn.sql
-- Expose crÃ©neaux rÃ©servÃ©s pour une date au public via RPC sÃ©curisÃ©
create or replace function public.get_booked_slots(p_date date)
returns table (
  preferred_time text,
  duration_minutes integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    case
      when (preferred_time::text) ~ '^[0-2][0-9]:[0-5][0-9](:[0-5][0-9])?$'
        then to_char((preferred_time::text)::time, 'HH24:MI')
      else substring(preferred_time::text from 1 for 5)
    end as preferred_time,
    coalesce(duration_minutes, 60) as duration_minutes
  from public.bookings
  where preferred_date = p_date
    and coalesce(status, 'confirmed') <> 'cancelled';
$$;

-- Droits d'exÃ©cution pour les rÃ´les publics (visiteurs) et authentifiÃ©s
grant execute on function public.get_booked_slots(date) to anon, authenticated;
-- <<< END FILE: 20251023120500_get_booked_slots_fn.sql

-- >>> BEGIN FILE: 20251023121500_fix_public_read_grants.sql
--
-- Fix public read grants for content tables (+ keep RLS in place)
-- Contexte: erreurs 403 "permission denied for table service_items" cÃ´tÃ© PostgREST
-- Cause: privilÃ¨ges SELECT manquants pour les rÃ´les anon/authenticated, malgrÃ© des policies RLS de lecture.
-- Solution: accorder explicitement SELECT aux rÃ´les publics sur les tables de contenu
-- et s'assurer de l'usage du schÃ©ma public. Les policies RLS existantes restent actives.
--

-- 1) Le front utilise les rÃ´les Supabase "anon" (visiteurs) et "authenticated" (utilisateurs connectÃ©s)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2) Accorder SELECT sur les tables de contenu lues par le site (pages publiques)
GRANT SELECT ON TABLE public.services              TO anon, authenticated;
GRANT SELECT ON TABLE public.service_items         TO anon, authenticated;
GRANT SELECT ON TABLE public.portfolio_items       TO anon, authenticated;
GRANT SELECT ON TABLE public.portfolio_categories  TO anon, authenticated;
GRANT SELECT ON TABLE public.promotions            TO anon, authenticated;
GRANT SELECT ON TABLE public.reviews               TO anon, authenticated;
GRANT SELECT ON TABLE public.about_content         TO anon, authenticated;
GRANT SELECT ON TABLE public.site_settings         TO anon, authenticated;
-- Si prÃ©sent: horaires d'ouverture consultÃ©s publiquement
DO $$
BEGIN
  IF to_regclass('public.business_hours') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON TABLE public.business_hours TO anon, authenticated';
  END IF;
END$$;

-- 3) Garantir la politique RLS de lecture publique sur service_items (idempotent)
ALTER TABLE IF EXISTS public.service_items ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='service_items' AND policyname='service_items_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY service_items_public_read ON public.service_items FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END$$;

-- 4) Par prÃ©caution, faire de mÃªme pour les services
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='services' AND policyname='services_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY services_public_read ON public.services FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END$$;

-- 5) Optionnel: par dÃ©faut, toute nouvelle table crÃ©Ã©e par le propriÃ©taire (postgres)
--    donnera SELECT aux rÃ´les publics (Ã©vite la rÃ©gression lors d'ajouts ultÃ©rieurs).
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;

-- Fin
-- <<< END FILE: 20251023121500_fix_public_read_grants.sql

-- >>> BEGIN FILE: 20251023143000_db_maintenance_indexes_and_functions.sql
-- DB maintenance: drop duplicate indexes safely and harden function security context
-- - Non destructive: only drops true duplicates flagged by linter, keeps one canonical index
-- - Security: ensure SECURITY DEFINER functions have a fixed search_path

-- 1) Drop duplicate indexes on bookings (keep canonical names)
do $$
begin
  -- preferred_date: keep idx_bookings_date, drop idx_bookings_preferred_date if both exist
  if exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='idx_bookings_date')
     and exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='idx_bookings_preferred_date') then
    execute 'drop index if exists public.idx_bookings_preferred_date';
  end if;

  -- status: keep idx_bookings_status, drop bookings_status_idx if both exist
  if exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='idx_bookings_status')
     and exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='bookings_status_idx') then
    execute 'drop index if exists public.bookings_status_idx';
  end if;
end$$;

-- 2) Ensure generate_cancellation_token has a fixed search_path
--    Re-create with SET search_path = public (idempotent)
create or replace function public.generate_cancellation_token(p_booking_id uuid, p_expires_at timestamptz)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  -- GÃ©nÃ©rer un token alÃ©atoire sÃ©curisÃ©
  v_token := encode(gen_random_bytes(32), 'hex');

  -- InsÃ©rer le token dans la table
  insert into public.cancellation_tokens (booking_id, token, expires_at)
  values (p_booking_id, v_token, p_expires_at);

  return v_token;
end;
$$;

-- 3) For any existing public.bookings_compute_bounds overloads, set search_path = public
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as f
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'bookings_compute_bounds'
  loop
    execute format('alter function %s set search_path = public', r.f);
  end loop;
end$$;

-- Notes:
-- - Unused indexes flagged by linter are kept for now (INFO-level) to avoid premature removal.
-- - Multiple permissive policies: left unchanged (functional behavior OK); can be consolidated later if needed.
-- - Extension btree_gist in public: acknowledged (common on Supabase); no change.
-- <<< END FILE: 20251023143000_db_maintenance_indexes_and_functions.sql

-- >>> BEGIN FILE: 20251024090000_align_booking_schema.sql
-- Ajustements post-dump : retenir uniquement les colonnes du schÃ©ma fourni et mettre Ã  jour les fonctions dÃ©pendantes
begin;

alter table if exists public.bookings
  drop column if exists client_first_name;

create or replace function public.cancel_booking_with_log(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tok       cancellation_tokens%ROWTYPE;
  v_booking   bookings%ROWTYPE;
begin
  select * into v_tok from public.cancellation_tokens where token = p_token for update;
  if not found then
    return jsonb_build_object('success', false, 'code', 'invalid_or_expired_token', 'message', 'Token introuvable');
  end if;

  if v_tok.used_at is not null or (v_tok.expires_at is not null and v_tok.expires_at < now()) then
    return jsonb_build_object('success', false, 'code', 'invalid_or_expired_token', 'message', 'Lien expirÃ© ou dÃ©jÃ  utilisÃ©');
  end if;

  select * into v_booking from public.bookings where id = v_tok.booking_id for update;
  if not found then
    return jsonb_build_object('success', false, 'code', 'invalid_payload', 'message', 'RÃ©servation introuvable');
  end if;

  update public.bookings
     set status = 'cancelled', canceled_at = now(), updated_at = now()
   where id = v_booking.id;

  update public.cancellation_tokens set used_at = now() where id = v_tok.id;

  insert into public.email_logs (booking_id, email_type, recipient_email, subject, status, sent_at)
  values (v_booking.id, 'cancellation', v_booking.client_email, 'Annulation de rendez-vous', 'sent', now());

  return jsonb_build_object(
    'success', true,
    'message', 'Votre rendez-vous a bien Ã©tÃ© annulÃ©',
    'booking', jsonb_build_object(
      'id', v_booking.id,
      'client_name', v_booking.client_name,
      'client_first_name', nullif(split_part(coalesce(v_booking.client_name, ''), ' ', 1), ''),
      'client_email', v_booking.client_email,
      'service_name', v_booking.service_name,
      'preferred_date', v_booking.preferred_date,
      'preferred_time', v_booking.preferred_time
    )
  );
exception when others then
  return jsonb_build_object('success', false, 'code', 'server_error', 'message', SQLERRM);
end;
$$;

grant execute on function public.cancel_booking_with_log(text) to anon, authenticated;

commit;
-- <<< END FILE: 20251024090000_align_booking_schema.sql

-- >>> BEGIN FILE: 20251024120000_setup_profiles_and_policies.sql
-- Idempotent setup for admin profiles, public read policies, and booked slots RPC
-- Created: 2025-10-24

-- 1) profiles table: links auth.users(id) with is_admin flag
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- attach trigger if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_profiles_updated_at'
  ) THEN
    CREATE TRIGGER trg_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- RLS
alter table public.profiles enable row level security;

-- policy: authenticated users can select their own profile row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_own'
  ) THEN
    CREATE POLICY profiles_select_own ON public.profiles
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- policy: admins can do everything on profiles
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where user_id = auth.uid()), false);
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_admin_all'
  ) THEN
    CREATE POLICY profiles_admin_all ON public.profiles
      FOR ALL TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- sync profile row on new signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 2) Public read policies for content tables (services, service_items, business_hours)
-- Services
alter table if exists public.services enable row level security;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'services_public_read'
  ) THEN
    CREATE POLICY services_public_read ON public.services
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Service Items
alter table if exists public.service_items enable row level security;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_items' AND policyname = 'service_items_public_read'
  ) THEN
    CREATE POLICY service_items_public_read ON public.service_items
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Business Hours
alter table if exists public.business_hours enable row level security;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'business_hours' AND policyname = 'business_hours_public_read'
  ) THEN
    CREATE POLICY business_hours_public_read ON public.business_hours
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- 3) RPC: get_booked_slots (security definer) for public read of booked slots
create or replace function public.get_booked_slots(p_date date)
returns table (
  preferred_time text,
  duration_minutes integer
)
language sql
security definer
set search_path = public
as $$
  select b.preferred_time::text, b.duration_minutes
  from public.bookings b
  where b.preferred_date = p_date
    and coalesce(b.status, 'confirmed') <> 'cancelled';
$$;

revoke all on function public.get_booked_slots(date) from public;
grant execute on function public.get_booked_slots(date) to anon, authenticated;

-- 4) Admin policies for write-only tables (example: promotions)

alter table if exists public.promotions enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'promotions' and policyname = 'promotions_public_read'
  ) then
    create policy promotions_public_read on public.promotions
      for select to anon, authenticated
      using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'promotions' and policyname = 'promotions_admin_write'
  ) then
    create policy promotions_admin_write on public.promotions
      for insert to authenticated
      with check (public.is_admin());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'promotions' and policyname = 'promotions_admin_update'
  ) then
    create policy promotions_admin_update on public.promotions
      for update to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'promotions' and policyname = 'promotions_admin_delete'
  ) then
    create policy promotions_admin_delete on public.promotions
      for delete to authenticated
      using (public.is_admin());
  end if;
end $$;

-- 5) Optional: helper to promote an admin by email (requires service role or owner), guarded by existing admins
create or replace function public.promote_admin(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- allow only if caller is already admin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  -- ensure profile row exists for the target email
  insert into public.profiles(user_id)
  select u.id
  from auth.users u
  where lower(u.email) = lower(p_email)
  on conflict (user_id) do nothing;

  -- promote to admin
  update public.profiles p
  set is_admin = true
  from auth.users u
  where lower(u.email) = lower(p_email)
    and p.user_id = u.id;
end;
$$;

-- NOTE: To bootstrap the first admin, set is_admin = true manually once:
-- update public.profiles set is_admin = true where user_id = '<YOUR_USER_ID>';
-- <<< END FILE: 20251024120000_setup_profiles_and_policies.sql

-- >>> BEGIN FILE: 20251025153000_public_to_anon.sql
-- Migrate all RLS policies from `TO public` to `TO anon` / `TO anon, authenticated`
-- Goal: only two runtime roles remain: anon (visiteur) and authenticated (admin si profiles.is_admin=true)
-- Idempotent: drops existing public-based policies then recreates with anon/authenticated
-- Date: 2025-10-25 15:30

-- 0) Safety: ensure admin model exists
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.is_admin = true
  );
$$;

-- 1) Promotions
drop policy if exists "Anyone can view promotions" on public.promotions;
create policy "Anyone can view promotions"
  on public.promotions for select
  to anon, authenticated
  using (true);

-- 2) Services
drop policy if exists "Anyone can view services" on public.services;
create policy "Anyone can view services"
  on public.services for select
  to anon, authenticated
  using (true);

-- 3) Service Items
drop policy if exists "Anyone can view service items" on public.service_items;
create policy "Anyone can view service items"
  on public.service_items for select
  to anon, authenticated
  using (true);

-- 4) Portfolio Items
drop policy if exists "Anyone can view portfolio items" on public.portfolio_items;
create policy "Anyone can view portfolio items"
  on public.portfolio_items for select
  to anon, authenticated
  using (true);

-- 5) About Content
drop policy if exists "Anyone can view about content" on public.about_content;
create policy "Anyone can view about content"
  on public.about_content for select
  to anon, authenticated
  using (true);

-- 6) Site Settings
drop policy if exists "Anyone can view site settings" on public.site_settings;
create policy "Anyone can view site settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

-- 7) Portfolio Categories
-- Drop any permissive public policies introduced by older migrations
-- Variants of names we observed:
drop policy if exists "Anyone can view categories" on public.portfolio_categories;
drop policy if exists "Public can view categories" on public.portfolio_categories;
drop policy if exists "Public can insert categories" on public.portfolio_categories;
drop policy if exists "Public can update categories" on public.portfolio_categories;
drop policy if exists "Public can delete categories" on public.portfolio_categories;
-- Also drop legacy authenticated-wildcard policies if present
drop policy if exists "Authenticated users can insert categories" on public.portfolio_categories;
drop policy if exists "Authenticated users can update categories" on public.portfolio_categories;
drop policy if exists "Authenticated users can delete categories" on public.portfolio_categories;

-- Recreate with anon read + authenticated admin writes
create policy "Anyone can view categories"
  on public.portfolio_categories for select
  to anon, authenticated
  using (true);

-- Ensure idempotency by dropping any prior policy with same name
drop policy if exists "Admins can insert categories" on public.portfolio_categories;
create policy "Admins can insert categories"
  on public.portfolio_categories for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update categories" on public.portfolio_categories;
create policy "Admins can update categories"
  on public.portfolio_categories for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete categories" on public.portfolio_categories;
create policy "Admins can delete categories"
  on public.portfolio_categories for delete
  to authenticated
  using (public.is_admin());

-- 8) Bookings public create (single clear policy)
-- Remove any legacy insert policy and set a single anonymous insert
drop policy if exists "Anyone can insert bookings" on public.bookings;
drop policy if exists bookings_public_create on public.bookings;
create policy bookings_public_create
  on public.bookings for insert
  to anon
  with check (true);

-- NOTE: Existing select/update/delete policies for bookings remain unchanged
-- (admins manage bookings via authenticated + specific policies already present in schema)
-- <<< END FILE: 20251025153000_public_to_anon.sql

-- >>> BEGIN FILE: 20251025180000_rls_refactor_and_security.sql
-- RLS refactor & security hardening
-- Date: 2025-10-25
-- This migration drops existing RLS policies in schema public and recreates a simplified, performant set
-- using (SELECT auth.uid()) and consolidated policies per role/action.

-- 1) Drop ALL existing policies in schema public (safest reset)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, schemaname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 2) Ensure RLS is enabled on relevant tables (idempotent)
ALTER TABLE IF EXISTS public.about_content       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.business_hours      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cancellation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.closures            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portfolio_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portfolio_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.promotions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.site_settings       ENABLE ROW LEVEL SECURITY;

-- Optionally force RLS (uncomment if you want to enforce RLS even for table owners)
-- ALTER TABLE public.bookings FORCE ROW LEVEL SECURITY;

-- 3) Recreate consolidated policies

-- services: public read
CREATE POLICY services_read_all
  ON public.services
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- service_items: public read
CREATE POLICY service_items_read_all
  ON public.service_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- promotions: public read, admin write
CREATE POLICY promotions_read_all
  ON public.promotions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY promotions_admin_insert
  ON public.promotions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY promotions_admin_update
  ON public.promotions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY promotions_admin_delete
  ON public.promotions
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- reviews: public read
CREATE POLICY reviews_read_all
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- business_hours: public read (needed for client slot calculations)
CREATE POLICY business_hours_read_all
  ON public.business_hours
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- closures: public read (allows client to avoid closed days)
CREATE POLICY closures_read_all
  ON public.closures
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- profiles: self read/update
CREATE POLICY profiles_select_self
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY profiles_update_self
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- bookings: public insert; admin select/update/delete
CREATE POLICY bookings_admin_select
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY bookings_public_insert
  ON public.bookings
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY bookings_admin_update
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY bookings_admin_delete
  ON public.bookings
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- admin_users: admins only (all)
CREATE POLICY admin_users_admin_all
  ON public.admin_users
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- email_logs: admin select/insert
CREATE POLICY email_logs_admin_select
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY email_logs_admin_insert
  ON public.email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- portfolio tables: public read, admin write
CREATE POLICY portfolio_categories_read_all
  ON public.portfolio_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY portfolio_categories_admin_write
  ON public.portfolio_categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY portfolio_items_read_all
  ON public.portfolio_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY portfolio_items_admin_write
  ON public.portfolio_items
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- about_content & site_settings: public read, admin write
CREATE POLICY about_content_read_all
  ON public.about_content
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY about_content_admin_write
  ON public.about_content
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY site_settings_read_all
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY site_settings_admin_write
  ON public.site_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- cancellation_tokens: no public access; allow admin ops if needed
CREATE POLICY cancellation_tokens_admin_all
  ON public.cancellation_tokens
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4) Security: fix function search_path for updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- (Optionnel) Exemple de trigger dâ€™usage:
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_trigger WHERE tgname = 'tr_bookings_updated_at'
--   ) THEN
--     CREATE TRIGGER tr_bookings_updated_at
--     BEFORE UPDATE ON public.bookings
--     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--   END IF;
-- END $$;
-- <<< END FILE: 20251025180000_rls_refactor_and_security.sql

-- >>> BEGIN FILE: 20251025180100_extension_btree_gist_plan.sql
-- Plan de dÃ©placement de lâ€™extension btree_gist vers le schÃ©ma "extensions"
-- IMPORTANT: OpÃ©ration de maintenance; Ã  rÃ©aliser hors heures de prod.
-- Ã‰tapes:
-- 1) CrÃ©er le schÃ©ma dâ€™accueil (inoffensif)
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2) VÃ©rifier les dÃ©pendances (Ã  lancer manuellement dans lâ€™Ã©diteur SQL)
-- SELECT objid::regclass AS dependent_object, refobjid::regclass AS referenced
-- FROM pg_depend d
-- JOIN pg_extension e ON d.refobjid = e.oid
-- WHERE e.extname = 'btree_gist';

-- 3) DÃ©placement (mÃ©thode recommandÃ©e: drop/create) â€” Ã€ DÃ‰COMMENTER en maintenance
-- DROP EXTENSION IF EXISTS btree_gist;
-- CREATE EXTENSION btree_gist WITH SCHEMA extensions;

-- 4) Rollback (en cas de souci)
-- DROP EXTENSION IF EXISTS btree_gist;
-- CREATE EXTENSION btree_gist WITH SCHEMA public;
-- <<< END FILE: 20251025180100_extension_btree_gist_plan.sql

-- >>> BEGIN FILE: 20251025180200_indexes_unused_review.sql
-- Revue des index potentiellement inutilisÃ©s (ne PAS exÃ©cuter en prod sans validation)
-- Utilisez EXPLAIN (ANALYZE, BUFFERS) et pg_stat_user_indexes avant toute suppression.

-- Exemples de requÃªtes EXPLAIN (adapter aux besoins):
-- EXPLAIN ANALYZE SELECT id FROM public.bookings WHERE status = 'confirmed';
-- EXPLAIN ANALYZE SELECT id FROM public.bookings WHERE preferred_date = '2025-10-25';
-- EXPLAIN ANALYZE SELECT id FROM public.service_items ORDER BY sort_order LIMIT 50;
-- EXPLAIN ANALYZE SELECT id FROM public.portfolio_items WHERE category_id = '...' ORDER BY sort_order;
-- EXPLAIN ANALYZE SELECT id FROM public.email_logs WHERE email = 'x@y.z' AND sent_at > now() - interval '7 days';
-- EXPLAIN ANALYZE SELECT booking_id FROM public.cancellation_tokens WHERE token = '...';
-- EXPLAIN ANALYZE SELECT id FROM public.bookings WHERE user_id = (SELECT auth.uid());

-- VÃ©rifier utilisation via stats (Ã  lancer cÃ´tÃ© lecture):
-- SELECT schemaname, relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan ASC, indexrelname;

-- Drops commentÃ©s (exÃ©cuter en staging d'abord, et privilÃ©gier CONCURRENTLY si nÃ©cessaire):
-- DROP INDEX IF EXISTS public.idx_bookings_status;
-- DROP INDEX IF EXISTS public.idx_bookings_date;
-- DROP INDEX IF EXISTS public.idx_service_items_order;
-- DROP INDEX IF EXISTS public.idx_portfolio_order;
-- DROP INDEX IF EXISTS public.idx_portfolio_category;
-- DROP INDEX IF EXISTS public.idx_email_logs_;
-- DROP INDEX IF EXISTS public.idx_cancellation_tokens_;
-- DROP INDEX IF EXISTS public.bookings_user_id_idx;
-- <<< END FILE: 20251025180200_indexes_unused_review.sql

