SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict musuNJ6JBuYJPpMUO7kdqfjyODCgvaUMeHT4QGmjLp4bPE8fNtoXkXJ9eAmY927

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: about_content; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."admin_users" ("id", "username", "password_hash", "email", "created_at", "updated_at") VALUES
	('f71909d2-3426-4e9e-bbd2-6c63964572e6', 'admin', '2HwCnCl8UuPgZQxw:57667763:3416049', 'admin@harmoniecils.fr', '2025-10-21 22:30:40.887715+00', '2025-10-21 22:30:40.887715+00');


--
-- Data for Name: booked_slots_public; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."booked_slots_public" ("day", "ts", "id") VALUES
	('2025-10-31', '["2025-10-31 15:30:00+00","2025-10-31 17:05:00+00")', '9f318503-88de-45f5-93ab-f4199cf1a736'),
	('2025-11-01', '["2025-11-01 09:00:00+00","2025-11-01 10:40:00+00")', '7157d1cf-b825-4a58-ae13-fba3ec90071e'),
	('2025-11-01', '["2025-11-01 11:30:00+00","2025-11-01 11:45:00+00")', '81365fdc-c3d1-441b-ae64-5b654c0620ad'),
	('2025-12-31', '["2025-12-31 07:30:00+00","2025-12-31 07:45:00+00")', '5f9334e8-7dc9-4d05-aed6-e774d270d715'),
	('2025-12-31', '["2025-12-31 08:10:00+00","2025-12-31 08:25:00+00")', '1d254131-e272-4d36-8f04-c777dc1dbd96');


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."bookings" ("id", "client_name", "client_email", "client_phone", "service_id", "service_name", "preferred_date", "preferred_time", "message", "status", "created_at", "updated_at", "reminder_sent", "cancellation_token", "canceled_at", "user_id", "duration_minutes", "start_at", "end_at", "ts", "period", "slot") VALUES
	('c1e30658-42cd-4ce9-bdac-f533adfc7423', 'Anthony Corradi', 'anthony.corradi24072001@gmail.com', '+33626445785', '815fd399-9436-4073-bcce-5885a9d29920', 'Pose cil à cil', '2025-10-30', '14:00', '', 'completed', '2025-10-29 03:01:21.932991+00', '2025-10-29 03:01:21.932991+00', false, 'ee646b8f-69d7-49be-82ee-e5d28dfabd31', NULL, NULL, 90, '2025-10-30 13:00:00', '2025-10-30 14:30:00', NULL, '["2025-10-30 13:00:00+00","2025-10-30 14:30:00+00")', '["2025-10-30 13:00:00+00","2025-10-30 14:30:00+00")'),
	('3222c5c8-5e5e-4929-b0f6-5c5f46ed82ac', 'Anthony Corradi', 'anthony.corradi24072001@gmail.com', '0626445785', '17322e94-f581-4c7e-8d66-7f2a40ecb485', 'Sourcils', '2025-10-30', '09:30', '', 'completed', '2025-10-29 03:48:41.090341+00', '2025-10-29 03:48:41.090341+00', false, '599dc3a5-18b7-4387-84da-ca7b04a465e4', NULL, NULL, 15, '2025-10-30 08:30:00', '2025-10-30 08:45:00', NULL, '["2025-10-30 08:30:00+00","2025-10-30 08:45:00+00")', '["2025-10-30 08:30:00+00","2025-10-30 08:45:00+00")'),
	('dd5b69ca-ecaa-48ec-ae23-e49636ebdd09', 'CAPUCINEEEEEE Corradi', 'anthony.corradi24072001@gmail.com', '06264457853', '17322e94-f581-4c7e-8d66-7f2a40ecb485', 'Sourcils + Lèvre + Menton', '2025-10-29', '16:30', '', 'completed', '2025-10-29 14:53:29.549474+00', '2025-10-29 14:53:29.549474+00', false, 'a674ac69-f625-42bd-8f57-84393d54e573', NULL, NULL, 35, '2025-10-29 15:30:00', '2025-10-29 16:05:00', NULL, '["2025-10-29 15:30:00+00","2025-10-29 16:05:00+00")', '["2025-10-29 15:30:00+00","2025-10-29 16:05:00+00")'),
	('01c43d13-aa47-4c72-b344-f57c5d91c65b', 'Test Anon', 'e2e.test@example.com', '+33123456789', '17322e94-f581-4c7e-8d66-7f2a40ecb485', 'Sourcils', '2025-12-31', '08:30', 'Test via SQL', 'confirmed', '2025-10-25 15:46:40.340677+00', '2025-10-25 15:46:40.340677+00', false, 'a40b59ec-0482-448b-87c7-3094e0d612f0', NULL, NULL, 15, '2025-12-31 07:30:00', '2025-12-31 07:45:00', '["2025-12-31 09:30:00+00","2025-12-31 09:45:00+00")', '["2025-12-31 07:30:00+00","2025-12-31 07:45:00+00")', '["2025-12-31 07:30:00+00","2025-12-31 07:45:00+00")'),
	('e57b284a-ff24-4807-8d1e-ce09e59e5e77', 'Test Anon', 'e2e.test@example.com', '', '17322e94-f581-4c7e-8d66-7f2a40ecb485', 'Sourcils', '2025-12-31', '09:10', '', 'confirmed', '2025-10-25 15:47:53.007974+00', '2025-10-25 15:47:53.007974+00', false, '926d8dc7-24bb-48ea-9ced-7254778f652a', NULL, NULL, 15, '2025-12-31 08:10:00', '2025-12-31 08:25:00', '["2025-12-31 10:10:00+00","2025-12-31 10:25:00+00")', '["2025-12-31 08:10:00+00","2025-12-31 08:25:00+00")', '["2025-12-31 08:10:00+00","2025-12-31 08:25:00+00")'),
	('23120f86-6381-4d02-9c8f-cef10191e11d', 'Corradi', 'anthony.corradi24072001@gmail.com', '+33626445785', NULL, 'Sourcils', '2025-10-23', '10:00', '', 'completed', '2025-10-22 11:05:33.093624+00', '2025-10-22 11:05:33.093624+00', false, 'b1c11338-1ba6-42a3-abc8-6666c2398fed', NULL, NULL, 60, '2025-10-23 08:00:00', '2025-10-23 09:00:00', '["2025-10-23 10:00:00+00","2025-10-23 11:00:00+00")', '["2025-10-23 08:00:00+00","2025-10-23 09:00:00+00")', '["2025-10-23 08:00:00+00","2025-10-23 09:00:00+00")'),
	('80fc6540-2691-4bfe-b668-2c95208b08dd', 'Corradi', 'anthony.corradi24072001@gmail.com', '+33626445785', NULL, 'Sourcils', '2025-10-23', '11:30', '', 'completed', '2025-10-23 08:49:47.46436+00', '2025-10-23 08:49:47.46436+00', false, 'c9edd58a-c481-4bba-b6b4-a30113dca128', NULL, NULL, 60, '2025-10-23 09:30:00', '2025-10-23 10:30:00', '["2025-10-23 11:30:00+00","2025-10-23 12:30:00+00")', '["2025-10-23 09:30:00+00","2025-10-23 10:30:00+00")', '["2025-10-23 09:30:00+00","2025-10-23 10:30:00+00")'),
	('85caeb4e-5a99-4334-964a-e940694b484a', 'Corradi', 'anthony.corradi24072001@gmail.com', '+33626445785', NULL, 'Sourcils', '2025-10-23', '12:30', '', 'completed', '2025-10-23 09:38:47.468667+00', '2025-10-23 09:38:47.468667+00', false, '20935562-628b-46d8-806e-28281c6f22d7', NULL, NULL, 60, '2025-10-23 10:30:00', '2025-10-23 11:30:00', '["2025-10-23 12:30:00+00","2025-10-23 13:30:00+00")', '["2025-10-23 10:30:00+00","2025-10-23 11:30:00+00")', '["2025-10-23 10:30:00+00","2025-10-23 11:30:00+00")'),
	('1dfb55c5-c9e9-4de5-8080-c6d2a2b5d0aa', 'Corradi', 'anthony.corradi24072001@gmail.com', '+33626445785', NULL, 'Sourcils', '2025-10-23', '14:00', '', 'completed', '2025-10-23 10:58:39.733805+00', '2025-10-23 10:58:39.733805+00', false, 'e8434a6d-49b0-4dc5-8f7c-7b74ccd05607', NULL, NULL, 60, '2025-10-23 12:00:00', '2025-10-23 13:00:00', '["2025-10-23 14:00:00+00","2025-10-23 15:00:00+00")', '["2025-10-23 12:00:00+00","2025-10-23 13:00:00+00")', '["2025-10-23 12:00:00+00","2025-10-23 13:00:00+00")'),
	('a3e2b754-c365-4f62-923c-843f3f227036', 'Anonymous', '', '', NULL, 'Anonymous booking', '2025-10-26', '09:00', '', 'completed', '2025-10-25 21:09:57.463435+00', '2025-10-25 21:09:57.463435+00', false, 'f996f174-5817-4b57-87ab-59d3bbab4361', NULL, NULL, 60, '2025-10-26 08:00:00', '2025-10-26 09:00:00', '["2025-10-26 09:00:00+00","2025-10-26 10:00:00+00")', '["2025-10-26 08:00:00+00","2025-10-26 09:00:00+00")', '["2025-10-26 08:00:00+00","2025-10-26 09:00:00+00")'),
	('dab9962a-1d06-41a6-894e-f4e510253021', 'Corradi', 'anthony.corradi24072001@gmail.com', '+33626445785', NULL, 'Sourcils', '2025-10-27', '16:00', '', 'completed', '2025-10-22 09:35:22.852785+00', '2025-10-22 09:35:22.852785+00', false, '4c341538-15a0-4763-8953-8225d892a6ab', NULL, NULL, 60, '2025-10-27 15:00:00', '2025-10-27 16:00:00', '["2025-10-27 17:00:00+00","2025-10-27 18:00:00+00")', '["2025-10-27 15:00:00+00","2025-10-27 16:00:00+00")', '["2025-10-27 15:00:00+00","2025-10-27 16:00:00+00")'),
	('16a5c0a8-398a-4792-a32a-9c10696b5037', 'Corradi', 'anthony.corradi24072001@gmail.com', '+33626445785', NULL, 'Sourcils', '2025-10-23', '16:00', '', 'completed', '2025-10-22 09:36:22.220198+00', '2025-10-22 09:36:22.220198+00', false, '1154103e-fdb2-4faa-a073-aeed08275e8d', NULL, NULL, 60, '2025-10-23 14:00:00', '2025-10-23 15:00:00', '["2025-10-23 18:00:00+00","2025-10-23 19:00:00+00")', '["2025-10-23 14:00:00+00","2025-10-23 15:00:00+00")', '["2025-10-23 14:00:00+00","2025-10-23 15:00:00+00")'),
	('983097b3-710b-440a-9774-e831475e50e4', 'zerze zerzerz', 'anthony.corradi24072001@gmail.com', 'zerzerzz', '531a3590-267f-4d26-ba5c-0931e7736b68', 'Pose cil à cil + Sourcils, Lèvre & Menton', '2025-10-30', '11:00', '', 'completed', '2025-11-01 15:40:36.267697+00', '2025-11-01 15:40:36.267697+00', false, '82750372-b5ec-4bb3-99c2-de5cac1d1e33', NULL, NULL, 120, '2025-10-30 10:00:00', '2025-10-30 12:00:00', '["2025-10-30 11:00:00+00","2025-10-30 13:00:00+00")', '["2025-10-30 10:00:00+00","2025-10-30 12:00:00+00")', '["2025-10-30 10:00:00+00","2025-10-30 12:00:00+00")'),
	('fdf6c010-9f94-47bd-8aee-99489ca80415', 'Anthony Corradi', 'anthony.corradi24072001@gmail.com', '0626445785', '0e5d0bea-4f61-46ff-a836-b85eb604f3e7', 'Rehaussement de cils + Rehaussement & teinture', '2025-11-01', '10:00', '', 'confirmed', '2025-10-29 03:55:16.116117+00', '2025-10-29 03:55:16.116117+00', false, 'd8bee0f3-3471-43f0-b412-21045457ce1a', NULL, NULL, 100, '2025-11-01 09:00:00', '2025-11-01 10:40:00', NULL, '["2025-11-01 09:00:00+00","2025-11-01 10:40:00+00")', '["2025-11-01 09:00:00+00","2025-11-01 10:40:00+00")'),
	('b7b30aac-5de8-4e9c-8e89-7de77dc5d44a', 'CAPUCINEEEEEE CORRADIOUPAS', 'anthony.corradi24072001@gmail.com', '06264457853', '1649cfc5-dc21-4df6-b6a8-29dc0a2492a1', 'Sourcils + Lèvre + Menton + Remplissage cil à cil', '2025-10-31', '16:30', '', 'confirmed', '2025-10-29 14:32:23.675963+00', '2025-10-29 14:32:23.675963+00', false, '4c156858-3f22-467a-acbe-c8933a993654', NULL, NULL, 95, '2025-10-31 15:30:00', '2025-10-31 17:05:00', NULL, '["2025-10-31 15:30:00+00","2025-10-31 17:05:00+00")', '["2025-10-31 15:30:00+00","2025-10-31 17:05:00+00")'),
	('42017f71-e84a-49f9-ae86-020adf62db84', 'CAPUCINEEEEEE Corradi', 'anthony.corradi24072001@gmail.com', '0626445785', '17322e94-f581-4c7e-8d66-7f2a40ecb485', 'Sourcils + Lèvre', '2025-10-31', '09:30', '', 'completed', '2025-10-29 21:33:17.230101+00', '2025-10-29 21:33:17.230101+00', false, '33489376-4a31-46d3-b1d0-82fdfdd38cd8', NULL, NULL, 25, '2025-10-31 08:30:00', '2025-10-31 08:55:00', NULL, '["2025-10-31 08:30:00+00","2025-10-31 08:55:00+00")', '["2025-10-31 08:30:00+00","2025-10-31 08:55:00+00")'),
	('e12adfd3-85f9-4ac5-87b0-89e8cdd64997', 'CAPUCINEEEEEE Corradi', 'anthony.corradi24072001@gmail.com', '0626445785', '17322e94-f581-4c7e-8d66-7f2a40ecb485', 'Sourcils', '2025-11-01', '12:30', '', 'confirmed', '2025-10-31 05:06:42.338447+00', '2025-10-31 05:06:42.338447+00', false, '9b02a585-47f9-4921-b205-fb6bfbbc59de', NULL, NULL, 15, '2025-11-01 11:30:00', '2025-11-01 11:45:00', '["2025-11-01 12:30:00+00","2025-11-01 12:45:00+00")', '["2025-11-01 11:30:00+00","2025-11-01 11:45:00+00")', '["2025-11-01 11:30:00+00","2025-11-01 11:45:00+00")'),
	('42776fbc-5902-4b85-82fc-06e1b6016429', 'Corradi', 'anthony.corradi24072001@gmail.com', '+33626445785', NULL, 'Sourcils', '2025-10-24', '10:00', '', 'completed', '2025-10-23 12:37:06.924439+00', '2025-10-23 12:37:06.924439+00', false, '097350c8-5bb9-4384-bb72-03cfd4e393e6', NULL, NULL, 60, '2025-10-24 08:00:00', '2025-10-24 09:00:00', '["2025-10-24 12:00:00+00","2025-10-24 13:00:00+00")', '["2025-10-24 08:00:00+00","2025-10-24 09:00:00+00")', '["2025-10-24 08:00:00+00","2025-10-24 09:00:00+00")'),
	('ededbd1b-2ff7-4db1-a60f-b4e06dba2f11', 'Test Client', 'test@example.com', '+33000000000', NULL, 'Réservation multi-prestations', '2025-10-26', '10:00', '', 'completed', '2025-10-25 22:15:49.565476+00', '2025-10-25 22:15:49.565476+00', false, '641d936e-0f56-4cb7-b7e3-56aea8d10d9e', NULL, NULL, 60, '2025-10-26 09:00:00', '2025-10-26 10:00:00', '["2025-10-26 11:00:00+00","2025-10-26 12:00:00+00")', '["2025-10-26 09:00:00+00","2025-10-26 10:00:00+00")', '["2025-10-26 09:00:00+00","2025-10-26 10:00:00+00")');


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

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


