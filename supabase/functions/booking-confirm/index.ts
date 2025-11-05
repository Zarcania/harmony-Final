// deno-lint-ignore-file no-explicit-any
// Production-ready minimal function to confirm a booking with conflict check
// Routes:
//   POST /booking-confirm?service_item=<uuid>&start=<iso>&end=<iso>
// Responses: 200 confirmed, 409 conflict, 400 bad request, 500 error
console.info('booking-confirm started');
function parseParams(url) {
  const u = new URL(url);
  const p = u.searchParams;
  const service_item = p.get('service_item');
  const start = p.get('start');
  const end = p.get('end');
  return {
    service_item,
    start,
    end
  };
}
function toTz(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
async function confirm(service_item, startISO, endISO) {
  const body = {
    query: `select public.confirm_booking($1::uuid, $2::timestamptz, $3::timestamptz) as ok;`,
    params: [
      service_item,
      startISO,
      endISO
    ]
  };
  const resp = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': Deno.env.get('SUPABASE_ANON_KEY'),
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
    },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const msg = await resp.text();
    throw new Error(msg);
  }
  const data = await resp.json();
  return Array.isArray(data) ? Boolean(data[0]?.ok) : Boolean(data?.ok);
}
Deno.serve(async (req)=>{
  try {
    const { service_item, start, end } = parseParams(req.url);
    if (!service_item || !start || !end) {
      return new Response(JSON.stringify({
        error: 'Missing service_item|start|end'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    const startISO = toTz(start);
    const endISO = toTz(end);
    if (!startISO || !endISO) {
      return new Response(JSON.stringify({
        error: 'Invalid date format'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    const ok = await confirm(service_item, startISO, endISO);
    if (!ok) {
      return new Response(JSON.stringify({
        status: 'conflict'
      }), {
        status: 409,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      status: 'confirmed'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({
      error: 'Internal error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
