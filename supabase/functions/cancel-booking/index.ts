import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://harmoniecils.com,http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

const cors = (origin?: string) => {
  const o = origin && allowed.includes(origin) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  } as Record<string, string>;
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') ?? undefined;
  const headers = cors(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Read token from GET ?token=... or POST { token }
  let token: string | undefined;
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      token = url.searchParams.get('token') ?? undefined;
    } else if (req.method === 'POST') {
      const body = await req.json();
      token = typeof body?.token === 'string' ? body.token : undefined;
    } else {
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_payload' }), { status: 400, headers });
  }

  if (!token) {
    return new Response(JSON.stringify({ error: 'invalid_payload', message: 'Token manquant' }), { status: 400, headers });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Transactional RPC call
    const { data, error } = await supabase.rpc('cancel_booking_with_log', { p_token: token });

    if (error) {
      console.error('RPC error:', error);
      return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers });
    }

    if (!data || data.success !== true) {
      const code = data?.code ?? 'invalid_or_expired_token';
      const status = code === 'invalid_payload' ? 400 : code === 'invalid_or_expired_token' ? 410 : 500;
      return new Response(JSON.stringify({ error: code, message: data?.message ?? 'Annulation impossible' }), { status, headers });
    }

    return new Response(JSON.stringify({ success: true, message: data.message, booking: data.booking }), { status: 200, headers });
  } catch (e) {
    console.error('Unhandled error:', e);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers });
  }
});
