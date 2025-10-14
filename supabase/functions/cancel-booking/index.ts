import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CancelBookingRequest {
  token: string;
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

    const { token }: CancelBookingRequest = await req.json();

    if (!token) {
      throw new Error('Token is required');
    }

    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('cancellation_tokens')
      .select('*, bookings(*)')
      .eq('token', token)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Token invalide ou expiré' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (tokenData.used_at) {
      return new Response(
        JSON.stringify({ error: 'Ce rendez-vous a déjà été annulé' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: 'Ce lien d\'annulation a expiré' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { error: updateBookingError } = await supabaseClient
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', tokenData.booking_id);

    if (updateBookingError) {
      throw new Error('Failed to cancel booking');
    }

    const { error: updateTokenError } = await supabaseClient
      .from('cancellation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    if (updateTokenError) {
      console.error('Failed to update token:', updateTokenError);
    }

    const booking = tokenData.bookings;
    const emailHtml = generateCancellationConfirmationEmail(booking);

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        },
        body: JSON.stringify({
          from: 'Harmonie Cils <noreply@harmoniecils.com>',
          to: booking.client_email,
          subject: '❌ Confirmation d\'annulation - Harmonie Cils',
          html: emailHtml,
        }),
      });
    } catch (emailError) {
      console.error('Failed to send cancellation confirmation email:', emailError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Rendez-vous annulé avec succès',
        booking: {
          service: booking.service_name,
          date: booking.preferred_date,
          time: booking.preferred_time
        }
      }),
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

function generateCancellationConfirmationEmail(booking: any): string {
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
  <title>Confirmation d'annulation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #e57373 0%, #ef5350 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: 0.5px;">❌ Harmonie Cils</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">Confirmation d'annulation</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${booking.client_first_name} ${booking.client_name}</strong>,
              </p>
              
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Votre rendez-vous a été annulé avec succès. Nous espérons vous revoir très prochainement !
              </p>

              <!-- Cancelled Booking Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef5f5; border-left: 4px solid #e57373; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="margin: 0 0 15px 0; color: #c62828; font-size: 16px;">Rendez-vous annulé</h3>
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

              <!-- Rebook Message -->
              <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
                <h3 style="margin: 0 0 12px 0; color: #2e7d32; font-size: 16px;">💚 Envie de reprendre rendez-vous ?</h3>
                <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6;">
                  N'hésitez pas à réserver un nouveau créneau sur notre site web.<br>
                  Nous serons ravis de vous accueillir !
                </p>
              </div>

              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                Si vous avez des questions, n'hésitez pas à nous contacter.
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
