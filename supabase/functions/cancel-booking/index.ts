import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { buildCors, handleOptions } from '../utils/cors.ts'

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') ?? undefined;
  const headers = { ...buildCors(origin), 'Content-Type': 'application/json' } as Record<string, string>;
  const opt = handleOptions(req);
  if (opt) return opt;

  // Read token from GET ?token=... or POST { token } OR booking_id
  let token: string | undefined;
  let bookingId: string | undefined;
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      token = url.searchParams.get('token') ?? undefined;
      bookingId = url.searchParams.get('booking_id') ?? undefined;
    } else if (req.method === 'POST') {
      const body = await req.json();
      token = typeof body?.token === 'string' ? body.token : undefined;
      bookingId = typeof body?.booking_id === 'string' ? body.booking_id : undefined;
    } else {
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_payload' }), { status: 400, headers });
  }
  if (!token && !bookingId) {
    return new Response(JSON.stringify({ error: 'invalid_payload', message: 'token ou booking_id requis' }), { status: 400, headers });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Transactional RPC call: prefer token, fallback to booking_id
    let data: any = null;
    let error: any = null;
    if (token) {
      ({ data, error } = await supabase.rpc('cancel_booking_with_log', { p_token: token }));
    } else if (bookingId) {
      ({ data, error } = await supabase.rpc('cancel_booking_tx', { p_booking_id: bookingId }));
    }

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
