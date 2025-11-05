// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { buildCors, handleOptions } from '../utils/cors.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
// CORS unifié
const buildCorsHeaders = (origin)=>({
    ...buildCors(origin ?? undefined),
    'Content-Type': 'application/json; charset=utf-8',
    'Connection': 'keep-alive'
  });
function isAdmin(jwt) {
  const appMeta = jwt?.app_metadata ?? {};
  const userMeta = jwt?.user_metadata ?? {};
  const role = appMeta.role || userMeta.role;
  return role === 'admin';
}
function normHHMM(v) {
  if (v === null) return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(v);
  if (!m) return null;
  return `${m[1]}:${m[2]}:00`;
}
console.info('upsert-hours started');
Deno.serve(async (req)=>{
  const origin = req.headers.get('Origin');
  const corsHeaders = buildCorsHeaders(origin);
  const opt = handleOptions(req);
  if (opt) return opt;
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return new Response(JSON.stringify({
        error: 'missing_bearer_token'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false
      }
    });
    const { data: jwtData, error: jwtErr } = await adminClient.auth.getUser(token);
    if (jwtErr || !jwtData?.user) {
      return new Response(JSON.stringify({
        error: 'invalid_token'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }
    if (!isAdmin(jwtData.user)) {
      return new Response(JSON.stringify({
        error: 'forbidden_not_admin'
      }), {
        status: 403,
        headers: corsHeaders
      });
    }
    const payload = await req.json().catch(()=>null);
    if (!Array.isArray(payload)) {
      return new Response(JSON.stringify({
        error: 'invalid_json_array'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    // Validation + normalisation
    const rows = [];
    for (const item of payload){
      if (typeof item?.day_of_week !== 'number' || item.day_of_week < 0 || item.day_of_week > 6) {
        return new Response(JSON.stringify({
          error: 'invalid_day_of_week'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      const is_closed = !!item.is_closed;
      const open_time = normHHMM(item.open_time);
      const close_time = normHHMM(item.close_time);
      if (!is_closed) {
        if (!open_time || !close_time) {
          return new Response(JSON.stringify({
            error: 'open_close_required_when_open'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }
        // simple order check
        if (open_time >= close_time) {
          return new Response(JSON.stringify({
            error: 'open_time_must_be_lt_close_time'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }
      }
      rows.push({
        day_of_week: item.day_of_week,
        open_time: is_closed ? null : open_time,
        close_time: is_closed ? null : close_time,
        is_closed
      });
    }
    const db = adminClient; // service role
    const { data, error } = await db.from('business_hours').upsert(rows, {
      onConflict: 'day_of_week'
    }).select('*').order('day_of_week', {
      ascending: true
    });
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: corsHeaders
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({
      error: 'internal_error'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
