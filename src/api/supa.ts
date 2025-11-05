import { supabase } from '../lib/supabase'

type LogEntry = {
  route: string
  method: string
  payload?: unknown
  status?: number
  error?: unknown
}

export const logApi = ({ route, method, payload, status, error }: LogEntry) => {
  const base = `[API] ${method} ${route}`
  if (error || (status && status >= 400)) {
    console.warn(base, { status, payload, error })
  } else {
    console.info(base, { status, payload })
  }
}

// Small timeout helper
export const withTimeout = async <T>(p: Promise<T>, ms: number, onTimeout?: () => void): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        onTimeout?.()
        reject(new Error(`Timeout after ${ms}ms`))
      }, ms)
    })
    // Race promise with timeout
    return (await Promise.race([p, timeoutPromise])) as T
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

// RPC wrapper with logging + optional timeout
export const callRpc = async <T = unknown>(name: string, params: Record<string, unknown>, opts?: { timeoutMs?: number }) => {
  const route = `/rest/v1/rpc/${name}`
  const exec = async () => {
  // Cast en any pour supporter des noms/params dynamiques sans heurter les types générés
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb: any = supabase as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, status } = await sb.rpc(name as any, params)
    logApi({ route, method: 'POST', payload: params, status, error })
    if (error) throw Object.assign(error as unknown as Error & { status?: number }, { status })
    return data as T
  }
  return opts?.timeoutMs ? withTimeout(exec(), opts.timeoutMs) : exec()
}

// Edge Function wrapper with logging + optional timeout
export const invokeFunction = async <T = unknown>(name: string, body?: Record<string, unknown> | Record<string, unknown>[] | string, opts?: { timeoutMs?: number, headers?: Record<string,string> }) => {
  const route = `/functions/v1/${name}`
  const exec = async () => {
    // Construire les en-têtes d'appel de la Function.
    // Règle importante: si l'utilisateur est connecté, on envoie son JWT (permet aux Functions de vérifier le rôle admin).
    // Sinon, on fallback sur l'anon key. Les opts.headers peuvent toujours surcharger ce comportement.
    const headers: Record<string, string> = { ...(opts?.headers || {}) }

    if (!('Authorization' in headers)) {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        } else {
          const anon = (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_SUPABASE_ANON_KEY as string | undefined
          if (anon) {
            headers['Authorization'] = `Bearer ${anon}`
            headers['apikey'] = anon
          }
        }
      } catch {
        // En cas d'échec inattendu, tenter l'anon key en dernier recours
        try {
          const anon = (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_SUPABASE_ANON_KEY as string | undefined
          if (anon) {
            headers['Authorization'] = `Bearer ${anon}`
            headers['apikey'] = anon
          }
        } catch { /* ignore */ }
      }
    }

    const { data, error } = await supabase.functions.invoke<T>(name, { body, headers })
    // supabase.functions.invoke errors don't always include status; infer 400 if error
    const status = (error as unknown as { status?: number } | undefined)?.status ?? (error ? 400 : 200)
    logApi({ route, method: 'POST', payload: body, status, error })
    if (error) throw Object.assign(error, { status })
    return data as T
  }
  return opts?.timeoutMs ? withTimeout(exec(), opts.timeoutMs) : exec()
}

// Raw invoker to always read JSON error bodies from Edge Functions
export const invokeRawFunction = async <T = unknown>(name: string, body?: unknown, opts?: { timeoutMs?: number, headers?: Record<string,string> }) => {
  const exec = async () => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts?.headers || {}) }
    if (!('Authorization' in headers)) {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        } else {
          const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
          if (anon) {
            headers['Authorization'] = `Bearer ${anon}`
            headers['apikey'] = anon
          }
        }
      } catch {/* ignore */}
    }
    const res = await fetch(url, { method: 'POST', headers, body: body == null ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) })
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null)
    logApi({ route: `/functions/v1/${name}`, method: 'POST', payload: body, status: res.status, error: res.ok ? undefined : payload })
    if (!res.ok) {
      const err = new Error((payload && (payload.error || payload.message)) || `Function ${name} failed (${res.status})`) as Error & { status?: number; details?: unknown }
      err.status = res.status
      err.details = payload
      throw err
    }
    return payload as T
  }
  return opts?.timeoutMs ? withTimeout(exec(), opts.timeoutMs) : exec()
}

// Table write helpers (only use where beneficial). Prefer function calls for admin writes.
export const insert = async <T = unknown>(table: string, rows: Record<string, unknown> | Record<string, unknown>[]) => {
  const route = `/rest/v1/${table}`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb: any = supabase as any
  const { data, error, status } = await (sb
    .from(table)
    .insert(rows as Record<string, unknown> | Record<string, unknown>[])
    .select())
  logApi({ route, method: 'POST', payload: rows, status, error })
  if (error) throw Object.assign(error, { status })
  return data as T
}
