-- Add split morning/afternoon columns to business_hours (idempotent)
-- This aligns local schema with remote and frontend expectations.

alter table if exists public.business_hours add column if not exists open_time_morning time;
alter table if exists public.business_hours add column if not exists close_time_morning time;
alter table if exists public.business_hours add column if not exists open_time_afternoon time;
alter table if exists public.business_hours add column if not exists close_time_afternoon time;
