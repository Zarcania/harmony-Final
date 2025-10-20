import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export const useSupabaseSession = () => {
  const [session, setSession] = useState<unknown | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted) {
        setSession(session)
        if (!session) console.info('[Auth] Session: null')
        setLoading(false)
      }
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return
      setSession(s)
      if (!s) console.info('[Auth] Session changed: null')
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}
