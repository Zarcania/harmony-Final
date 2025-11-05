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
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const now = new Date();
    const cutoff = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    // Récupérer les IDs des bookings annulés avant la limite
    const { data: oldCancelled, error } = await supabase.from('bookings').select('id, updated_at').eq('status', 'cancelled').lt('updated_at', cutoff);
    if (error) return json({
      error: 'fetch_failed',
      message: error.message
    }, 500);
    if (!oldCancelled || oldCancelled.length === 0) {
      return json({
        ok: true,
        message: 'No cancelled bookings to delete',
        count: 0
      });
    }
    const ids = oldCancelled.map((b)=>b.id);
    const { error: delErr } = await supabase.from('bookings').delete().in('id', ids);
    if (delErr) return json({
      error: 'delete_failed',
      message: delErr.message,
      count: ids.length
    }, 500);
    return json({
      ok: true,
      message: 'Deleted old cancelled bookings',
      count: ids.length
    });
  } catch (e) {
    return json({
      error: 'server_error',
      message: e?.message ?? 'unknown'
    }, 500);
  }
});
