// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { buildCors, handleOptions } from '../utils/cors.ts';
Deno.serve(async (req)=>{
  const origin = req.headers.get('Origin') || undefined;
  const cors = buildCors(origin);
  const json = (body, status = 200)=>new Response(JSON.stringify(body), {
      status,
      headers: {
        ...cors,
        'Content-Type': 'application/json'
      }
    });
  const opt = handleOptions(req);
  if (opt) return opt;
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    // Récupérer bookings (reminder_sent null/false)
    const { data: bookings, error } = await supabase.from('bookings').select('*').eq('preferred_date', tomorrowDate).in('status', [
      'confirmed',
      'pending'
    ]).or('reminder_sent.is.null,reminder_sent.eq.false');
    if (error) return json({
      error: 'fetch_failed',
      message: error.message
    }, 500);
    if (!bookings || bookings.length === 0) return json({
      ok: true,
      message: 'No bookings to remind',
      count: 0
    });
    let successCount = 0;
    let failureCount = 0;
    for (const b of bookings){
      try {
        // Assurer un token d’annulation existant (reprend logique de send-booking-reminder)
        let cancellationToken;
        const { data: existingToken } = await supabase.from('cancellation_tokens').select('token').eq('booking_id', b.id).maybeSingle();
        cancellationToken = existingToken?.token;
        if (!cancellationToken) {
          // fallback: créer une ligne simple
          const { data: ins, error: eTok } = await supabase.from('cancellation_tokens').insert({
            booking_id: b.id,
            expires_at: new Date(new Date(b.preferred_date + 'T00:00:00Z').getTime() + 24 * 60 * 60 * 1000).toISOString()
          }).select('token').single();
          if (eTok || !ins) throw new Error('token_create_failed');
          cancellationToken = ins.token;
        }
        const siteBase = (Deno.env.get('PUBLIC_SITE_URL') ?? 'https://harmoniecils.com').replace(/\/+$/, '');
        const cancellationUrl = `${siteBase}/cancel-booking?token=${encodeURIComponent(cancellationToken)}`;
        const emailHtml = `<p>Bonjour ${b.client_name ?? ''},</p><p>Rappel de votre rendez-vous ${b.service_name} du ${b.preferred_date} à ${b.preferred_time ?? ''}.</p><p><a href="${cancellationUrl}">Annuler</a></p>`;
        const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`
          },
          body: JSON.stringify({
            from: 'Harmonie Cils <noreply@harmoniecils.com>',
            to: b.client_email,
            subject: '🔔 Rappel de rendez-vous',
            html: emailHtml
          })
        });
        const ok = resp.ok;
        await supabase.from('email_logs').insert({
          booking_id: b.id,
          email_type: 'reminder',
          recipient_email: b.client_email,
          status: ok ? 'sent' : 'failed',
          sent_at: ok ? new Date().toISOString() : null,
          error_message: ok ? null : await resp.text().then((t)=>t.slice(0, 500)).catch(()=>'send_failed')
        });
        if (ok) {
          await supabase.from('bookings').update({
            reminder_sent: true
          }).eq('id', b.id);
          successCount++;
        } else {
          failureCount++;
        }
      } catch (e) {
        failureCount++;
      }
    }
    return json({
      ok: true,
      message: 'Reminder emails processed',
      successCount,
      failureCount,
      total: bookings.length
    });
  } catch (e) {
    return json({
      error: 'server_error',
      message: e?.message ?? 'unknown'
    }, 500);
  }
});
