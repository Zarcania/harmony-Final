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
    const { data, error, status } = await supabase.rpc(name, params)
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
    const { data, error } = await supabase.functions.invoke<T>(name, { body, headers: opts?.headers })
    // supabase.functions.invoke errors don't always include status; infer 400 if error
    const status = (error as unknown as { status?: number } | undefined)?.status ?? (error ? 400 : 200)
    logApi({ route, method: 'POST', payload: body, status, error })
    if (error) throw Object.assign(error, { status })
    return data as T
  }
  return opts?.timeoutMs ? withTimeout(exec(), opts.timeoutMs) : exec()
}

// Table write helpers (only use where beneficial). Prefer function calls for admin writes.
export const insert = async <T = unknown>(table: string, rows: Record<string, unknown> | Record<string, unknown>[]) => {
  const route = `/rest/v1/${table}`
  const { data, error, status } = await (supabase
    .from(table)
    .insert(rows as Record<string, unknown> | Record<string, unknown>[])
    .select())
  logApi({ route, method: 'POST', payload: rows, status, error })
  if (error) throw Object.assign(error, { status })
  return data as T
}
