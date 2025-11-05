// Declare Deno for TS tooling outside Deno runtime
export const getAllowedOrigins = ()=>{
  const raw = Deno.env.get('ALLOWED_ORIGINS') ?? 'https://harmoniecils.com,https://www.harmoniecils.com,http://localhost:5173';
  return raw.split(',').map((s)=>s.trim()).filter(Boolean);
};
export const buildCors = (origin)=>{
  const allowed = getAllowedOrigins();
  const o = origin && allowed.includes(origin) ? origin : allowed[0];
  const allow = 'authorization, content-type, x-client-info, x-client-name, apikey';
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': allow,
    'Vary': 'Origin'
  };
};
export const handleOptions = (req)=>{
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin') ?? undefined;
    const headers = buildCors(origin);
    return new Response(null, {
      status: 204,
      headers
    });
  }
  return null;
};
