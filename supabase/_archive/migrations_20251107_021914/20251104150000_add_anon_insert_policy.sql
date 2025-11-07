-- Migration: Add RLS policy for anonymous INSERT on bookings
-- Gap É3: Allow anonymous users to create bookings with proper validation

-- Drop the policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "bookings_anon_insert" ON "public"."bookings";

-- Create the policy
CREATE POLICY "bookings_anon_insert" ON "public"."bookings" 
FOR INSERT TO "anon" 
WITH CHECK (
  -- Allow anonymous users to insert bookings with basic validation:
  -- 1. Status must be 'pending' or 'confirmed'
  -- 2. Start date must be in the future (prevents backdating)
  -- 3. User_id will be NULL (anonymous booking)
  "status" IN ('pending', 'confirmed')
  AND "preferred_date" >= CURRENT_DATE
  AND "user_id" IS NULL
);
