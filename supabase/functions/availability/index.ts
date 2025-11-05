// Availability Edge Function
// Assumptions:
// - Tables: public.service_items(id uuid pk, duration_minutes int), public.business_hours(day_of_week int, is_closed bool, open_time time, close_time time)
// - public.closures(start_date date, end_date date)
// - public.bookings(id uuid, status text, start_at timestamptz, end_at timestamptz, ts tstzrange)
// Permissions: uses anon key; read-only endpoints
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
const toISO = (d)=>{
  const pad = (n)=>n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const addMinutes = (d, m)=>new Date(d.getTime() + m * 60 * 1000);
const tz = 'Europe/Paris';
async function getConfig(supabase, service_item) {
  const { data: item, error: eItem } = await supabase.from('service_items').select('id, duration_minutes').eq('id', service_item).single();
  if (eItem) throw eItem;
  const duration = item?.duration_minutes || 60;
  const { data: hours, error: eHours } = await supabase.from('business_hours').select('*');
  if (eHours) throw eHours;
  const { data: closures, error: eClos } = await supabase.from('closures').select('start_date, end_date');
  if (eClos) throw eClos;
  return {
    duration,
    hours,
    closures
  };
}
function isClosedByExceptional(closures, d) {
  const y = d.toISOString().slice(0, 10);
  for (const c of closures){
    if (y >= c.start_date && y <= c.end_date) return true;
  }
  return false;
}
function dayOfWeekParis(d) {
  // Compute day-of-week in Paris TZ, 0 = Sunday .. 6 = Saturday
  const fmt = new Intl.DateTimeFormat('fr-FR', {
    timeZone: tz,
    weekday: 'short'
  });
  // Map via UTC weekday workaround
  const dow = new Date(d.toLocaleString('en-US', {
    timeZone: tz
  }));
  return dow.getDay();
}
function windowsForDay(hours, d) {
  const dow = dayOfWeekParis(d);
  const h = hours.find((h)=>h.day_of_week === dow);
  if (!h || h.is_closed) return [];
  const base = (t)=>{
    // t is HH:MM:SS
    const [hh, mm, ss] = t.split(':').map(Number);
    const local = new Date(d.toLocaleString('en-US', {
      timeZone: tz
    }));
    local.setHours(hh, mm, ss || 0, 0);
    return local;
  };
  const out = [];
  // Simplification : uniquement open_time et close_time
  if (h.open_time && h.close_time) {
    out.push({
      s: base(h.open_time),
      e: base(h.close_time)
    });
  }
  return out;
}
function breakOverlaps(breaks, d, s, e) {
  const dow = dayOfWeekParis(d);
  const b = breaks.find((b)=>b.day_of_week === dow);
  if (!b || !b.break_start || !b.break_end) return false;
  const base = (t)=>{
    const [hh, mm, ss] = t.split(':').map(Number);
    const local = new Date(d.toLocaleString('en-US', {
      timeZone: tz
    }));
    local.setHours(hh, mm, ss || 0, 0);
    return local;
  };
  const bs = base(b.break_start);
  const be = base(b.break_end);
  return Math.max(s.getTime(), bs.getTime()) < Math.min(e.getTime(), be.getTime());
}
function overlaps(aStart, aEnd, bStart, bEnd) {
  return Math.max(aStart.getTime(), bStart.getTime()) < Math.min(aEnd.getTime(), bEnd.getTime());
}
async function getExistingBookings(supabase, fromISO, toISO) {
  const { data, error } = await supabase.from('bookings').select('start_at, end_at').in('status', [
    'pending',
    'confirmed'
  ]).gte('start_at', fromISO).lte('end_at', toISO);
  if (error) throw error;
  return (data || []).map((b)=>({
      s: new Date(b.start_at),
      e: new Date(b.end_at)
    }));
}
Deno.serve(async (req)=>{
  try {
    const url = new URL(req.url);
    const qp = {
      service_item: url.searchParams.get('service_item') || '',
      days: Number(url.searchParams.get('days') || 14),
      step: Number(url.searchParams.get('step') || 30),
      from: url.searchParams.get('from') || undefined
    };
    if (!qp.service_item) return new Response(JSON.stringify({
      error: 'service_item required'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          'X-Client-Info': 'edge-availability'
        }
      }
    });
    const { duration, hours, closures } = await getConfig(supabase, qp.service_item);
    const startDate = qp.from ? new Date(`${qp.from}T00:00:00`) : new Date(new Date().toLocaleString('en-US', {
      timeZone: tz
    }));
    const days = Math.max(1, Math.min(60, qp.days || 14));
    const step = Math.max(5, Math.min(120, qp.step || 30));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days - 1);
    // Preload bookings for range
    const fromISO = `${startDate.toISOString().slice(0, 10)}T00:00:00Z`;
    const toISO = `${endDate.toISOString().slice(0, 10)}T23:59:59Z`;
    const bookings = await getExistingBookings(supabase, fromISO, toISO);
    const out = [];
    for(let i = 0; i < days; i++){
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      if (isClosedByExceptional(closures, day)) {
        out.push({
          date: day.toISOString().slice(0, 10),
          is_closed: true,
          slots: []
        });
        continue;
      }
      const wins = windowsForDay(hours, day);
      if (!wins.length) {
        out.push({
          date: day.toISOString().slice(0, 10),
          is_closed: true,
          slots: []
        });
        continue;
      }
      const slots = [];
      for (const w of wins){
        let cursor = new Date(w.s);
        const lastStart = new Date(w.e.getTime() - duration * 60 * 1000);
        while(cursor.getTime() <= lastStart.getTime()){
          const slotEnd = addMinutes(cursor, duration);
          // Skip if overlaps booking
          const conflict = bookings.some((b)=>overlaps(cursor, slotEnd, b.s, b.e));
          if (!conflict) {
            slots.push({
              start: toISO(cursor),
              end: toISO(slotEnd)
            });
          }
          cursor = addMinutes(cursor, step);
        }
      }
      out.push({
        date: day.toISOString().slice(0, 10),
        is_closed: slots.length === 0,
        slots
      });
    }
    return new Response(JSON.stringify(out), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      error: String(e?.message || e)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
