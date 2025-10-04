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
