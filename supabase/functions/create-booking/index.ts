// @ts-nocheck
// Déclare Deno pour l'analyse TS hors runtime Deno
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { buildCors, handleOptions } from '../utils/cors.ts';
const isUuid = (s)=>!!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const isEmail = (s)=>!!s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
Deno.serve(async (req)=>{
  const opt = handleOptions(req);
  if (opt) return opt;
  const origin = req.headers.get('Origin') ?? undefined;
  const cors = buildCors(origin);
  const reqId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  try {
    // Content-Type strict pour POST
    const ctype = req.headers.get('content-type') || '';
    if (req.method === 'POST' && !ctype.toLowerCase().includes('application/json')) {
      return new Response(JSON.stringify({
        error: 'invalid_content_type',
        details: {
          expected: 'application/json'
        }
      }), {
        status: 400,
        headers: {
          ...cors,
          'Content-Type': 'application/json'
        }
      });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAuth = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    // Lecture JSON sûre
    let body;
    try {
      body = await req.json();
    } catch  {
      return new Response(JSON.stringify({
        error: 'invalid_json',
        details: 'Le corps de la requête doit être un JSON valide.'
      }), {
        status: 400,
        headers: {
          ...cors,
          'Content-Type': 'application/json'
        }
      });
    }
    // Validation des champs requis
    const errors = {};
    const ids = Array.isArray(body.service_ids) ? body.service_ids : [];
    const primaryServiceId = body.service_id || (ids.length ? ids[0] : undefined);
    if (!primaryServiceId) errors.service_id = 'Champ requis (ou fournir service_ids)';
    else if (!isUuid(primaryServiceId)) errors.service_id = 'UUID invalide';
    const dateStr = String(body.preferred_date || '');
    const timeStr = String(body.preferred_time || '');
    if (!dateStr) errors.preferred_date = 'Requis';
    else if (!/^\d{4}-\d{2}-\d{2}/.test(dateStr)) errors.preferred_date = 'Format attendu: yyyy-mm-dd';
    if (!timeStr) errors.preferred_time = 'Requis';
    else if (!/^\d{2}:\d{2}$/.test(timeStr)) errors.preferred_time = 'Format attendu: HH:MM';
    const cname = (body.client_name ?? '').trim();
    const cemail = (body.client_email ?? '').trim();
    if (!cname) errors.client_name = 'Requis';
    if (!cemail) errors.client_email = 'Requis';
    else if (!isEmail(cemail)) errors.client_email = 'Email invalide';
    if (Object.keys(errors).length) {
      console.error(`[create-booking][${reqId}] validation_failed`, errors);
      return new Response(JSON.stringify({
        error: 'invalid_payload',
        details: errors,
        request_id: reqId
      }), {
        status: 400,
        headers: {
          ...cors,
          'Content-Type': 'application/json'
        }
      });
    }
    // Calcul/normalisation service_name et duration_minutes
    let serviceName = (body.service_name ?? '').trim();
    let duration = Number.isFinite(body.duration_minutes) ? Math.max(10, Math.min(300, Number(body.duration_minutes))) : NaN;
    try {
      const qIds = ids.length ? ids : [
        primaryServiceId
      ];
      const { data: items, error: itErr } = await supabaseAuth.from('service_items').select('id,label,duration').in('id', qIds);
      if (itErr) throw itErr;
      if (items && Array.isArray(items) && items.length) {
        const labels = items.map((r)=>(r.label ?? '').trim()).filter(Boolean);
        if (!serviceName && labels.length) serviceName = labels.join(' + ');
        if (!Number.isFinite(duration)) {
          const parseDur = (raw)=>{
            if (!raw) return 60;
            const s = String(raw).toLowerCase().replace(/\s+/g, '');
            const m1 = s.match(/^(\d+)h(?:(\d{1,2}))?$/);
            if (m1) {
              const h = parseInt(m1[1]);
              const mm = m1[2] ? parseInt(m1[2]) : 0;
              return h * 60 + mm;
            }
            const m2 = s.match(/^(\d+)(?:min|m)$/);
            if (m2) return parseInt(m2[1]);
            const n = parseInt(s);
            return Number.isFinite(n) && n > 0 ? n : 60;
          };
          duration = items.reduce((acc, r)=>acc + parseDur(r.duration ?? undefined), 0);
          duration = Math.max(10, Math.min(300, duration || 60));
        }
      }
    } catch (e) {
      console.error(`[create-booking][${reqId}] lookup_service_items_failed`, e?.code || 'error');
      if (!serviceName) serviceName = body.service_name || 'Service';
      if (!Number.isFinite(duration)) duration = 60;
    }
    const row = {
      client_name: cname,
      client_email: cemail,
      client_phone: (body.client_phone ?? '').trim(),
      service_name: serviceName,
      service_id: primaryServiceId ?? null,
      preferred_date: dateStr.slice(0, 10),
      preferred_time: timeStr.slice(0, 5),
      duration_minutes: duration,
      message: (body.message ?? '').toString().slice(0, 2000),
      status: body.status ?? 'confirmed'
    };
    const { data, error } = await supabaseAuth.from('bookings').insert(row).select().single();
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('bookings_start_not_past_active') || msg.includes('start_not_past')) {
        return new Response(JSON.stringify({
          error: 'slot_in_past',
          details: 'Impossible de réserver dans le passé.',
          request_id: reqId
        }), {
          status: 409,
          headers: {
            ...cors,
            'Content-Type': 'application/json'
          }
        });
      }
      if (msg.includes('uniq_bookings_start_active') || msg.includes('unique') && msg.includes('preferred_date') && msg.includes('preferred_time')) {
        return new Response(JSON.stringify({
          error: 'slot_unavailable',
          details: 'Un rendez-vous existe déjà à cette heure.',
          request_id: reqId
        }), {
          status: 409,
          headers: {
            ...cors,
            'Content-Type': 'application/json'
          }
        });
      }
      if (msg.includes('bookings_no_overlap_excl') || msg.includes('exclusion') || msg.includes('overlap')) {
        return new Response(JSON.stringify({
          error: 'slot_overlaps',
          details: 'Ce créneau chevauche un autre rendez-vous.',
          request_id: reqId
        }), {
          status: 409,
          headers: {
            ...cors,
            'Content-Type': 'application/json'
          }
        });
      }
      console.error(`[create-booking][${reqId}] db_error`, {
        code: error?.code,
        status: error?.status
      });
      return new Response(JSON.stringify({
        error: 'db_error',
        details: 'Insertion impossible',
        request_id: reqId
      }), {
        status: error?.status || 400,
        headers: {
          ...cors,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      data,
      request_id: reqId
    }), {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    console.error(`[create-booking][${reqId}] unhandled`, e?.message);
    const msg = e?.message ?? 'Unknown error';
    return new Response(JSON.stringify({
      error: 'server_error',
      details: msg,
      request_id: reqId
    }), {
      status: 500,
      headers: {
        ...cors,
        'Content-Type': 'application/json'
      }
    });
  }
});
