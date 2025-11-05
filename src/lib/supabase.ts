import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

// Client Supabase unique — variables injectées par Vite
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
)

// Vérifie le statut admin via la table public.profiles (schéma cible: { user_id uuid, is_admin boolean })
export const checkIsAdmin = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  // 1) Tente l'RPC is_admin (security definer)
  try {
    const { data: r1 } = await supabase.rpc('is_admin')
    if (typeof r1 === 'boolean') return r1
  } catch {
    // ignore
  }
  // 2) Table profiles (fallback)
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .maybeSingle<{ is_admin?: boolean }>()
    if (!error && data) return !!data.is_admin
  } catch {
    // ignore
  }
  // 3) Fallback ultime: whitelisting par email via env (séparé par virgules)
  try {
    const allow = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined)?.split(/[,;\s]+/).filter(Boolean) || []
    if (user.email && allow.map(e => e.toLowerCase()).includes(user.email.toLowerCase())) return true
  } catch {
    // ignore
  }
  return false
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}