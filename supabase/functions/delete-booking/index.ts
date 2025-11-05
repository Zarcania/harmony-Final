// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { buildCors, handleOptions } from '../utils/cors.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const cors = (origin)=>({
    ...buildCors(origin ?? undefined),
    'Content-Type': 'application/json; charset=utf-8'
  });
function isAdmin(jwt) {
  const appMeta = jwt?.app_metadata ?? {};
  const userMeta = jwt?.user_metadata ?? {};
  const role = appMeta.role || userMeta.role;
  return role === 'admin';
}
Deno.serve(async (req)=>{
  const origin = req.headers.get('Origin');
  const headers = cors(origin);
  const opt = handleOptions(req);
  if (opt) return opt;
  try {
    const bearer = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (!bearer) return new Response(JSON.stringify({
      error: 'missing_bearer_token'
    }), {
      status: 401,
      headers
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false
      }
    });
    const { data: auth } = await admin.auth.getUser(bearer);
    if (!auth?.user || !isAdmin(auth.user)) return new Response(JSON.stringify({
      error: 'forbidden_not_admin'
    }), {
      status: 403,
      headers
    });
    const body = await req.json().catch(()=>null);
    const id = body?.booking_id?.trim();
    if (!id) return new Response(JSON.stringify({
      error: 'booking_id_required'
    }), {
      status: 400,
      headers
    });
    // Récupère la ligne et son statut actuel
    const { data: row, error: selErr } = await admin.from('bookings').select('status').eq('id', id).maybeSingle();
    if (selErr) return new Response(JSON.stringify({
      error: selErr.message
    }), {
      status: 400,
      headers
    });
    if (!row) return new Response(JSON.stringify({
      error: 'not_found'
    }), {
      status: 404,
      headers
    });
    // Si non annulé, on annule d'abord puis on supprime (sécurité + UX admin)
    if (row.status !== 'cancelled') {
      const { error: updErr } = await admin.from('bookings').update({
        status: 'cancelled'
      }).eq('id', id);
      if (updErr) return new Response(JSON.stringify({
        error: updErr.message
      }), {
        status: 400,
        headers
      });
    }
    const { error: delErr } = await admin.from('bookings').delete().eq('id', id);
    if (delErr) return new Response(JSON.stringify({
      error: delErr.message
    }), {
      status: 400,
      headers
    });
    return new Response(JSON.stringify({
      ok: true
    }), {
      status: 200,
      headers
    });
  } catch (e) {
    return new Response(JSON.stringify({
      error: 'internal_error',
      message: e?.message || 'unknown'
    }), {
      status: 500,
      headers
    });
  }
});
