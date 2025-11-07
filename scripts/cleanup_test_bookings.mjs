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
  // Connect as admin to get access token for Edge Function auth
  const { data: signIn, error: signErr } = await supabase.auth.signInWithPassword({ email, password })
  if (signErr) { console.error('[FAIL] Connexion admin', signErr.message); process.exit(1) }
  const accessToken = signIn.session?.access_token
  if (!accessToken) { console.error('[FAIL] Pas de access_token admin'); process.exit(1) }

  // Find test bookings (created by our test script): by email pattern or message marker
  const threeDaysAgo = new Date(Date.now() - 3*24*60*60*1000).toISOString()
  // On filtre large puis on réduit côté client par prudence
  const { data: rows, error: qErr } = await supabase
    .from('bookings')
    .select('id, client_email, message, created_at')
    .gte('created_at', threeDaysAgo)
    .order('created_at', { ascending: false })

  if (qErr) { console.error('[FAIL] Lecture bookings', qErr.message); process.exit(1) }

  const candidates = (rows || []).filter(r =>
    (r.client_email && /^anon\d+@example\.com$/i.test(r.client_email)) ||
    (typeof r.message === 'string' && r.message.toLowerCase().includes('test auto 10 réservations'))
  )

  if (!candidates.length) { console.log('[OK] Aucune réservation de test à supprimer.'); return }

  const base = url.replace(/\/?$/, '')
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'apikey': anon,
  }

  let ok = 0, fail = 0
  for (const r of candidates) {
    const resp = await fetch(`${base}/functions/v1/delete-booking`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ booking_id: r.id })
    })
    if (resp.ok) { ok++; console.log('[DEL]', r.id, r.client_email) }
    else { fail++; console.log('[ERR]', r.id, await resp.text()) }
  }

  console.log(`Résumé: ${ok} supprimées, ${fail} erreurs (sur ${candidates.length})`)
  if (fail) process.exitCode = 1
}

main().catch(e => { console.error('[FAIL]', e?.message || String(e)); process.exit(1) })
