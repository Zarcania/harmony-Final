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
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const ANON = process.env.VITE_SUPABASE_ANON_KEY
  const email = process.env.ADMIN_EMAIL || 'admin@local.test'
  const password = process.env.ADMIN_PASSWORD || 'Passw0rd!'
  if (!SUPABASE_URL || !ANON) {
    console.error('[FAIL] VITE_SUPABASE_URL/ANON_KEY manquants')
    process.exit(1)
  }
  const base = SUPABASE_URL.replace(/\/?$/, '')
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON}`, 'apikey': ANON }

  const c1 = await fetch(`${base}/functions/v1/create-admin-user`, { method: 'POST', headers, body: JSON.stringify({ email, password }) })
  const j1 = await c1.text(); let r1; try { r1 = JSON.parse(j1) } catch { r1 = { raw: j1 } }
  if (!c1.ok) { console.error('[FAIL] create-admin-user', c1.status, r1); process.exit(1) }
  console.log('[OK] create-admin-user', r1?.user?.email)

  const c2 = await fetch(`${base}/functions/v1/update-admin-role`, { method: 'POST', headers, body: JSON.stringify({ email }) })
  const j2 = await c2.text(); let r2; try { r2 = JSON.parse(j2) } catch { r2 = { raw: j2 } }
  if (!c2.ok) { console.error('[FAIL] update-admin-role', c2.status, r2); process.exit(1) }
  console.log('[OK] update-admin-role', r2?.user?.email)
}

main().catch(e => { console.error('[FAIL]', e?.message || String(e)); process.exit(1) })
