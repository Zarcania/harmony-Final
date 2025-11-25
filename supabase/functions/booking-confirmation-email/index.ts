// @ts-nocheck
// booking-confirmation-email
// Sends confirmation email via Gmail SMTP using provided creds
// Assumptions: bookings payload is posted to this function with all fields below.
// Env secrets expected: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_NAME, FROM_EMAIL
// If secrets are not set, function will use the provided inline defaults (for demo), but in production set secrets via `supabase secrets set`.
// NOTE: For production, move shared utils to _shared and remove inline defaults.
const DEFAULTS = {
  FROM_NAME: 'Harmonie Cils Studio',
  FROM_EMAIL: 'Harmoniecilsstudio@gmail.com',
  SALON_EMAIL: 'Harmoniecilsstudio@gmail.com',
  SALON_PHONE: '07 70 16 65 71'
};
async function sendSMTP({ host, port, user, pass, from, to, subject, html, text }) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  // Plain TCP
  const conn = await Deno.connect({
    hostname: host,
    port
  });
  const read = async ()=>decoder.decode(await conn.read(new Uint8Array(4096))).trim();
  const write = async (s)=>{
    await conn.write(encoder.encode(s));
  };
  await read() // banner
  ;
  await write(`EHLO supabase-edge\r\n`);
  await read();
  // STARTTLS
  await write(`STARTTLS\r\n`);
  await read();
  // Upgrade to TLS
  // @ts-ignore: Deno.upgradeTls is available in Edge runtime
  // deno-lint-ignore no-explicit-any
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
import { confirmationTemplate } from '../utils/emailTemplates.ts'
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
    const { subject, html, text } = confirmationTemplate(payload);
    if (!pass) {
      console.warn('SMTP_PASS missing — running in preview/log mode (no send)');
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
