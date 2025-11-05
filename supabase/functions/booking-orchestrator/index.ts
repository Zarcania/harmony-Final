// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { buildCors, handleOptions } from '../utils/cors.ts';
Deno.serve(async (req)=>{
  const origin = req.headers.get('Origin') || undefined;
  const cors = buildCors(origin);
  const json = (body, status = 200)=>new Response(JSON.stringify(body), {
      status,
      headers: {
        ...cors,
        'Content-Type': 'application/json'
      }
    });
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== 'POST') {
    return json({
      error: 'method_not_allowed'
    }, 405);
  }
  try {
    const { booking_id, bookingId } = await req.json().catch(()=>({}));
    const id = booking_id || bookingId;
    if (!id) return json({
      error: 'invalid_payload',
      message: 'booking_id requis'
    }, 400);
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    // 1) Mettre à jour le statut en 'confirmed' (DB interne en EN)
    const { error: eUpd } = await supabase.from('bookings').update({
      status: 'confirmed',
      updated_at: new Date().toISOString()
    }).eq('id', id);
    if (eUpd) return json({
      error: 'update_failed'
    }, 500);
    // 2) Appeler la fonction d'envoi de confirmation
    let sent = false;
    try {
      const fnUrl = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/?$/, '') + '/functions/v1/send-booking-confirmation';
      const svcKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      const resp = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${svcKey}`
        },
        body: JSON.stringify({
          booking_id: id
        })
      });
      if (resp.ok) {
        const j = await resp.json().catch(()=>({}));
        sent = !!j?.sent || j?.success === true;
      }
    } catch (_) {}
    // 3) Répondre avec le statut FR attendu, tout en gardant DB en EN
    return json({
      ok: true,
      status: 'confirme',
      sent
    });
  } catch (e) {
    return json({
      error: 'server_error',
      message: e?.message ?? 'unknown'
    }, 500);
  }
});
