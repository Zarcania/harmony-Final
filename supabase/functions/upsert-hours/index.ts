import { createClient } from 'npm:@supabase/supabase-js@2.58.0'
import { buildCors, handleOptions } from '../utils/cors.ts'

type HourRow = {
  id?: string
  day_of_week: number
  open_time: string | null
  close_time: string | null
  is_closed: boolean
}

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req)
  if (opt) return opt
  const origin = req.headers.get('Origin') ?? undefined
  const cors = buildCors(origin)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') ?? ''

    const admin = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: { user } } = await admin.auth.getUser()
    const isAdmin = !!user && ((user.user_metadata?.role === 'admin') || (user.app_metadata?.role === 'admin'))
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const body = await req.json() as HourRow | HourRow[]
    const rows = Array.isArray(body) ? body : [body]

    for (const r of rows) {
      // Normalize HH:mm -> HH:mm:00 when not null
      const payload = {
        id: r.id ?? undefined,
        day_of_week: r.day_of_week,
        open_time: r.is_closed ? null : (r.open_time ? `${r.open_time}:00` : null),
        close_time: r.is_closed ? null : (r.close_time ? `${r.close_time}:00` : null),
        is_closed: r.is_closed,
      }
      const { error } = await admin.from('business_hours').upsert(payload, { onConflict: 'day_of_week' })
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: error.status || 400, headers: { ...cors, 'Content-Type': 'application/json' } })
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
