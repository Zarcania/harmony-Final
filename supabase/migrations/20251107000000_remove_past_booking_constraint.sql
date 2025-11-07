-- Remove the constraint that blocks past bookings
-- We keep the enforce_booking_window trigger to block future bookings beyond the window
-- This allows importing historical seed data while still protecting against too-far-future bookings

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_start_not_past_active;
