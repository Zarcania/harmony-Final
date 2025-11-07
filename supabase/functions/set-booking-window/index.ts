// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { buildCors, handleOptions } from '../utils/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const buildCorsHeaders = (origin?: string) => ({
  ...buildCors(origin ?? undefined),
  'Content-Type': 'application/json; charset=utf-8',
  'Connection': 'keep-alive'
});

function isAdmin(jwt: any) {
  const appMeta = jwt?.app_metadata ?? {};
  const userMeta = jwt?.user_metadata ?? {};
  const role = appMeta.role || userMeta.role;
  return role === 'admin';
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin') ?? undefined;
  const cors = buildCorsHeaders(origin);
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'missing_bearer_token' }), { status: 401, headers: cors });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    // Allow local service-role bypass (token equals service role key)
    let isServiceBypass = false;
    if (token && (token === SERVICE_ROLE_KEY)) {
      isServiceBypass = true;
    }

    if (!isServiceBypass) {
      const { data: userInfo, error: userErr } = await admin.auth.getUser(token);
      if (userErr || !userInfo?.user) {
        return new Response(JSON.stringify({ error: 'invalid_token' }), { status: 401, headers: cors });
      }
      if (!isAdmin(userInfo.user)) {
        return new Response(JSON.stringify({ error: 'forbidden_not_admin' }), { status: 403, headers: cors });
      }
    }

    let payload: any = null;
    try { payload = await req.json(); } catch { /* ignore */ }
    if (!payload || (typeof payload !== 'object')) {
      return new Response(JSON.stringify({ error: 'invalid_payload' }), { status: 400, headers: cors });
    }

    const tz = 'Europe/Paris';
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
    let days: number | undefined = Number.isFinite(payload.days) ? Number(payload.days) : undefined;

    if (!Number.isFinite(days) && typeof payload.last_bookable_date === 'string') {
      const s = String(payload.last_bookable_date).slice(0,10);
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return new Response(JSON.stringify({ error: 'invalid_last_bookable_date' }), { status: 400, headers: cors });
      const target = new Date(`${s}T00:00:00`);
      const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const diffDays = Math.round((target.getTime() - base.getTime()) / 86400000);
      days = diffDays;
    }

    if (!Number.isFinite(days)) {
      return new Response(JSON.stringify({ error: 'missing_days' }), { status: 400, headers: cors });
    }

    // Clamp to sane bounds (0..90)
    const bounded = clamp(Math.trunc(days as number), 0, 90);

    const { error } = await admin
      .from('app_settings')
      .upsert({ key: 'booking_max_days', value: String(bounded) }, { onConflict: 'key' });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: cors });
    }

    return new Response(JSON.stringify({ key: 'booking_max_days', value: bounded }), { status: 200, headers: cors });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500, headers: cors });
  }
});
