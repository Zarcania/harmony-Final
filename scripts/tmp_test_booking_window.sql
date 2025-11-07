-- Test insert within window (26 days)
insert into public.bookings (
  client_name, client_email, client_phone, service_name,
  preferred_date, preferred_time, status, duration_minutes, user_id
) values (
  'Test 26d','test26@example.com','', 'Test Service',
  current_date + 26, '10:00', 'confirmed', 60, null
) returning id, preferred_date;

-- Test insert beyond window (33 days) – should fail with booking_window_exceeded
insert into public.bookings (
  client_name, client_email, client_phone, service_name,
  preferred_date, preferred_time, status, duration_minutes, user_id
) values (
  'Test 33d','test33@example.com','', 'Test Service',
  current_date + 33, '10:00', 'confirmed', 60, null
) returning id, preferred_date;