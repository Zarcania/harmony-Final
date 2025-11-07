// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { buildCors, handleOptions } from '../utils/cors.ts';
// Expéditeur Resend (secret RESEND_FROM)
const FROM = Deno.env.get('RESEND_FROM') || 'Harmonie Cils <noreply@harmoniecils.com>';
Deno.serve(async (req)=>{
  const origin = req.headers.get('Origin') ?? undefined;
  const corsHeaders = buildCors(origin);
  const opt = handleOptions(req);
  if (opt) return opt;
  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    const { data: bookings, error: bookingsError } = await supabaseClient.from('bookings').select('*').eq('preferred_date', tomorrowDate).eq('reminder_sent', false).in('status', [
      'confirmed',
      'pending'
    ]);
    if (bookingsError) {
      throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
    }
    if (!bookings || bookings.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No bookings to remind',
        count: 0
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    let successCount = 0;
    let failureCount = 0;
    for (const booking of bookings){
      try {
        const { data: existingToken } = await supabaseClient.from('cancellation_tokens').select('token').eq('booking_id', booking.id).maybeSingle();
        let cancellationToken = existingToken?.token;
        if (!cancellationToken) {
          const tokenResult = await supabaseClient.rpc('generate_cancellation_token', {
            p_booking_id: booking.id,
            p_expires_at: booking.preferred_date + 'T23:59:59Z'
          });
          if (tokenResult.error) {
            console.error('Error generating token:', tokenResult.error);
            throw new Error('Failed to generate cancellation token');
          }
          cancellationToken = tokenResult.data;
        }
        const siteBase = (Deno.env.get('PUBLIC_SITE_URL') ?? 'https://harmoniecils.com').replace(/\/+$/, '');
        const cancellationUrl = `${siteBase}/cancel-booking?token=${cancellationToken}`;
        const emailHtml = generateReminderEmail(booking, cancellationUrl);
        const emailData = {
          to: booking.client_email,
          subject: '🔔 Rappel : Votre rendez-vous demain - Harmonie Cils',
          html: emailHtml
        };
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`
          },
          body: JSON.stringify({
            from: FROM,
            ...emailData
          })
        });
        const emailResult = await emailResponse.json();
        if (!emailResponse.ok) {
          await supabaseClient.from('email_logs').insert({
            booking_id: booking.id,
            email_type: 'reminder',
            recipient_email: booking.client_email,
            status: 'failed',
            error_message: JSON.stringify(emailResult)
          });
          failureCount++;
          continue;
        }
        await supabaseClient.from('email_logs').insert({
          booking_id: booking.id,
          email_type: 'reminder',
          recipient_email: booking.client_email,
          status: 'sent'
        });
        await supabaseClient.from('bookings').update({
          reminder_sent: true
        }).eq('id', booking.id);
        successCount++;
      } catch (error) {
        console.error(`Error sending reminder for booking ${booking.id}:`, error);
        failureCount++;
      }
    }
    return new Response(JSON.stringify({
      success: true,
      message: 'Reminder emails processed',
      successCount,
      failureCount,
      total: bookings.length
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error?.message ?? 'unknown'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
function generateReminderEmail(booking, cancellationUrl) {
  const formatDate = (dateStr)=>{
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel de rendez-vous</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6a8caf 0%, #5a7a9a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: 0.5px;">🔔 Harmonie Cils</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">Rappel de rendez-vous</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${booking.client_name}</strong>,
              </p>
              
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Nous vous rappelons que vous avez rendez-vous <strong>demain</strong> chez Harmonie Cils. 💖
              </p>

              <!-- Booking Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f4f8; border-left: 4px solid #6a8caf; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding: 8px 0;">📋 <strong>Service :</strong></td>
                        <td style="color: #333333; font-size: 14px; text-align: right; padding: 8px 0;">${booking.service_name}</td>
                      </tr>
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding: 8px 0;">📅 <strong>Date :</strong></td>
                        <td style="color: #333333; font-size: 14px; text-align: right; padding: 8px 0;">${formatDate(booking.preferred_date)}</td>
                      </tr>
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding: 8px 0;">🕐 <strong>Heure :</strong></td>
                        <td style="color: #333333; font-size: 14px; text-align: right; padding: 8px 0;">${booking.preferred_time}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Reminder Box -->
              <div style="background-color: #fff8e1; border-left: 4px solid #ffa726; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 12px 0; color: #e65100; font-size: 16px;">⚠️ N'oubliez pas</h3>
                <ul style="margin: 0; padding-left: 20px; color: #333333; font-size: 14px; line-height: 1.8;">
                  <li>Merci d'arriver 5 minutes avant l'heure de votre rendez-vous</li>
                  <li>Si vous avez un empêchement, merci de nous prévenir au plus tôt</li>
                  <li>Vous pouvez annuler facilement en cliquant sur le bouton ci-dessous</li>
                </ul>
              </div>

              <!-- Confirm Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <div style="display: inline-block; background-color: #4caf50; color: #ffffff; text-align: center; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 500;">✅ Rendez-vous confirmé</div>
                  </td>
                </tr>
              </table>

              <!-- Cancel Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="${cancellationUrl}" style="display: inline-block; background-color: #dc3545; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 500;">Annuler le rendez-vous</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; color: #333333; font-size: 15px; line-height: 1.6; text-align: center;">
                Nous avons hâte de vous accueillir ! ✨
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                <strong>Harmonie Cils</strong>
              </p>
              <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6;">
                Institut de beauté spécialisé en extensions de cils<br>
                Email: harmoniecilsstudio@gmail.com | Téléphone: 06 XX XX XX XX
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
