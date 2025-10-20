-- 02_cancel_booking_tx.sql
-- RPC pour annuler un rendez-vous via booking_id (transaction simple)

create or replace function public.cancel_booking_tx(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking record;
begin
  if p_booking_id is null then
    return jsonb_build_object('success', false, 'code', 'invalid_payload', 'message', 'booking_id requis');
  end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'code', 'not_found', 'message', 'Rendez-vous introuvable');
  end if;

  if v_booking.status = 'cancelled' then
    return jsonb_build_object('success', true, 'alreadyCanceled', true, 'message', 'Déjà annulé',
      'booking', jsonb_build_object('service', v_booking.service_name, 'date', v_booking.preferred_date, 'time', v_booking.preferred_time)
    );
  end if;

  update public.bookings
  set status = 'cancelled', updated_at = now()
  where id = p_booking_id;

  return jsonb_build_object('success', true, 'message', 'Rendez-vous annulé',
    'booking', jsonb_build_object('service', v_booking.service_name, 'date', v_booking.preferred_date, 'time', v_booking.preferred_time)
  );
exception when others then
  return jsonb_build_object('success', false, 'code', 'server_error', 'message', SQLERRM);
end;
$$;
