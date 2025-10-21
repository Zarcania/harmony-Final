import { createClient } from 'npm:@supabase/supabase-js@2.58.0'
import { buildCors, handleOptions } from '../utils/cors.ts'

type CreateBookingBody = {
  client_name: string
  client_first_name?: string
  client_email: string
  client_phone: string
  service_name: string
  preferred_date: string // YYYY-MM-DD
  preferred_time: string // HH:MM
  status?: string
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

    const supabaseAuth = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Auth check
    const { data: { user }, error: uerr } = await supabaseAuth.auth.getUser()
    if (uerr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } })
    }
    const isAdmin = (user.user_metadata?.role === 'admin') || (user.app_metadata?.role === 'admin')
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const body = await req.json() as Partial<CreateBookingBody>
    const required = ['client_name','client_email','client_phone','service_name','preferred_date','preferred_time'] as const
    const missing = required.filter(k => !body[k])
    if (missing.length) {
      return new Response(JSON.stringify({ error: `Missing fields: ${missing.join(', ')}` }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    // Normalize
    const row = {
      client_name: body.client_name!,
      client_first_name: body.client_first_name ?? '',
      client_email: body.client_email!,
      client_phone: body.client_phone!,
      service_name: body.service_name!,
      preferred_date: body.preferred_date!,
      preferred_time: body.preferred_time!,
      status: body.status ?? 'confirmed',
    }

    const { data, error } = await supabaseAuth.from('bookings').insert(row).select().single()
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: error.status || 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ data }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
