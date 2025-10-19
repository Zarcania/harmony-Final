import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

type Booking = {
  id: string;
  client_first_name: string | null;
  client_name: string | null;
  client_email: string;
  client_phone: string | null;
  service_name: string;
  preferred_date: string; // ISO Date string
  preferred_time: string | null;
};

const rawAllowed = Deno.env.get('ALLOWED_ORIGINS') || 'https://harmoniecils.com,http://localhost:3000,http://localhost:5173';
const allowedOrigins = rawAllowed.split(',').map((s) => s.trim());

const buildCors = (origin?: string) => {
  const o = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
    Vary: 'Origin',
  } as Record<string, string>;
};

interface BookingConfirmationRequest { bookingId?: string; booking_id?: string }

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') || undefined;
  const corsHeaders = buildCors(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body: BookingConfirmationRequest = await req.json().catch(() => ({} as BookingConfirmationRequest));
    const bookingId = body.bookingId || body.booking_id;
    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'invalid_payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 1) Récupérer le booking
    const { data: booking, error: e1 } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single<Booking>();

    if (e1 || !booking) {
      return new Response(JSON.stringify({ error: 'booking_not_found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2) Token get-or-create dans cancellation_tokens
    const { data: tok } = await supabase
      .from('cancellation_tokens')
      .select('token, used_at, expires_at')
      .eq('booking_id', bookingId)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .maybeSingle<{ token: string; used_at: string | null; expires_at: string | null }>();

    let token = tok?.token as string | undefined;
    if (!token) {
      const { data: ins, error: e2 } = await supabase
        .from('cancellation_tokens')
        .insert({ booking_id: bookingId, expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() })
        .select('token')
        .single<{ token: string }>();
      if (e2 || !ins) {
        return new Response(JSON.stringify({ error: 'cannot_create_token' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      token = ins.token;
    }

    // 3) URLs publiques
    const siteBase = (Deno.env.get('PUBLIC_SITE_URL') ?? 'https://harmoniecils.com').replace(/\/+$/, '');
    const confirmUrl = `${siteBase}/booking/confirm?booking=${encodeURIComponent(bookingId)}`;
    const cancelUrl = `${siteBase}/booking/cancel?token=${encodeURIComponent(token)}`;

    // 4) Construire l'email et envoyer via Resend
    const subject = `Confirmation de rendez-vous - ${booking.service_name} - ${booking.preferred_date}`;
    const name = [booking.client_first_name, booking.client_name].filter(Boolean).join(' ').trim();
    const time = booking.preferred_time ? ` à ${booking.preferred_time}` : '';
    const emailHtml = generateConfirmationEmail({
      booking,
      confirmUrl,
      cancelUrl,
    });

    let sentOk = false;
    const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
    try {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'Harmonie Cils <noreply@harmoniecils.com>',
          to: booking.client_email,
          subject,
          html: emailHtml,
        }),
      });
      sentOk = emailResponse.ok;
      if (!emailResponse.ok) {
        const fail = await emailResponse.text();
        console.error('Resend error:', fail);
      }
    } catch (e) {
      console.error('Resend send failed:', e);
      sentOk = false;
    }

    // 5) Log email (confirmation)
    await supabase.from('email_logs').insert({
      booking_id: bookingId,
      email_type: 'confirmation',
      recipient_email: booking.client_email,
      recipient_name: name || null,
      subject,
      status: sentOk ? 'sent' : 'failed',
      error_message: sentOk ? null : 'send_failed',
      sent_at: sentOk ? new Date().toISOString() : null,
    });

    return new Response(
      JSON.stringify({ success: true, confirmUrl, cancelUrl, sent: sentOk }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'server_error', message: (error as Error)?.message ?? 'unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateConfirmationEmail(params: { booking: Booking; confirmUrl: string; cancelUrl: string }): string {
  const { booking, confirmUrl, cancelUrl } = params;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmation de rendez-vous</title>
  <style>a.btn{display:inline-block;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600}</style>
  </head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#d4a574 0%,#c49563 100%);padding:40px 30px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:600;letter-spacing:.5px;">✨ Harmonie Cils</h1>
          <p style="margin:10px 0 0 0;color:#ffffff;font-size:16px;opacity:.95;">Confirmation de rendez-vous</p>
        </td></tr>
        <tr><td style="padding:40px 30px;">
          <p style="margin:0 0 20px 0;color:#333;font-size:16px;line-height:1.6;">Bonjour <strong>${[booking.client_first_name, booking.client_name].filter(Boolean).join(' ')}</strong>,</p>
          <p style="margin:0 0 20px 0;color:#333;font-size:16px;line-height:1.6;">Récapitulatif de votre demande:</p>
          <table width="100%" cellpadding="8" cellspacing="0" style="background-color:#faf8f5;border-left:4px solid #d4a574;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr><td style="color:#666;font-size:14px;padding:8px 0;">📋 <strong>Service :</strong></td><td style="color:#333;font-size:14px;text-align:right;padding:8px 0;">${booking.service_name}</td></tr>
                <tr><td style="color:#666;font-size:14px;padding:8px 0;">📅 <strong>Date :</strong></td><td style="color:#333;font-size:14px;text-align:right;padding:8px 0;">${formatDate(booking.preferred_date)}</td></tr>
                <tr><td style="color:#666;font-size:14px;padding:8px 0;">🕐 <strong>Heure :</strong></td><td style="color:#333;font-size:14px;text-align:right;padding:8px 0;">${booking.preferred_time ?? ''}</td></tr>
              </table>
            </td></tr>
          </table>
          <div style="text-align:center;margin-bottom:24px;">
            <a class="btn" href="${confirmUrl}" style="background-color:#1e88e5;color:#fff;">Confirmer le rendez-vous</a>
            &nbsp;
            <a class="btn" href="${cancelUrl}" style="background-color:#dc3545;color:#fff;">Annuler le rendez-vous</a>
          </div>
          <p style="margin:0;color:#666;font-size:13px;line-height:1.6;text-align:center;">Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.</p>
        </td></tr>
        <tr><td style="background-color:#f8f8f8;padding:30px;text-align:center;border-top:1px solid #e0e0e0;">
          <p style="margin:0 0 10px 0;color:#666;font-size:14px;"><strong>Harmonie Cils</strong></p>
          <p style="margin:0;color:#999;font-size:13px;line-height:1.6;">Institut de beauté spécialisé en extensions de cils<br>Email: harmoniecilsstudio@gmail.com | Téléphone: 06 XX XX XX XX</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
