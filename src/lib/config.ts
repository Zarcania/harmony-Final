/**
 * Centralise l'accès aux variables d'environnement Vite côté front.
 * Jette une erreur explicite au démarrage si les variables critiques manquent.
 */

type Env = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  PUBLIC_SITE_URL: string
}

const readEnv = (): Env => {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()
  const site = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.trim()

  if (!url) {
    throw new Error('[Config] VITE_SUPABASE_URL est manquante. Ajoutez-la dans .env.local ou .env.production')
  }
  if (!anon) {
    throw new Error('[Config] VITE_SUPABASE_ANON_KEY est manquante. Ajoutez-la dans .env.local ou .env.production')
  }

  // PUBLIC_SITE_URL: facultatif -> fallback à l’origine courante si possible
  const resolvedSite = site || (typeof window !== 'undefined' ? window.location.origin : '')

  return {
    SUPABASE_URL: url,
    SUPABASE_ANON_KEY: anon,
    PUBLIC_SITE_URL: resolvedSite,
  }
}

export const ENV: Env = readEnv()
