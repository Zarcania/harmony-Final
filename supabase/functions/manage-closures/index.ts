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
const isDate = (v)=>/^\d{4}-\d{2}-\d{2}$/.test(v);
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
    if (!payload || !payload.op || !payload.data) return new Response(JSON.stringify({
      error: 'invalid_payload'
    }), {
      status: 400,
      headers
    });
    if (payload.op === 'insert') {
      const d = payload.data;
      const sd = d.start_date?.trim();
      const ed = d.end_date?.trim();
      if (!sd || !ed || !isDate(sd) || !isDate(ed)) return new Response(JSON.stringify({
        error: 'invalid_dates'
      }), {
        status: 400,
        headers
      });
      if (sd > ed) return new Response(JSON.stringify({
        error: 'start_must_be_lte_end'
      }), {
        status: 400,
        headers
      });
      const reason = (d.reason ?? '').toString();
      const { data, error } = await admin.from('closures').insert({
        start_date: sd,
        end_date: ed,
        reason
      }).select('*').single();
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
    }
    if (payload.op === 'update') {
      const d = payload.data;
      if (!d.id) return new Response(JSON.stringify({
        error: 'missing_id'
      }), {
        status: 400,
        headers
      });
      const upd = {};
      if (d.start_date !== undefined) {
        if (!isDate(d.start_date)) return new Response(JSON.stringify({
          error: 'invalid_start_date'
        }), {
          status: 400,
          headers
        });
        upd.start_date = d.start_date;
      }
      if (d.end_date !== undefined) {
        if (!isDate(d.end_date)) return new Response(JSON.stringify({
          error: 'invalid_end_date'
        }), {
          status: 400,
          headers
        });
        upd.end_date = d.end_date;
      }
      if (d.reason !== undefined) upd.reason = (d.reason ?? '').toString();
      // Optional: enforce start <= end if both provided
      if (upd.start_date && upd.end_date && upd.start_date > upd.end_date) {
        return new Response(JSON.stringify({
          error: 'start_must_be_lte_end'
        }), {
          status: 400,
          headers
        });
      }
      const { error } = await admin.from('closures').update(upd).eq('id', d.id);
      if (error) return new Response(JSON.stringify({
        error: error.message
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
    }
    if (payload.op === 'delete') {
      const d = payload.data;
      if (!d.id) return new Response(JSON.stringify({
        error: 'missing_id'
      }), {
        status: 400,
        headers
      });
      const { error } = await admin.from('closures').delete().eq('id', d.id);
      if (error) return new Response(JSON.stringify({
        error: error.message
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
    }
    return new Response(JSON.stringify({
      error: 'unsupported_op'
    }), {
      status: 400,
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
