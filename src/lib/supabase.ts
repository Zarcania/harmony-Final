import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  // Rend l'erreur explicite en dev
  console.error('[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquantes. Vérifiez .env.local puis redémarrez Vite.')
}

export const supabase = createClient(url!, anon!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Name': 'harmonie-web'
    }
  }
})

export const checkIsAdmin = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  return (
    user.user_metadata?.role === 'admin' ||
    user.app_metadata?.role === 'admin'
  )
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}