--
-- Data for Name: service_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."service_items" ("id", "service_id", "label", "price", "description", "duration", "benefits", "order_index", "created_at", "updated_at") VALUES
	('17322e94-f581-4c7e-8d66-7f2a40ecb485', 'c189791c-2488-4b5d-8535-bf3ee6205442', 'Sourcils', '12€', 'Épilation précise des sourcils au fil', '15 min', NULL, 0, '2025-10-22 00:36:20.928812+00', '2025-10-22 00:36:20.928812+00'),
	('f2d46b4f-7d71-47c0-bb75-57f45c84a8ff', 'c189791c-2488-4b5d-8535-bf3ee6205442', 'Lèvre', '8€', 'Épilation au fil de la lèvre supérieure', '10 min', NULL, 1, '2025-10-22 00:36:20.928812+00', '2025-10-22 00:36:20.928812+00'),
	('815fd399-9436-4073-bcce-5885a9d29920', '425c8c18-cea3-4e68-ad8c-a54f72dc8a8e', 'Pose cil à cil', '55€', 'Pose naturelle pour un regard sublimé', '1h30', NULL, 0, '2025-10-22 00:36:20.928812+00', '2025-10-22 00:36:20.928812+00'),
	('71aeb277-dc04-4a03-a15e-b65b040e7189', '425c8c18-cea3-4e68-ad8c-a54f72dc8a8e', 'Volume russe', '75€', 'Volume intense pour un effet glamour', '2h', NULL, 1, '2025-10-22 00:36:20.928812+00', '2025-10-22 00:36:20.928812+00'),
	('0e5d0bea-4f61-46ff-a836-b85eb604f3e7', '68a39709-938f-4d5f-ab6a-664f7e971a02', 'Rehaussement de cils', '40€', 'Courbure naturelle et durable des cils', '45 min', NULL, 0, '2025-10-22 00:36:20.928812+00', '2025-10-22 00:36:20.928812+00'),
	('2b3cb200-b689-4a97-9a31-b6fde56be8a7', 'c189791c-2488-4b5d-8535-bf3ee6205442', 'Menton', '7€', 'Épilation précise du menton adaptée aux peaux sensibles.', '10 min', NULL, 2, '2025-10-29 01:54:37.539517+00', '2025-10-29 01:54:37.539517+00'),
	('a2799a94-872e-42db-aebb-ee6b2cf50790', '425c8c18-cea3-4e68-ad8c-a54f72dc8a8e', 'Pose volume mixte', '65€', 'Mix cil à cil + éventails légers pour plus de densité avec naturel.', '1h45', NULL, 2, '2025-10-29 01:54:52.851381+00', '2025-10-29 01:54:52.851381+00'),
	('7887eccc-04b1-42d9-b304-12540da94408', '425c8c18-cea3-4e68-ad8c-a54f72dc8a8e', 'Pose volume russe', '75€', 'Éventails 3D-5D pour un regard intense et structuré.', '2h', NULL, 2, '2025-10-29 01:54:52.851381+00', '2025-10-29 01:54:52.851381+00'),
	('abcd9f88-94fd-4052-9a49-2b5c4b161f00', '425c8c18-cea3-4e68-ad8c-a54f72dc8a8e', 'Pose volume russe intense', '80€', 'Volume plus fourni pour un résultat spectaculaire et glamour.', '2h15', NULL, 2, '2025-10-29 01:54:52.851381+00', '2025-10-29 01:54:52.851381+00'),
	('602fab6b-a5c6-42e7-acea-25e105efa3b1', '37bd0807-50cd-4b4b-87c0-0c62df920855', 'Sourcils & Lèvre', '18€', 'Formule avantageuse pour un visage net (sourcils + lèvre).', '20 min', NULL, 0, '2025-10-29 01:55:19.869433+00', '2025-10-29 01:55:19.869433+00'),
	('531a3590-267f-4d26-ba5c-0931e7736b68', '37bd0807-50cd-4b4b-87c0-0c62df920855', 'Sourcils, Lèvre & Menton', '25€', 'Forfait complet d''épilation du visage au fil.', '30 min', NULL, 0, '2025-10-29 01:55:19.869433+00', '2025-10-29 01:55:19.869433+00'),
	('1649cfc5-dc21-4df6-b6a8-29dc0a2492a1', '1ea99e4d-a362-46ff-a506-90ecc5aaf207', 'Remplissage cil à cil', '40€', 'Entretien 2-3 semaines pour conserver un effet naturel.', '1h', NULL, 0, '2025-10-29 01:55:34.22262+00', '2025-10-29 01:55:34.22262+00'),
	('473cab2f-a4ba-4bb6-bf80-ed6b6a986ba8', '1ea99e4d-a362-46ff-a506-90ecc5aaf207', 'Remplissage mixte', '50€', 'Entretien 2-3 semaines des poses mixtes.', '1h15', NULL, 0, '2025-10-29 01:55:34.22262+00', '2025-10-29 01:55:34.22262+00'),
	('182a2741-a674-4712-8122-66122f06890e', '1ea99e4d-a362-46ff-a506-90ecc5aaf207', 'Remplissage russe', '60€', 'Entretien 2-3 semaines des poses volume russe.', '1h15', NULL, 0, '2025-10-29 01:55:34.22262+00', '2025-10-29 01:55:34.22262+00'),
	('226aa2bb-69a8-4f75-999e-98fdfcd05617', '1ea99e4d-a362-46ff-a506-90ecc5aaf207', 'Dépose', '10€', 'Retrait des extensions en douceur, sans abîmer les cils naturels.', '20 min', NULL, 0, '2025-10-29 01:55:34.22262+00', '2025-10-29 01:55:34.22262+00'),
	('09ec5180-c70b-41c8-b163-9e70ca0fb36c', '68a39709-938f-4d5f-ab6a-664f7e971a02', 'Rehaussement & teinture', '45€', 'Courbure + teinte pour un regard mis en valeur sans mascara.', '55 min', NULL, 1, '2025-10-29 01:55:47.489094+00', '2025-10-29 01:55:47.489094+00'),
	('5e172301-d73c-4418-a90c-43c0505c5c53', '68a39709-938f-4d5f-ab6a-664f7e971a02', 'Teinture de cils', '25€', 'Teinte des cils pour intensifier le regard au quotidien.', '20 min', NULL, 1, '2025-10-29 01:55:47.489094+00', '2025-10-29 01:55:47.489094+00'),
	('9243393a-2718-4962-bda0-1de63ccf64d8', '5f89595c-aa0e-41e9-8da1-f07fda39a8d3', 'Microblading', '170€', NULL, '', NULL, 1, '2025-11-02 16:06:48.108111+00', '2025-11-02 16:06:48.108111+00'),
	('5b20f958-7d04-4be5-a1e1-acb461cdaa13', '5f89595c-aa0e-41e9-8da1-f07fda39a8d3', 'Retouche 1 à 3 mois', '50€', NULL, '', NULL, 2, '2025-11-02 16:06:48.108111+00', '2025-11-02 16:06:48.108111+00'),
	('97e2c167-2613-4ff9-9248-a49aaaf14783', '5f89595c-aa0e-41e9-8da1-f07fda39a8d3', 'Retouche 6 mois', '70€', NULL, '', NULL, 3, '2025-11-02 16:06:48.108111+00', '2025-11-02 16:06:48.108111+00'),
	('bf1162be-c4bc-43b2-a0de-5459b4875c66', '5f89595c-aa0e-41e9-8da1-f07fda39a8d3', 'Retouche 12 mois', '90€', NULL, '', NULL, 4, '2025-11-02 16:06:48.108111+00', '2025-11-02 16:06:48.108111+00'),
	('0a99aecc-0f0c-460d-9cfd-609d076d52ba', '5f89595c-aa0e-41e9-8da1-f07fda39a8d3', 'Combo Blading + Velvet Brows', '200€', NULL, '', NULL, 5, '2025-11-02 16:06:48.108111+00', '2025-11-02 16:06:48.108111+00'),
	('645d1991-1b03-4fe9-b5b0-f6d325f7ab7a', '300a4d17-95d7-48de-be35-a9462ad8267a', 'Velvet Brows', '180€', NULL, '', NULL, 1, '2025-11-02 16:06:48.108111+00', '2025-11-02 16:06:48.108111+00'),
	('3de7476b-85fc-4140-9403-a8eaf6ea234b', '300a4d17-95d7-48de-be35-a9462ad8267a', 'Retouche 1 à 3 mois', '50€', NULL, '', NULL, 2, '2025-11-02 16:06:48.108111+00', '2025-11-02 16:06:48.108111+00'),
	('6af2c638-7df0-4065-817a-d0204f6a7e90', '300a4d17-95d7-48de-be35-a9462ad8267a', 'Retouche 6 mois', '70€', NULL, '', NULL, 3, '2025-11-02 16:06:48.108111+00', '2025-11-02 16:06:48.108111+00'),
	('d213629a-b29b-4666-acf1-b3fa4ce491e1', '300a4d17-95d7-48de-be35-a9462ad8267a', 'Retouche 12 mois', '90€', NULL, '', NULL, 4, '2025-11-02 16:06:48.108111+00', '2025-11-02 16:06:48.108111+00'),
	('1f25f9a0-b96e-4fd5-bab2-5e98d974987b', '300a4d17-95d7-48de-be35-a9462ad8267a', 'Combo Blading + Velvet Brows', '200€', NULL, '', NULL, 5, '2025-11-02 16:06:48.108111+00', '2025-11-02 16:06:48.108111+00');


