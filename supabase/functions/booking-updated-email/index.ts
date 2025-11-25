// booking-updated-email
// Sends update notification when a booking changes.
const DEFAULTS = {
  FROM_NAME: 'Harmonie Cils Studio',
  FROM_EMAIL: 'Harmoniecilsstudio@gmail.com',
  SALON_EMAIL: 'Harmoniecilsstudio@gmail.com',
  SALON_PHONE: '07 70 16 65 71'
};
async function sendSMTP({ host, port, user, pass, from, to, subject, html, text }) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const conn = await Deno.connect({
    hostname: host,
    port
  });
  const read = async ()=>decoder.decode(await conn.read(new Uint8Array(4096))).trim();
  const write = async (s)=>{
    await conn.write(encoder.encode(s));
  };
  await read();
  await write(`EHLO supabase-edge\r\n`);
  await read();
  await write(`STARTTLS\r\n`);
  await read();
  // @ts-ignore
  const tlsConn = await Deno.upgradeTls(conn, {
    hostname: host
  });
  const tlsRead = async ()=>decoder.decode(await tlsConn.read(new Uint8Array(4096))).trim();
  const tlsWrite = async (s)=>{
    await tlsConn.write(encoder.encode(s));
  };
  await tlsWrite(`EHLO supabase-edge\r\n`);
  await tlsRead();
  await tlsWrite(`AUTH LOGIN\r\n`);
  await tlsRead();
  await tlsWrite(b64(user) + `\r\n`);
  await tlsRead();
  await tlsWrite(b64(pass) + `\r\n`);
  await tlsRead();
  await tlsWrite(`MAIL FROM:<${from}>\r\n`);
  await tlsRead();
  await tlsWrite(`RCPT TO:<${to}>\r\n`);
  await tlsRead();
  await tlsWrite(`DATA\r\n`);
  await tlsRead();
  const boundary = `b-${crypto.randomUUID()}`;
  const message = buildMime({
    from,
    to,
    subject,
    html,
    text,
    boundary
  });
  await tlsWrite(message);
  await tlsWrite(`\r\n.\r\n`);
  await tlsRead();
  await tlsWrite(`QUIT\r\n`);
  await tlsRead();
}
function b64(s) {
  return btoa(unescape(encodeURIComponent(s)));
}
function buildMime({ from, to, subject, html, text, boundary }) {
  const t = text ?? html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return [
    `From: ${DEFAULTS.FROM_NAME} <${from}>`,
    `To: <${to}>`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    t,
    `--${boundary}`,
    `Content-Type: text/html; charset=utf-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    html,
    `--${boundary}--`,
    ``
  ].join('\r\n');
}
function formatDate(dateIso, tz = 'Europe/Paris') {
  const d = new Date(dateIso);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: tz
  }).format(d);
}
function formatTime(dateIso, tz = 'Europe/Paris') {
  const d = new Date(dateIso);
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz
  }).format(d);
}
function updatedTemplate(p) {
  const tz = p.timezone || 'Europe/Paris';
  const date = formatDate(p.starts_at, tz);
  const start = formatTime(p.starts_at, tz);
  const end = p.ends_at ? formatTime(p.ends_at, tz) : undefined;
  const duration = end ? `${start}–${end}` : `${start}`;
  const subject = `Mise à jour de votre rendez-vous — Harmonie Cils Studio`;
  const body = `Bonjour ${p.client_first_name},\n\nLes informations de votre rendez-vous ont été mises à jour.\n\nPrestation: ${p.service_name}\nNouvelle date: ${date} (${tz})\nNouvelle heure: ${duration}\nRéférence: ${p.booking_ref ?? ''}\n\nPour annuler ou modifier, contactez-nous :\nEmail: ${DEFAULTS.SALON_EMAIL}\nTéléphone: ${DEFAULTS.SALON_PHONE}\n\nHarmonie Cils Studio`;
  const html = `<div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#111">
  <p>Bonjour ${escapeHtml(p.client_first_name)},</p>
  <p>Les informations de votre rendez-vous ont été mises à jour.</p>
  <ul>
    <li><strong>Prestation</strong> : ${escapeHtml(p.service_name)}</li>
    <li><strong>Nouvelle date</strong> : ${escapeHtml(date)} (${tz})</li>
    <li><strong>Nouvelle heure</strong> : ${escapeHtml(duration)}</li>
    ${p.booking_ref ? `<li><strong>Référence</strong> : ${escapeHtml(p.booking_ref)}</li>` : ''}
  </ul>
  <p>Pour annuler ou modifier, contactez-nous :</p>
  <p>Email : <a href="mailto:${DEFAULTS.SALON_EMAIL}">${DEFAULTS.SALON_EMAIL}</a><br/>Téléphone : <a href="tel:+33770166571">07 70 16 65 71</a></p>
  <p>Harmonie Cils Studio</p>
</div>`;
  return {
    subject,
    text: body,
    html
  };
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c)=>({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#39;'
    })[c]);
}
Deno.serve(async (req)=>{
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', {
      status: 405
    });
    const payload = await req.json();
    const host = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
    const port = parseInt(Deno.env.get('SMTP_PORT') || '587', 10);
    const user = Deno.env.get('SMTP_USER') || 'castro.oceane@laposte.net';
    const pass = Deno.env.get('SMTP_PASSWORD');
    const { subject, html, text } = updatedTemplate(payload);
    if (!pass) {
      return Response.json({
        preview: {
          subject,
          html,
          text,
          to: payload.customer_email
        }
      });
    }
    await sendSMTP({
      host,
      port,
      user,
      pass,
      from: DEFAULTS.FROM_EMAIL,
      to: payload.customer_email,
      subject,
      html,
      text
    });
    return Response.json({
      ok: true
    });
  } catch (e) {
    console.error(e);
    return new Response('Internal Server Error', {
      status: 500
    });
  }
});
