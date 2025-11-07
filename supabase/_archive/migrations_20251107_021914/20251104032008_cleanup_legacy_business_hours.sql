-- Migration: Nettoyage des colonnes et tables legacy (AM/PM)
-- Date: 2025-11-04
-- Description: Suppression des colonnes open_time_morning/afternoon et de la table business_breaks

-- Supprimer les colonnes legacy de business_hours
ALTER TABLE public.business_hours 
  DROP COLUMN IF EXISTS open_time_morning,
  DROP COLUMN IF EXISTS close_time_morning,
  DROP COLUMN IF EXISTS open_time_afternoon,
  DROP COLUMN IF EXISTS close_time_afternoon;

-- Supprimer la table business_breaks (fonctionnalité pauses abandonnée)
DROP TABLE IF EXISTS public.business_breaks;

-- Commentaire pour documentation
COMMENT ON TABLE public.business_hours IS 'Horaires d''ouverture hebdomadaires simplifiés - un seul créneau par jour (open_time, close_time)';
