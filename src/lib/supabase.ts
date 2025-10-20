import { createClient } from '@supabase/supabase-js'
import { ENV } from './config'

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Clé de stockage stable pour éviter les collisions multi-clients
    storageKey: 'hc_auth',
  },
  global: {
    headers: {
      'X-Client-Name': 'harmonie-web'
    }
  }
})

// Expose le client globalement pour le debug navigateur (clé anon publique)
declare global {
  interface Window {
    supabase: ReturnType<typeof createClient>
  }
}
if (typeof window !== 'undefined') {
  // @ts-expect-error - assignation runtime
  window.supabase = supabase
}

/**
 * Détermine si l'utilisateur courant est admin.
 * Ordre de vérification:
 * 1) user_metadata/app_metadata.role === 'admin'
 * 2) VITE_ADMIN_EMAILS (liste d'emails séparés par des virgules)
 * 3) Table public.profiles (si elle existe) avec role === 'admin'
 */
export const checkIsAdmin = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // 1) Métadonnées (source officielle si role y est écrit par une fonction Edge)
  if (user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin') {
    return true
  }

  // 2) Fallback ENV: liste blanche d'emails admins
  const adminsEnv = import.meta.env.VITE_ADMIN_EMAILS as string | undefined
  if (adminsEnv && user.email) {
    const list = adminsEnv.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    if (list.includes(user.email.toLowerCase())) return true
  }

  // 3) Fallback DB: table profiles si présente
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle<{ role?: string }>()
    if (!error && data?.role === 'admin') return true
  } catch { /* ignore si la table n'existe pas */ }

  return false
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}