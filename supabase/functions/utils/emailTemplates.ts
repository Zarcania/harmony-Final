// @ts-nocheck
// Templates email centralisés (confirmation, rappel, annulation)

function esc(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

export function formatDateFR(dateIso: string, tz = 'Europe/Paris') {
  const d = new Date(dateIso)
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: tz
  }).format(d)
}

export function formatTimeFR(dateIso: string, tz = 'Europe/Paris') {
  const d = new Date(dateIso)
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit', minute: '2-digit', timeZone: tz
  }).format(d)
}

// Confirmation
export function confirmationTemplate(params: { booking: any, confirmUrl: string, cancelUrl: string }) {
  const { booking, confirmUrl, cancelUrl } = params
  const subject = `Confirmation de rendez-vous - ${booking.service_name} - ${booking.preferred_date}`
  const html = `
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
          <p style="margin:0 0 20px 0;color:#333;font-size:16px;line-height:1.6;">Bonjour <strong>${esc(booking.client_name || '')}</strong>,</p>
          <p style="margin:0 0 20px 0;color:#333;font-size:16px;line-height:1.6;">Récapitulatif de votre demande:</p>
          <table width="100%" cellpadding="8" cellspacing="0" style="background-color:#faf8f5;border-left:4px solid #d4a574;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr><td style="color:#666;font-size:14px;padding:8px 0;">📋 <strong>Service :</strong></td><td style="color:#333;font-size:14px;text-align:right;padding:8px 0;">${esc(booking.service_name)}</td></tr>
                <tr><td style="color:#666;font-size:14px;padding:8px 0;">📅 <strong>Date :</strong></td><td style="color:#333;font-size:14px;text-align:right;padding:8px 0;">${esc(new Date(booking.preferred_date).toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' }))}</td></tr>
                <tr><td style="color:#666;font-size:14px;padding:8px 0;">🕐 <strong>Heure :</strong></td><td style="color:#333;font-size:14px;text-align:right;padding:8px 0;">${esc(booking.preferred_time ?? '')}</td></tr>
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
</html>`
  const text = `Bonjour ${booking.client_name || ''},\n\nConfirmation de rendez-vous pour ${booking.service_name} le ${booking.preferred_date} à ${booking.preferred_time}.\nConfirmer: ${confirmUrl}\nAnnuler: ${cancelUrl}`
  return { subject, html, text }
}

// Rappel (H-24)
export function reminderTemplate(p: { client_first_name?: string, service_name: string, starts_at: string, ends_at?: string, booking_ref?: string, customer_email?: string, timezone?: string, cancellationUrl: string }) {
  const tz = p.timezone || 'Europe/Paris'
  const date = formatDateFR(p.starts_at, tz)
  const start = formatTimeFR(p.starts_at, tz)
  const end = p.ends_at ? formatTimeFR(p.ends_at, tz) : undefined
  const duration = end ? `${start}–${end}` : `${start}`
  const subject = `Rappel de rendez-vous — Harmonie Cils Studio (${date} à ${start})`
  const text = `Bonjour ${p.client_first_name || ''},\n\nPetit rappel pour votre rendez-vous :\nPrestation: ${p.service_name}\nDate: ${date} (${tz})\nHeure: ${duration}\n\nAnnulation: ${p.cancellationUrl}`
  const html = `<div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#111">
  <p>Bonjour ${esc(p.client_first_name || '')},</p>
  <p>Petit rappel pour votre rendez-vous :</p>
  <ul>
    <li><strong>Prestation</strong> : ${esc(p.service_name)}</li>
    <li><strong>Date</strong> : ${esc(date)} (${tz})</li>
    <li><strong>Heure</strong> : ${esc(duration)}</li>
  </ul>
  <p><a href="${p.cancellationUrl}" style="display:inline-block;background:#dc3545;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px">Annuler le rendez-vous</a></p>
</div>`
  return { subject, html, text }
}

// Annulation
export function cancellationTemplate(p: { client_first_name?: string, booking_ref?: string }) {
  const subject = `Annulation de rendez-vous — Harmonie Cils Studio`
  const text = `Bonjour ${p.client_first_name || ''},\n\nVotre rendez-vous a été annulé. ${p.booking_ref ? `Référence: ${p.booking_ref}.` : ''}`
  const html = `<div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#111">
  <p>Bonjour ${esc(p.client_first_name || '')},</p>
  <p>Votre rendez-vous a été annulé. ${p.booking_ref ? `Référence : <strong>${esc(p.booking_ref)}</strong>.` : ''}</p>
  <p>Harmonie Cils Studio</p>
</div>`
  return { subject, html, text }
}
