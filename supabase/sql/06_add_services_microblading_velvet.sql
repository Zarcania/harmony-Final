-- Insert or get services and items for Microblading and Velvet Brows / Shading
-- Idempotent: checks existence by title (service) and label (item) before inserting

DO $$
DECLARE svc_id uuid;
BEGIN
  -- Microblading section
  SELECT id INTO svc_id FROM public.services WHERE title = 'Microblading' LIMIT 1;
  IF svc_id IS NULL THEN
    INSERT INTO public.services (title, icon, order_index)
    VALUES (
      'Microblading',
      'Wand2',
      (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.services)
    ) RETURNING id INTO svc_id;
  END IF;

  -- Items for Microblading
  IF NOT EXISTS (SELECT 1 FROM public.service_items WHERE service_id = svc_id AND label = 'Microblading') THEN
    INSERT INTO public.service_items (service_id, label, price, description, duration, order_index)
    VALUES (svc_id, 'Microblading', '170€', NULL, '', (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.service_items WHERE service_id = svc_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.service_items WHERE service_id = svc_id AND label = 'Retouche 1 à 3 mois') THEN
    INSERT INTO public.service_items (service_id, label, price, description, duration, order_index)
    VALUES (svc_id, 'Retouche 1 à 3 mois', '50€', NULL, '', (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.service_items WHERE service_id = svc_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.service_items WHERE service_id = svc_id AND label = 'Retouche 6 mois') THEN
    INSERT INTO public.service_items (service_id, label, price, description, duration, order_index)
    VALUES (svc_id, 'Retouche 6 mois', '70€', NULL, '', (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.service_items WHERE service_id = svc_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.service_items WHERE service_id = svc_id AND label = 'Retouche 12 mois') THEN
    INSERT INTO public.service_items (service_id, label, price, description, duration, order_index)
    VALUES (svc_id, 'Retouche 12 mois', '90€', NULL, '', (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.service_items WHERE service_id = svc_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.service_items WHERE service_id = svc_id AND label = 'Combo Blading + Velvet Brows') THEN
    INSERT INTO public.service_items (service_id, label, price, description, duration, order_index)
    VALUES (svc_id, 'Combo Blading + Velvet Brows', '200€', NULL, '', (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.service_items WHERE service_id = svc_id));
  END IF;

  -- Velvet Brows / Shading section
  SELECT id INTO svc_id FROM public.services WHERE title = 'Velvet Brows / Shading' LIMIT 1;
  IF svc_id IS NULL THEN
    INSERT INTO public.services (title, icon, order_index)
    VALUES (
      'Velvet Brows / Shading',
      'Brush',
      (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.services)
    ) RETURNING id INTO svc_id;
  END IF;

  -- Items for Velvet Brows / Shading
  IF NOT EXISTS (SELECT 1 FROM public.service_items WHERE service_id = svc_id AND label = 'Velvet Brows') THEN
    INSERT INTO public.service_items (service_id, label, price, description, duration, order_index)
    VALUES (svc_id, 'Velvet Brows', '180€', NULL, '', (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.service_items WHERE service_id = svc_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.service_items WHERE service_id = svc_id AND label = 'Retouche 1 à 3 mois') THEN
    INSERT INTO public.service_items (service_id, label, price, description, duration, order_index)
    VALUES (svc_id, 'Retouche 1 à 3 mois', '50€', NULL, '', (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.service_items WHERE service_id = svc_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.service_items WHERE service_id = svc_id AND label = 'Retouche 6 mois') THEN
    INSERT INTO public.service_items (service_id, label, price, description, duration, order_index)
    VALUES (svc_id, 'Retouche 6 mois', '70€', NULL, '', (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.service_items WHERE service_id = svc_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.service_items WHERE service_id = svc_id AND label = 'Retouche 12 mois') THEN
    INSERT INTO public.service_items (service_id, label, price, description, duration, order_index)
    VALUES (svc_id, 'Retouche 12 mois', '90€', NULL, '', (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.service_items WHERE service_id = svc_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.service_items WHERE service_id = svc_id AND label = 'Combo Blading + Velvet Brows') THEN
    INSERT INTO public.service_items (service_id, label, price, description, duration, order_index)
    VALUES (svc_id, 'Combo Blading + Velvet Brows', '200€', NULL, '', (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.service_items WHERE service_id = svc_id));
  END IF;
END $$;
