-- Création de la table admin_breaks pour gérer les pauses/blocages de créneaux ponctuels
CREATE TABLE IF NOT EXISTS public.admin_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME, -- NULL = journée complète (si aucun RDV client)
  end_time TIME,   -- NULL = journée complète (si aucun RDV client)
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Contraintes
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_time_range CHECK (
    (start_time IS NULL AND end_time IS NULL) OR
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  )
);

-- Index pour améliorer les performances des requêtes par date
CREATE INDEX IF NOT EXISTS idx_admin_breaks_dates ON public.admin_breaks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_admin_breaks_created_by ON public.admin_breaks(created_by);

-- Commentaires pour documentation
COMMENT ON TABLE public.admin_breaks IS 'Pauses et blocages de créneaux horaires ponctuels définis par l''admin';
COMMENT ON COLUMN public.admin_breaks.start_time IS 'Horaire de début de la pause (NULL = toute la journée)';
COMMENT ON COLUMN public.admin_breaks.end_time IS 'Horaire de fin de la pause (NULL = toute la journée)';

-- Row Level Security (RLS)
ALTER TABLE public.admin_breaks ENABLE ROW LEVEL SECURITY;

-- Policy : Seul l'admin peut créer, modifier, supprimer
CREATE POLICY "Admin can manage breaks" ON public.admin_breaks
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Policy : Tout le monde peut voir les pauses (pour affichage des créneaux indisponibles)
CREATE POLICY "Public can view breaks" ON public.admin_breaks
  FOR SELECT
  USING (true);

-- Fonction helper pour vérifier si une date/heure chevauche une pause
CREATE OR REPLACE FUNCTION public.is_time_blocked_by_break(
  check_date DATE,
  check_time TIME,
  duration_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  has_break BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_breaks bb
    WHERE check_date BETWEEN bb.start_date AND bb.end_date
    AND (
      -- Pause journée complète
      (bb.start_time IS NULL AND bb.end_time IS NULL)
      OR
      -- Pause horaire qui chevauche le créneau demandé
      (
        bb.start_time IS NOT NULL 
        AND bb.end_time IS NOT NULL
        AND tsrange(
          (check_date || ' ' || bb.start_time)::TIMESTAMP,
          (check_date || ' ' || bb.end_time)::TIMESTAMP,
          '[)'
        ) && tsrange(
          (check_date || ' ' || check_time)::TIMESTAMP,
          (check_date || ' ' || check_time)::TIMESTAMP + (duration_minutes || ' minutes')::INTERVAL,
          '[)'
        )
      )
    )
  ) INTO has_break;
  
  RETURN has_break;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.is_time_blocked_by_break IS 'Vérifie si un créneau horaire est bloqué par une pause admin';
