// Creates up to 10 bookings as anon via the create-booking Edge Function
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

function toParisParts(tsISO) {
  const d = new Date(tsISO)
  const fmtDate = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' })
  const fmtTime = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false })
  // fr-CA yields yyyy-mm-dd
  const dateStr = fmtDate.format(d)
  const timeStr = fmtTime.format(d)
  return { dateStr, timeStr }
}

async function main() {
  let SUPABASE_URL = process.env.VITE_SUPABASE_URL
  let SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    loadEnvFallback()
    SUPABASE_URL = process.env.VITE_SUPABASE_URL
    SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[FAIL] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants (.env.local)')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // 1) Récupérer un service_item pour avoir un service_id valide
  const { data: svc, error: svcErr } = await supabase.from('service_items').select('id,label').limit(1).maybeSingle()
  if (svcErr) {
    console.error('[FAIL] Lecture service_items impossible:', svcErr.message)
    process.exit(1)
  }
  if (!svc?.id) {
    console.log('[INFO] Aucun service_item trouvé. Abandon du test de création de réservations.')
    process.exit(0)
  }

  // 2) Chercher un jour avec au moins 10 slots via RPC, sinon fallback local (09:00 puis +1h)
  const today = new Date()
  let targetDate = null
  let slots = []
  let usedFallback = false
  for (let off = 1; off <= 21; off++) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + off))
    const dateISO = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`
    const args = { p_date: dateISO, p_duration_minutes: 60, p_slot_step_minutes: 30, p_buffer_minutes: 0 }
    const res = await supabase.rpc('get_available_slots', args)
    if (res.error) {
      // Fallback local
      const base = new Date(`${dateISO}T09:00:00.000Z`)
      slots = Array.from({ length: 10 }, (_, i) => ({ slot_start: new Date(base.getTime() + i * 60 * 60 * 1000).toISOString() }))
      targetDate = dateISO
      usedFallback = true
      break
    }
    const arr = Array.isArray(res.data) ? res.data : []
    if (arr.length >= 10) { targetDate = dateISO; slots = arr; break }
  }
  if (!targetDate) {
    // Dernier recours: demain 09:00 -> 10 slots à +1h
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1))
    const dateISO = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`
    const base = new Date(`${dateISO}T09:00:00.000Z`)
    slots = Array.from({ length: 10 }, (_, i) => ({ slot_start: new Date(base.getTime() + i * 60 * 60 * 1000).toISOString() }))
    targetDate = dateISO
    usedFallback = true
  }

  const count = Math.min(10, slots.length)
  if (usedFallback) console.log('[INFO] Fallback local utilisé pour générer 10 créneaux de test.')

  // 3) Créer jusqu’à 10 réservations via l’Edge Function create-booking
  const results = []
  for (let i = 0; i < count; i++) {
    const s = slots[i]
    const { dateStr, timeStr } = toParisParts(s.slot_start)
    const body = {
      service_id: svc.id,
      client_name: `Test Anon ${i+1}`,
      client_email: `anon${i+1}@example.com`,
      preferred_date: dateStr,
      preferred_time: timeStr,
      message: 'Test auto 10 réservations',
    }
    const url = `${SUPABASE_URL.replace(/\/?$/, '')}/functions/v1/create-booking`
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    })
    const text = await resp.text()
    let json
    try { json = JSON.parse(text) } catch { json = { raw: text } }
    results.push({ idx: i+1, status: resp.status, json })
    if (resp.ok) {
      console.log(`[OK] Réservation ${i+1} créée -> id=${json?.data?.id ?? 'n/a'}`)
    } else {
      console.log(`[WARN] Échec réservation ${i+1} (HTTP ${resp.status})`, json)
    }
  }

  // 4) Résumé
  const oks = results.filter(r => r.status >= 200 && r.status < 300).length
  const fails = results.length - oks
  console.log(`\nRésumé: ${oks} succès, ${fails} échecs (sur ${results.length})`)
  if (fails > 0) process.exitCode = 1
}

main().catch(e => { console.error('[FAIL]', e?.message || String(e)); process.exit(1) })
