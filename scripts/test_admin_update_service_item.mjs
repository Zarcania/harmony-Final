import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

function loadEnvFallback() {
  const candidates = ['.env.local', '.env']
  for (const file of candidates) {
    const p = path.join(process.cwd(), file)
    if (fs.existsSync(p)) {
      const txt = fs.readFileSync(p, 'utf8')
      for (const line of txt.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
        if (!m) continue
        let [, k, v] = m
        v = v.replace(/^["']|["']$/g, '')
        if (!(k in process.env)) process.env[k] = v
      }
      return
    }
  }
}

async function main() {
  loadEnvFallback()
  const url = process.env.VITE_SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY
  const email = process.env.ADMIN_EMAIL || 'admin@local.test'
  const password = process.env.ADMIN_PASSWORD || 'Passw0rd!'
  if (!url || !anon) { console.error('[FAIL] VITE_SUPABASE_URL/ANON manquants'); process.exit(1) }

  const supabase = createClient(url, anon)
  const { data: signIn, error: signErr } = await supabase.auth.signInWithPassword({ email, password })
  if (signErr) { console.error('[FAIL] Connexion admin', signErr.message); process.exit(1) }
  console.log('[OK] Admin connecté', signIn.user?.email)

  const { data: item, error: qErr } = await supabase.from('service_items').select('id, description').limit(1).maybeSingle()
  if (qErr) { console.error('[FAIL] Lecture service_items', qErr.message); process.exit(1) }
  if (!item?.id) { console.log('[INFO] Aucun service_item trouvé.'); process.exit(0) }

  const newDesc = `Test admin update ${new Date().toISOString()}`
  const { error: upErr } = await supabase.from('service_items').update({ description: newDesc }).eq('id', item.id)
  if (upErr) { console.error('[FAIL] Update service_items refusé (RLS?)', upErr.message); process.exit(1) }

  const { data: check, error: cErr } = await supabase.from('service_items').select('id, description').eq('id', item.id).maybeSingle()
  if (cErr) { console.error('[FAIL] Relecture service_items', cErr.message); process.exit(1) }
  if (check?.description !== newDesc) { console.error('[FAIL] La description n\'a pas été mise à jour'); process.exit(1) }
  console.log('[OK] Update description service_item confirmé')
}

main().catch(e => { console.error('[FAIL]', e?.message || String(e)); process.exit(1) })
