import { supabase } from './supabase'

export { supabase }

export const onAuthChanged = (cb: (event: string, session: unknown) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    cb(event, session)
  })
  return () => subscription.unsubscribe()
}
