-- Add admin policy for service_items
CREATE POLICY "admin_service_items_all" ON "public"."service_items"
TO "authenticated"
USING ("public"."is_admin"())
WITH CHECK ("public"."is_admin"());
