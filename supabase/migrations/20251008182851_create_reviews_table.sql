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