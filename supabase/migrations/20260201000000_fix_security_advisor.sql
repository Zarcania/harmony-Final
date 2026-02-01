-- Migration: Fix Supabase Security Advisor errors and warnings
-- Date: 2026-02-01
-- Fixes: RLS policies, user_metadata security, search_path, reviews permissions

-- ============================================================================
-- FIX 1: Enable RLS on tables that are missing it
-- ============================================================================

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIX 2: Add RLS policies for app_settings
-- ============================================================================

CREATE POLICY "app_settings_public_read" ON public.app_settings
  FOR SELECT USING (true);

CREATE POLICY "app_settings_admin_write" ON public.app_settings
  FOR ALL 
  TO authenticated
  USING (is_admin()) 
  WITH CHECK (is_admin());

-- ============================================================================
-- FIX 3: Replace user_metadata with app_metadata (SECURITY CRITICAL)
-- user_metadata is editable by users and should NEVER be used in RLS policies
-- ============================================================================

-- Drop insecure policies
DROP POLICY IF EXISTS "admin_write_service_items" ON public.service_items;
DROP POLICY IF EXISTS "admin_write_services" ON public.services;

-- Recreate using is_admin() which checks profiles.is_admin (secure)
CREATE POLICY "admin_write_service_items" ON public.service_items
  FOR ALL 
  TO authenticated
  USING (is_admin()) 
  WITH CHECK (is_admin());

CREATE POLICY "admin_write_services" ON public.services
  FOR ALL 
  TO authenticated
  USING (is_admin()) 
  WITH CHECK (is_admin());

-- ============================================================================
-- FIX 4: Set search_path on functions to prevent search_path attacks
-- ============================================================================

ALTER FUNCTION public.is_time_blocked_by_break 
  SET search_path TO 'public', 'extensions';

ALTER FUNCTION public.take_index_usage_snapshot 
  SET search_path TO 'public', 'extensions';

-- ============================================================================
-- FIX 5: Fix overly permissive RLS policy on reviews table
-- The table doesn't have user_id, so only admins should manage reviews
-- Public users can only read published reviews
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage reviews" ON public.reviews;
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_own_insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews_own_update" ON public.reviews;
DROP POLICY IF EXISTS "reviews_own_delete" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_all" ON public.reviews;

-- Public can only read published reviews
CREATE POLICY "reviews_public_read" ON public.reviews
  FOR SELECT 
  USING (is_published = true);

-- Only admins can insert, update, delete reviews
CREATE POLICY "reviews_admin_all" ON public.reviews
  FOR ALL 
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
