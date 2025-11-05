// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { buildCors, handleOptions } from '../utils/cors.ts';
import { confirmationTemplate } from '../utils/emailTemplates.ts';
Deno.serve(async (req)=>{
  const origin = req.headers.get('Origin') || undefined;
  const corsHeaders = buildCors(origin);
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'method_not_allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const body = await req.json().catch(()=>({}));
    const bookingId = body.bookingId || body.booking_id;
    if (!bookingId) {
      return new Response(JSON.stringify({
        error: 'invalid_payload'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 1) Récupérer le booking
    const { data: booking, error: e1 } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
    if (e1 || !booking) {
      return new Response(JSON.stringify({
        error: 'booking_not_found'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 2) Token get-or-create dans cancellation_tokens
    const { data: tok } = await supabase.from('cancellation_tokens').select('token, used_at, expires_at').eq('booking_id', bookingId).is('used_at', null).order('created_at', {
      ascending: false
    }).maybeSingle();
    let token = tok?.token;
    if (!token) {
      const { data: ins, error: e2 } = await supabase.from('cancellation_tokens').insert({
        booking_id: bookingId,
        expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      }).select('token').single();
      if (e2 || !ins) {
        return new Response(JSON.stringify({
          error: 'cannot_create_token'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      token = ins.token;
    }
    // 3) URLs publiques
    const siteBase = (Deno.env.get('PUBLIC_SITE_URL') ?? 'https://harmoniecils.com').replace(/\/+$/, '');
    const confirmUrl = `${siteBase}/booking/confirm?booking=${encodeURIComponent(bookingId)}`;
    const cancelUrl = `${siteBase}/booking/cancel?token=${encodeURIComponent(token)}`;
    // 4) Construire l'email et envoyer via Resend (template unifié)
    const name = [booking.client_name].filter(Boolean).join(' ').trim();
    const { subject, html: emailHtml, text: emailText } = confirmationTemplate({ booking, confirmUrl, cancelUrl });
    let sentOk = false;
    let errorDetail = null;
    const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
    try {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`
        },
        body: JSON.stringify({
          from: 'Harmonie Cils <noreply@harmoniecils.com>',
          to: booking.client_email,
          subject,
          html: emailHtml
        })
      });
      sentOk = emailResponse.ok;
      if (!emailResponse.ok) {
        const failText = await emailResponse.text();
        errorDetail = `HTTP ${emailResponse.status} ${emailResponse.statusText} — ${failText.slice(0, 500)}`;
        console.error('Resend error:', errorDetail);
      }
    } catch (e) {
      console.error('Resend send failed:', e);
      sentOk = false;
      errorDetail = e?.message || 'unknown_error';
    }
    // 5) Log email (confirmation)
    await supabase.from('email_logs').insert({
      booking_id: bookingId,
      email_type: 'confirmation',
      recipient_email: booking.client_email,
      recipient_name: name || null,
      subject,
      status: sentOk ? 'sent' : 'failed',
      error_message: sentOk ? null : errorDetail || 'send_failed',
      sent_at: sentOk ? new Date().toISOString() : null
    });
    return new Response(JSON.stringify({
      success: true,
      confirmUrl,
      cancelUrl,
      sent: sentOk
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: 'server_error',
      message: error?.message ?? 'unknown'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
// template déplacé dans utils/emailTemplates.ts
