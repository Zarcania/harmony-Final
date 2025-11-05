// @ts-nocheck
import { buildCors, handleOptions } from '../utils/cors.ts';
Deno.serve(async (req)=>{
  const origin = req.headers.get('Origin') || undefined;
  const cors = buildCors(origin);
  const opt = handleOptions(req);
  if (opt) return opt;
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'method_not_allowed'
      }), {
        status: 405,
        headers: {
          ...cors,
          'Content-Type': 'application/json'
        }
      });
    }
    let body = {};
    try {
      body = await req.json();
    } catch  {
      return new Response(JSON.stringify({
        error: 'invalid_json'
      }), {
        status: 400,
        headers: {
          ...cors,
          'Content-Type': 'application/json'
        }
      });
    }
    const to = (body.to || '').trim();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return new Response(JSON.stringify({
        error: 'invalid_to'
      }), {
        status: 400,
        headers: {
          ...cors,
          'Content-Type': 'application/json'
        }
      });
    }
    const subject = body.subject || 'Test Resend — Harmonie Cils';
    const html = body.html || `<p>Bonjour,</p><p>Ceci est un email de test envoyé depuis l'environnement local via Resend.</p>`;
    const apiKey = Deno.env.get('RESEND_API_KEY') || '';
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'missing_resend_api_key'
      }), {
        status: 500,
        headers: {
          ...cors,
          'Content-Type': 'application/json'
        }
      });
    }
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'Harmonie Cils <noreply@harmoniecils.com>',
        to,
        subject,
        html
      })
    });
    const ok = resp.ok;
    const text = await resp.text().catch(()=>'');
    return new Response(JSON.stringify({
      ok,
      status: resp.status,
      body: text.slice(0, 500)
    }), {
      status: ok ? 200 : resp.status,
      headers: {
        ...cors,
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      error: 'server_error',
      message: e?.message || 'unknown'
    }), {
      status: 500,
      headers: {
        ...cors,
        'Content-Type': 'application/json'
      }
    });
  }
});
