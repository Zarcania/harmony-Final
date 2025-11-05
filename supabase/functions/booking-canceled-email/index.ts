// @ts-nocheck
// booking-canceled-email
// Sends cancel notification
const DEFAULTS = {
  FROM_NAME: 'Harmonie Cils Studio',
  FROM_EMAIL: 'contact@harmoniecils.com',
  SALON_EMAIL: 'contact@harmoniecils.com',
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
import { cancellationTemplate as canceledTemplate } from '../utils/emailTemplates.ts'
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
    const user = Deno.env.get('SMTP_USER') || 'contact@harmoniecils.com';
    const pass = Deno.env.get('SMTP_PASS') || '';
    const { subject, html, text } = canceledTemplate(payload);
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
