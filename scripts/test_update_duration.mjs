import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

function loadEnvFallback() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(process.cwd(), file)
    if (fs.existsSync(p)) {
      const txt = fs.readFileSync(p, 'utf8')
      for (const line of txt.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
        if (!m) continue
        let [, k, v] = m
        v = v.replace(/^['"]|['"]$/g, '')
        if (!(k in process.env)) process.env[k] = v
      }
      break
    }
  }
}

async function main() {
  loadEnvFallback()
  const url = process.env.VITE_SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY
  const email = process.env.ADMIN_EMAIL || 'admin@local.test'
  const password = process.env.ADMIN_PASSWORD || 'Passw0rd!'
  const supabase = createClient(url, anon)
  const { error: signErr } = await supabase.auth.signInWithPassword({ email, password })
  if (signErr) throw signErr

  const { data: item } = await supabase.from('service_items').select('id, duration, duration_minutes').limit(1).maybeSingle()
  if (!item) { console.log('No service_items'); return }
  const id = item.id
  const newDuration = '1h45'
  const { error: upErr } = await supabase.from('service_items').update({ duration: newDuration }).eq('id', id)
  if (upErr) throw upErr
  const { data: check } = await supabase.from('service_items').select('id, duration, duration_minutes').eq('id', id).maybeSingle()
  console.log('Updated:', check)
}

main().catch(e => { console.error(e); process.exit(1) })
