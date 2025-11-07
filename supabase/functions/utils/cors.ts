// Declare Deno for TS tooling outside Deno runtime
declare const Deno: { env: { get: (k: string) => string | undefined } };
/**
 * CORS utility for Supabase Edge Functions (Deno runtime).
 * Reads ALLOWED_ORIGINS (CSV) from secrets. Falls back to defaults if missing.
 */

export type CorsHeaders = Record<string, string>

export const getAllowedOrigins = (): string[] => {
  const raw = Deno.env.get('ALLOWED_ORIGINS') ?? 'https://harmoniecils.com,https://www.harmoniecils.com,http://localhost:5173'
  return raw.split(',').map((s: string) => s.trim()).filter(Boolean)
}

export const buildCors = (origin?: string): CorsHeaders => {
  const allowed = getAllowedOrigins()
  const o = origin && allowed.includes(origin) ? origin : allowed[0]
  const allow = 'authorization, content-type, x-client-info, x-client-name, x-debug, apikey';
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    // Certaines plateformes comparent sensiblement aux espaces/ordre; dupliquons une variante compacte si besoin
    'Access-Control-Allow-Headers': allow,
    'Vary': 'Origin',
  }
}

export const handleOptions = (req: Request): Response | null => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin') ?? undefined
    const headers = buildCors(origin)
    return new Response(null, { status: 204, headers })
  }
  return null
}
