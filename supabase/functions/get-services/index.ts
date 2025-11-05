// @ts-nocheck
// Déclare Deno pour l'analyse TS hors runtime Deno
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { buildCors, handleOptions } from '../utils/cors.ts';
Deno.serve(async (req)=>{
  const opt = handleOptions(req);
  if (opt) return opt;
  const origin = req.headers.get('Origin') ?? undefined;
  const cors = buildCors(origin);
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseSrv = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    const { data: services, error: sErr } = await supabaseSrv.from('services').select('id,title,icon,order_index').order('order_index', {
      ascending: true
    });
    if (sErr) throw sErr;
    const sections = [];
    for (const s of services || []){
      const { data: items, error: iErr } = await supabaseSrv.from('service_items').select('id,label,price,description,duration,order_index').eq('service_id', s.id).order('order_index', {
        ascending: true
      });
      if (iErr) throw iErr;
      sections.push({
        id: s.id,
        title: s.title,
        icon: s.icon,
        items: (items || []).map((it)=>({
            id: it.id,
            label: it.label,
            price: it.price,
            description: it.description ?? null,
            duration: it.duration ?? null
          }))
      });
    }
    return new Response(JSON.stringify({
      sections
    }), {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    const msg = e?.message ?? 'Unknown error';
    return new Response(JSON.stringify({
      error: 'server_error',
      details: msg
    }), {
      status: 500,
      headers: {
        ...cors,
        'Content-Type': 'application/json'
      }
    });
  }
});
