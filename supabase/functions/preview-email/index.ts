// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2.58.0'
import { buildCors, handleOptions } from '../utils/cors.ts'
import { confirmationTemplate, reminderTemplate, cancellationTemplate } from '../utils/emailTemplates.ts'

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin') || undefined
  const cors = buildCors(origin)
  const opt = handleOptions(req)
  if (opt) return opt

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } })
    }
    const body = await req.json().catch(() => ({}))
    const bookingId = body.booking_id || body.bookingId
    const kind = (body.type || body.kind || 'confirmation').toString()
    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'invalid_payload', details: 'booking_id requis' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // 1) Charger le booking
    const { data: booking, error: e1 } = await supabase.from('bookings').select('*').eq('id', bookingId).single()
    if (e1 || !booking) {
      return new Response(JSON.stringify({ error: 'booking_not_found' }), { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const siteBase = (Deno.env.get('PUBLIC_SITE_URL') ?? 'https://harmoniecils.com').replace(/\/+$/, '')

    if (kind === 'confirmation') {
      // Token annulation get-or-create
      const { data: tok } = await supabase
        .from('cancellation_tokens')
        .select('token, used_at, expires_at')
        .eq('booking_id', bookingId)
        .is('used_at', null)
        .order('created_at', { ascending: false })
        .maybeSingle()
      let token = tok?.token
      if (!token) {
        const { data: ins, error: e2 } = await supabase
          .from('cancellation_tokens')
          .insert({ booking_id: bookingId, expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() })
          .select('token')
          .single()
        if (e2 || !ins) return new Response(JSON.stringify({ error: 'cannot_create_token' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
        token = ins.token
      }
      const confirmUrl = `${siteBase}/booking/confirm?booking=${encodeURIComponent(bookingId)}`
      const cancelUrl = `${siteBase}/booking/cancel?token=${encodeURIComponent(token)}`
      const { subject, html, text } = confirmationTemplate({ booking, confirmUrl, cancelUrl })
      return new Response(JSON.stringify({ subject, html, text }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    if (kind === 'reminder') {
      // Pour le rappel, projection minimale et URL d’annulation idem confirmation
      const { data: tok } = await supabase
        .from('cancellation_tokens')
        .select('token, used_at, expires_at')
        .eq('booking_id', bookingId)
        .is('used_at', null)
        .order('created_at', { ascending: false })
        .maybeSingle()
      const token = tok?.token || ''
      const cancellationUrl = token ? `${siteBase}/booking/cancel?token=${encodeURIComponent(token)}` : `${siteBase}`
      const starts_at = `${booking.preferred_date}T${(booking.preferred_time || '09:00')}:00Z`
      const ends_at = undefined
      const { subject, html, text } = reminderTemplate({
        client_first_name: booking.client_name,
        service_name: booking.service_name,
        starts_at,
        ends_at,
        booking_ref: booking.id,
        customer_email: booking.client_email,
        timezone: 'Europe/Paris',
        cancellationUrl,
      })
      return new Response(JSON.stringify({ subject, html, text }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    if (kind === 'cancellation') {
      const { subject, html, text } = cancellationTemplate({ client_first_name: booking.client_name, booking_ref: booking.id })
      return new Response(JSON.stringify({ subject, html, text }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'unsupported_type' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'server_error', message: e?.message ?? 'unknown' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