--
-- Data for Name: booking_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."booking_items" ("id", "booking_id", "service_item_id", "duration_minutes", "created_at") VALUES
	('40b57e9c-fbf4-4113-8b01-61746d7f9981', 'ededbd1b-2ff7-4db1-a60f-b4e06dba2f11', '17322e94-f581-4c7e-8d66-7f2a40ecb485', 15, '2025-10-25 22:15:49.565476+00'),
	('b6ba6336-0a04-4caa-b1b6-07dbdf33fe37', 'ededbd1b-2ff7-4db1-a60f-b4e06dba2f11', '0e5d0bea-4f61-46ff-a836-b85eb604f3e7', 45, '2025-10-25 22:15:49.565476+00');


--
-- Data for Name: business_hours; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."business_hours" ("id", "day_of_week", "open_time", "close_time", "is_closed", "created_at", "updated_at") VALUES
	('dfda00e6-7905-404a-a394-0f80e8fe76c0', 0, '09:00:00', '19:00:00', false, '2025-10-22 00:36:15.007059+00', '2025-10-22 00:36:15.007059+00'),
	('36c07bbc-6f0c-442f-be6b-9b46b6352522', 1, '09:00:00', '19:00:00', false, '2025-10-22 00:36:15.007059+00', '2025-10-22 00:36:15.007059+00'),
	('cf3c0597-deab-4a6a-867f-605d885d1210', 2, '09:00:00', '19:00:00', false, '2025-10-22 00:36:15.007059+00', '2025-10-22 00:36:15.007059+00'),
	('c468f601-b823-43d9-8aa1-b67de3b9519e', 3, '09:00:00', '19:00:00', false, '2025-10-22 00:36:15.007059+00', '2025-10-22 00:36:15.007059+00'),
	('d08f65e6-fe86-402f-bc7c-24dc88c6ba79', 4, '09:00:00', '19:00:00', false, '2025-10-22 00:36:15.007059+00', '2025-10-22 00:36:15.007059+00'),
	('9e18fbfb-afe3-44bd-b894-a42385219ce9', 5, '09:00:00', '15:00:00', false, '2025-10-22 00:36:15.007059+00', '2025-10-22 00:36:15.007059+00'),
	('b4fed106-2525-4b87-b92e-120089b0cd5c', 6, NULL, NULL, true, '2025-10-22 00:36:15.007059+00', '2025-10-22 00:36:15.007059+00');


