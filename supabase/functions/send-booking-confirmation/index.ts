import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface BookingConfirmationRequest {
  bookingId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { bookingId }: BookingConfirmationRequest = await req.json();

    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    const tokenResult = await supabaseClient.rpc('generate_cancellation_token', {
      p_booking_id: bookingId,
      p_expires_at: booking.preferred_date + 'T23:59:59Z'
    });

    if (tokenResult.error) {
      console.error('Error generating token:', tokenResult.error);
      throw new Error('Failed to generate cancellation token');
    }

    const cancellationToken = tokenResult.data;
    const cancellationUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/v1', '')}/cancel-booking?token=${cancellationToken}`;

    const emailHtml = generateConfirmationEmail(booking, cancellationUrl);

    const emailData = {
      to: booking.client_email,
      subject: '✨ Confirmation de votre rendez-vous - Harmonie Cils',
      html: emailHtml,
    };

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'Harmonie Cils <noreply@harmoniecils.com>',
        ...emailData
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      await supabaseClient.from('email_logs').insert({
        booking_id: bookingId,
        email_type: 'confirmation',
        recipient_email: booking.client_email,
        status: 'failed',
        error_message: JSON.stringify(emailResult)
      });
      throw new Error('Failed to send email');
    }

    await supabaseClient.from('email_logs').insert({
      booking_id: bookingId,
      email_type: 'confirmation',
      recipient_email: booking.client_email,
      status: 'sent'
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Confirmation email sent successfully' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function generateConfirmationEmail(booking: any, cancellationUrl: string): string {
  const formatDate = (dateStr: string) => {
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
  <title>Confirmation de rendez-vous</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #d4a574 0%, #c49563 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: 0.5px;">✨ Harmonie Cils</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">Confirmation de rendez-vous</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${booking.client_first_name} ${booking.client_name}</strong>,
              </p>
              
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Nous sommes ravis de confirmer votre rendez-vous chez Harmonie Cils. Voici les détails :
              </p>

              <!-- Booking Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf8f5; border-left: 4px solid #d4a574; border-radius: 8px; margin-bottom: 30px;">
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
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding: 8px 0;">📧 <strong>Email :</strong></td>
                        <td style="color: #333333; font-size: 14px; text-align: right; padding: 8px 0;">${booking.client_email}</td>
                      </tr>
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding: 8px 0;">📱 <strong>Téléphone :</strong></td>
                        <td style="color: #333333; font-size: 14px; text-align: right; padding: 8px 0;">${booking.client_phone}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Important Notes -->
              <div style="background-color: #e8f4f8; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 12px 0; color: #1e5f7a; font-size: 16px;">ℹ️ Informations importantes</h3>
                <ul style="margin: 0; padding-left: 20px; color: #333333; font-size: 14px; line-height: 1.8;">
                  <li>Merci d'arriver 5 minutes avant votre rendez-vous</li>
                  <li>N'hésitez pas à nous contacter pour toute question</li>
                  <li>Vous recevrez un rappel 24 heures avant votre rendez-vous</li>
                </ul>
              </div>

              <!-- Cancel Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${cancellationUrl}" style="display: inline-block; background-color: #dc3545; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 500; transition: background-color 0.3s;">Annuler le rendez-vous</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #666666; font-size: 13px; line-height: 1.6; text-align: center;">
                Vous pouvez annuler votre rendez-vous à tout moment en cliquant sur le bouton ci-dessus.
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
                Email: contact@harmoniecils.com | Téléphone: 06 XX XX XX XX
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
