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
const toTime = (v)=>{
  if (v == null) return null;
  const m = v.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return null;
  return `${m[1]}:${m[2]}:00`;
};
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
    const payload = await req.json().catch(()=>null);
    if (!Array.isArray(payload)) return new Response(JSON.stringify({
      error: 'invalid_json_array'
    }), {
      status: 400,
      headers
    });
    const rows = [];
    for (const it of payload){
      if (typeof it?.day_of_week !== 'number' || it.day_of_week < 0 || it.day_of_week > 6) {
        return new Response(JSON.stringify({
          error: 'invalid_day_of_week'
        }), {
          status: 400,
          headers
        });
      }
      const enabled = !!it.enabled;
      const s = toTime(it.break_start);
      const e = toTime(it.break_end);
      // Assouplissement: si enabled=true mais heures manquantes, on accepte; on ne valide l'ordre que si les deux heures sont présentes
      if (enabled && s && e) {
        if (s >= e) return new Response(JSON.stringify({
          error: 'start_must_be_lt_end'
        }), {
          status: 400,
          headers
        });
      }
      rows.push({
        day_of_week: it.day_of_week,
        break_start: enabled ? s : null,
        break_end: enabled ? e : null,
        enabled
      });
    }
    const { data, error } = await admin.from('business_breaks').upsert(rows, {
      onConflict: 'day_of_week'
    }).select('*').order('day_of_week', {
      ascending: true
    });
    if (error) return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers
    });
    return new Response(JSON.stringify(data), {
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
