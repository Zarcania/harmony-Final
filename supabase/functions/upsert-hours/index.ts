import { createClient } from "npm:@supabase/supabase-js@2.45.1";

type HourItem = {
  day_of_week: number;
  open_time: string | null;  // 'HH:MM' or null
  close_time: string | null; // 'HH:MM' or null
  is_closed: boolean;
};

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function buildCorsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin);
  return {
    'Vary': 'Origin',
    'Access-Control-Allow-Origin': allowed ? origin! : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json; charset=utf-8',
    'Connection': 'keep-alive',
  };
}

function isAdmin(jwt: any): boolean {
  const appMeta = jwt?.app_metadata ?? {};
  const userMeta = jwt?.user_metadata ?? {};
  const role = appMeta.role || userMeta.role;
  return role === 'admin';
}

function normHHMM(v: string | null): string | null {
  if (v === null) return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(v);
  if (!m) return null;
  return `${m[1]}:${m[2]}:00`;
}

console.info('upsert-hours started');

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'missing_bearer_token' }), { status: 401, headers: corsHeaders });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: jwtData, error: jwtErr } = await adminClient.auth.getUser(token);
    if (jwtErr || !jwtData?.user) {
      return new Response(JSON.stringify({ error: 'invalid_token' }), { status: 401, headers: corsHeaders });
    }
    if (!isAdmin(jwtData.user)) {
      return new Response(JSON.stringify({ error: 'forbidden_not_admin' }), { status: 403, headers: corsHeaders });
    }

    const payload = await req.json().catch(() => null) as HourItem[] | null;
    if (!Array.isArray(payload)) {
      return new Response(JSON.stringify({ error: 'invalid_json_array' }), { status: 400, headers: corsHeaders });
    }

    // Validation + normalisation
    const rows = [] as Array<{ day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean; }>;
    for (const item of payload) {
      if (typeof item?.day_of_week !== 'number' || item.day_of_week < 0 || item.day_of_week > 6) {
        return new Response(JSON.stringify({ error: 'invalid_day_of_week' }), { status: 400, headers: corsHeaders });
      }
      const is_closed = !!item.is_closed;
      const open_time = normHHMM(item.open_time);
      const close_time = normHHMM(item.close_time);

      if (!is_closed) {
        if (!open_time || !close_time) {
          return new Response(JSON.stringify({ error: 'open_close_required_when_open' }), { status: 400, headers: corsHeaders });
        }
        // simple order check
        if (open_time >= close_time) {
          return new Response(JSON.stringify({ error: 'open_time_must_be_lt_close_time' }), { status: 400, headers: corsHeaders });
        }
      }

      rows.push({
        day_of_week: item.day_of_week,
        open_time: is_closed ? null : open_time,
        close_time: is_closed ? null : close_time,
        is_closed,
      });
    }

    const db = adminClient; // service role
    const { data, error } = await db
      .from('business_hours')
      .upsert(rows, { onConflict: 'day_of_week' })
      .select('*')
      .order('day_of_week', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500, headers: corsHeaders });
  }
});
