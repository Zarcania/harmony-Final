-- func_cancel_booking.sql
-- Transactional cancellation using cancellation_tokens as source of truth

CREATE OR REPLACE FUNCTION public.cancel_booking_with_log(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tok       cancellation_tokens%ROWTYPE;
  v_booking   bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_tok FROM public.cancellation_tokens WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'invalid_or_expired_token', 'message', 'Token introuvable');
  END IF;

  IF v_tok.used_at IS NOT NULL OR (v_tok.expires_at IS NOT NULL AND v_tok.expires_at < now()) THEN
    RETURN jsonb_build_object('success', false, 'code', 'invalid_or_expired_token', 'message', 'Lien expiré ou déjà utilisé');
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = v_tok.booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'invalid_payload', 'message', 'Réservation introuvable');
  END IF;

  UPDATE public.bookings
     SET status = 'cancelled', canceled_at = now(), updated_at = now()
   WHERE id = v_booking.id;

  UPDATE public.cancellation_tokens SET used_at = now() WHERE id = v_tok.id;

  INSERT INTO public.email_logs (booking_id, email_type, recipient_email, subject, status, sent_at)
  VALUES (v_booking.id, 'cancellation', v_booking.client_email, 'Annulation de rendez-vous', 'sent', now());

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Votre rendez-vous a bien été annulé',
    'booking', jsonb_build_object(
      'id', v_booking.id,
      'client_name', v_booking.client_name,
      'client_first_name', nullif(split_part(coalesce(v_booking.client_name, ''), ' ', 1), ''),
      'client_email', v_booking.client_email,
      'service_name', v_booking.service_name,
      'preferred_date', v_booking.preferred_date,
      'preferred_time', v_booking.preferred_time
    )
  );
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('success', false, 'code', 'server_error', 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_booking_with_log(text) TO anon, authenticated;
