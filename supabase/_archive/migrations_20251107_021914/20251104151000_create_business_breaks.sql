-- Migration: Create business_breaks table
-- This table allows defining break periods during business hours

CREATE TABLE IF NOT EXISTS "public"."business_breaks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day_of_week" integer NOT NULL,
    "break_start" time without time zone,
    "break_end" time without time zone,
    "enabled" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "business_breaks_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);

ALTER TABLE "public"."business_breaks" OWNER TO "postgres";

-- Add primary key
ALTER TABLE ONLY "public"."business_breaks"
    ADD CONSTRAINT "business_breaks_pkey" PRIMARY KEY ("id");

-- Grant permissions
GRANT ALL ON TABLE "public"."business_breaks" TO "authenticated";
GRANT SELECT ON TABLE "public"."business_breaks" TO "anon";
GRANT ALL ON TABLE "public"."business_breaks" TO "service_role";

-- Enable RLS
ALTER TABLE "public"."business_breaks" ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view breaks
CREATE POLICY "Anyone can view business_breaks" ON "public"."business_breaks"
FOR SELECT TO anon, authenticated
USING (true);

-- Only authenticated users can manage breaks
CREATE POLICY "Only admins can manage business_breaks" ON "public"."business_breaks"
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.is_admin = true
  )
);
