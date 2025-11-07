-- RPC pour supprimer une promotion avec vérification admin
BEGIN;

CREATE OR REPLACE FUNCTION public.delete_promotion(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Accès refusé: admin requis' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.promotions WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_promotion(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_promotion(uuid) TO authenticated;

COMMIT;
