import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Aide au diagnostic: prévenir si les variables d'environnement ne sont pas renseignées
if (supabaseUrl.includes('placeholder-url') || supabaseAnonKey === 'placeholder-key') {
  // N'interrompt pas l'exécution, mais affiche un message clair dans la console
  // pour éviter des erreurs réseau difficiles à comprendre côté UI.
  // Remplissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local puis redémarrez Vite.
  console.error('[Supabase] Configuration manquante. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local (voir SUPABASE_AUTH_SETUP.md), puis redémarrez le serveur de développement.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
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