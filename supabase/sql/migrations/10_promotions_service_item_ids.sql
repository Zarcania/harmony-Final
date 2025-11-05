-- Ajoute un tableau d'UUIDs de prestations liées à chaque promotion
ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS service_item_ids uuid[];

-- Index facultatif pour la recherche par inclusion (GIST/GIN)
-- CREATE INDEX IF NOT EXISTS promotions_service_item_ids_gin ON public.promotions USING GIN (service_item_ids);