--
-- Data for Name: cancellation_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: closures; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: obs_index_usage_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: portfolio_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."portfolio_categories" ("id", "name", "order_index", "created_at", "updated_at") VALUES
	('976d34b0-4a57-4541-bdf9-16191118c998', 'Maquillage', 3, '2025-10-21 22:30:40.887715+00', '2025-11-01 21:53:19.299+00'),
	('e48e4216-2579-493d-9fd9-1ecb838cd97b', 'Lèvres', 2, '2025-10-21 22:30:40.887715+00', '2025-11-01 21:53:19.299+00'),
	('6a37d76b-f67d-454f-b67d-e7368f854672', 'Sourcils', 1, '2025-10-21 22:30:40.887715+00', '2025-11-01 21:53:19.299+00'),
	('56825128-ffb8-4e4c-90e0-36e454f89c6f', 'Cils', 0, '2025-10-21 22:30:40.887715+00', '2025-11-01 21:53:19.299+00');


--
-- Data for Name: portfolio_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."portfolio_items" ("id", "url", "title", "description", "detailed_description", "alt", "category", "show_on_home", "order_index", "created_at", "updated_at") VALUES
	('cbc53a66-fdee-4ce9-935a-942600be5500', 'https://harmoniecils.com/image3.jpeg', 'Volume Parfait', 'Extensions volume pour un regard magnifique', 'Réalisation d''extensions de cils volume par Harmonie Cils. Technique professionnelle pour un résultat exceptionnel.', 'Extensions de cils volume - Harmonie Cils', 'Cils', true, 2, '2025-11-01 08:58:47.773619+00', '2025-11-01 08:58:47.773619+00'),
	('29c98f39-34fe-43fc-9ff2-67c4beaf0809', 'https://harmoniecils.com/image13.jpeg', 'Élégance Pure', 'Extensions pour un look sophistiqué et raffiné', 'Pose d''extensions de cils réalisée avec soin pour un résultat élégant et sophistiqué.', 'Extensions de cils élégantes - Harmonie Cils', 'Cils', true, 4, '2025-11-01 08:58:47.773619+00', '2025-11-01 08:58:47.773619+00'),
	('3a967d68-7916-479e-a284-803aedf3f0f6', 'https://harmoniecils.com/image12.jpeg', 'Technique Experte', 'Extensions réalisées avec expertise et précision', 'Démonstration du savoir-faire d''Harmonie Cils avec cette pose d''extensions parfaitement réalisée.', 'Extensions de cils professionnelles - Harmonie Cils', 'Cils', true, 3, '2025-11-01 08:58:47.773619+00', '2025-11-01 08:58:47.773619+00'),
	('77d9b3c7-e098-4f6b-b479-bf9488985254', 'https://harmoniecils.com/image1.jpeg', 'Volume Russe', 'Extensions volume russe pour un regard intense et glamour', 'Pose d''extensions volume russe réalisée par Harmonie Cils. Technique experte pour un volume spectaculaire et un regard captivant.', 'Extensions de cils volume russe - Harmonie Cils', 'Cils', true, 0, '2025-11-01 08:58:47.773619+00', '2025-11-01 08:58:47.773619+00'),
	('85e102df-fae8-46ae-9dea-069656e6cab3', 'https://harmoniecils.com/image2.jpeg', 'Regard Naturel', 'Extensions pour un effet naturel et élégant', 'Pose d''extensions de cils pour un effet naturel parfait. Travail minutieux pour sublimer le regard en douceur.', 'Extensions de cils naturelles - Harmonie Cils', 'Cils', true, 1, '2025-11-01 08:58:47.773619+00', '2025-11-01 09:49:18.819+00');


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("user_id", "is_admin", "created_at", "updated_at") VALUES
	('0343fca9-5ab1-4348-be5b-7b7f79a064df', true, '2025-10-24 14:40:14.6146+00', '2025-10-25 21:07:30.43482+00');


--
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: service_item_members; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Name: obs_index_usage_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."obs_index_usage_snapshots_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict musuNJ6JBuYJPpMUO7kdqfjyODCgvaUMeHT4QGmjLp4bPE8fNtoXkXJ9eAmY927

RESET ALL;
