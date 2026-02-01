-- Correction encodage UTF-8 pour les services
TRUNCATE TABLE booking_items CASCADE;
TRUNCATE TABLE service_items CASCADE;
TRUNCATE TABLE services CASCADE;

INSERT INTO "public"."services" ("id", "title", "icon", "order_index", "created_at", "updated_at") VALUES
	('425c8c18-cea3-4e68-ad8c-a54f72dc8a8e', 'EXTENSIONS DE CILS - Naturel, Volume & poses à effet tendance', 'Eye', 0, '2025-10-22 00:36:20.928812+00', '2025-11-05 16:44:24.029+00'),
	('37bd0807-50cd-4b4b-87c0-0c62df920855', 'Formules Épilation', 'Heart', 4, '2025-10-29 01:54:17.517877+00', '2025-11-05 16:44:24.029+00'),
	('300a4d17-95d7-48de-be35-a9462ad8267a', 'Velvet Brows / Shading', 'Brush', 6, '2025-11-02 16:06:48.108111+00', '2025-11-05 16:44:24.03+00'),
	('5f89595c-aa0e-41e9-8da1-f07fda39a8d3', 'Microblading', 'Wand2', 5, '2025-11-02 16:06:48.108111+00', '2025-11-05 16:44:24.029+00'),
	('c189791c-2488-4b5d-8535-bf3ee6205442', 'Épilation au fil', 'Scissors', 3, '2025-10-22 00:36:20.928812+00', '2025-11-05 16:44:24.029+00'),
	('1ea99e4d-a362-46ff-a506-90ecc5aaf207', 'Remplissage ( à 2 semaines )', 'Sparkles', 2, '2025-10-29 01:54:17.517877+00', '2025-11-05 16:44:24.029+00'),
	('0731316f-aed9-4f0f-82b8-de0efe1b3dff', 'Remplissage ( à 3 semaines )', 'Eye', 8, '2025-11-05 16:44:58.762192+00', '2025-11-05 16:44:58.762192+00'),
	('68a39709-938f-4d5f-ab6a-664f7e971a02', 'Rehaussement de cils', 'Eye', 1, '2025-10-22 00:36:20.928812+00', '2025-11-05 16:53:58.533+00'),
	('beff24b6-e44b-45f3-a203-1cf811ecae86', 'Velvet Lips', 'Star', 7, '2025-11-05 15:42:40.370789+00', '2025-11-06 01:00:17.535+00');

INSERT INTO "public"."service_items" ("id", "service_id", "label", "price", "description", "duration", "benefits", "order_index", "created_at", "updated_at") VALUES
	('17322e94-f581-4c7e-8d66-7f2a40ecb485', 'c189791c-2488-4b5d-8535-bf3ee6205442', 'Sourcils', '12€', 'Épilation précise des sourcils au fil', '15 min', NULL, 0, '2025-10-22 00:36:20.928812+00', '2025-10-22 00:36:20.928812+00'),
	('f2d46b4f-7d71-47c0-bb75-57f45c84a8ff', 'c189791c-2488-4b5d-8535-bf3ee6205442', 'Lèvre', '8€', 'Épilation au fil de la lèvre supérieure', '10 min', NULL, 1, '2025-10-22 00:36:20.928812+00', '2025-10-22 00:36:20.928812+00'),
	('815fd399-9436-4073-bcce-5885a9d29920', '425c8c18-cea3-4e68-ad8c-a54f72dc8a8e', 'Pose cil à cil', '55€', 'La pose cil à cil est une pose 1?1?s naturelle qui consiste à? poser une extension de cil sur chaque cil naturel de l''œil. Elle se d??cline en plusieurs effets : L''effet œil de biche qui va permettre d''??tirer la forme naturelle de l''œil. L''effet open eyes qui va permettre d''ouvrir la forme naturelle de l''œil et de donner un effet d''agrandissement du regard permettant d''agrandissement de corriger les yeux tombants.', '1h30', NULL, 0, '2025-10-22 00:36:20.928812+00', '2025-10-22 00:36:20.928812+00'),
	('71aeb277-dc04-4a03-a15e-b65b040e7189', '425c8c18-cea3-4e68-ad8c-a54f72dc8a8e', 'Volume russe', '75€', 'Le volume russe est une technique avanc??e de pose d''extensions de cils. Contrairement au cil à? cil classique et la pose mixte, le volume russe revient à? poser des bouquets comportant beaucoup plus d''extensions sur le cil naturel Le nombre de D correspond au nombre d''extension dans le bouquet, plus il y en a dans un bouquet, plus le r??sultat sera intens??ment noir et fourni.', '2h', NULL, 1, '2025-10-22 00:36:20.928812+00', '2025-10-22 00:36:20.928812+00');
