import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

function fail(msg) {
  console.error(`[FAIL] ${msg}`)
  process.exitCode = 1
}
function ok(msg) {
  console.log(`[OK] ${msg}`)
}

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
        // strip quotes if present
        v = v.replace(/^['"]|['"]$/g, '')
        if (!(k in process.env)) process.env[k] = v
      }
      return
    }
  }
}

let SUPABASE_URL = process.env.VITE_SUPABASE_URL
let SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  loadEnvFallback()
  SUPABASE_URL = process.env.VITE_SUPABASE_URL
  SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
}
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  fail("Variables VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY manquantes (env/.env.local)")
  process.exit()
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Utilitaire: format HH:MM en Europe/Paris à partir d'un timestamptz ISO
function toParisHM(ts) {
  const d = new Date(ts)
  const fmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false })
  return fmt.format(d)
}

function overlapsLunch(slotStart, slotEnd) {
  // On teste seulement la partie "heure" locale Europe/Paris
  const startHM = toParisHM(slotStart)
  const endHM = toParisHM(slotEnd)
  // Construire minutes depuis minuit
  const toMin = (hm) => { const [h,m] = hm.split(':').map(Number); return h*60+m }
  const s = toMin(startHM)
  const e = toMin(endHM)
  const bs = 12*60
  const be = 13*60
  return s < be && e > bs
}

// Trouver un jour avec des slots disponibles (par ex. dans les 14 prochains jours)
function addDaysUTC(d, n) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n)) }
function toDateStrUTC(d) { const y=d.getUTCFullYear(); const m=String(d.getUTCMonth()+1).padStart(2,'0'); const dd=String(d.getUTCDate()).padStart(2,'0'); return `${y}-${m}-${dd}` }

async function main() {
  // Cherche un jour avec au moins un slot 60 min
  const today = new Date()
  let dateStr = null
  let data = null
  let error = null
  for (let off = 1; off <= 14; off++) {
    const d = addDaysUTC(today, off)
    const ds = toDateStrUTC(d)
    const argsProbe = { p_date: ds, p_duration_minutes: 60, p_slot_step_minutes: 30, p_buffer_minutes: 0 }
    const res = await supabase.rpc('get_available_slots', argsProbe)
    if (res.error) { error = res.error; break }
    if (Array.isArray(res.data) && res.data.length > 0) { dateStr = ds; data = res.data; break }
  }
  if (error) {
    if (error?.code === '401' || error?.message?.includes('JWT') || error?.message?.toLowerCase().includes('permission')) {
      return fail(`Appel RPC 401/permission refusée: ${error.message}`)
    }
    return fail(`Erreur RPC: ${error.message}`)
  }
  if (!dateStr) {
    ok('Aucun slot 60 min trouvé dans les 14 prochains jours (planning fermé ou non configuré). Sanity-check RPC OK (pas de 401).')
    return
  }
  console.log(`[INFO] Test RPC get_available_slots sur ${dateStr}`)
  if (error) {
    if (error?.code === '401' || error?.message?.includes('JWT') || error?.message?.toLowerCase().includes('permission')) {
      return fail(`Appel RPC 401/permission refusée: ${error.message}`)
    }
    return fail(`Erreur RPC: ${error.message}`)
  }
  if (!Array.isArray(data)) {
    return fail('Réponse RPC inattendue (data non tableau).')
  }
  ok(`RPC OK: ${data.length} slots reçus pour 60 min.`)

  const lunchOverlaps = data.filter(r => overlapsLunch(r.slot_start, r.slot_end))
  if (lunchOverlaps.length > 0) {
    console.log('Slots qui chevauchent 12:00–13:00:')
    lunchOverlaps.slice(0,10).forEach(r => console.log(' -', toParisHM(r.slot_start), '→', toParisHM(r.slot_end)))
    fail(`Des slots chevauchent la pause (count=${lunchOverlaps.length}).`)
  } else {
    ok('Aucun slot 60 min ne chevauche la pause 12:00–13:00 (si pause configurée).')
  }

  // Test basique 120 min: s'assurer qu'aucun slot 120 min ne chevauche la pause
  const args120 = { p_date: dateStr, p_duration_minutes: 120, p_slot_step_minutes: 30, p_buffer_minutes: 0 }
  const { data: data120, error: err120 } = await supabase.rpc('get_available_slots', args120)
  if (err120) {
    return fail(`Erreur RPC (120 min): ${err120.message}`)
  }
  const lunchOverlaps120 = data120.filter(r => overlapsLunch(r.slot_start, r.slot_end))
  if (lunchOverlaps120.length > 0) {
    console.log('Slots 120 min qui chevauchent 12:00–13:00:')
    lunchOverlaps120.slice(0,10).forEach(r => console.log(' -', toParisHM(r.slot_start), '→', toParisHM(r.slot_end)))
    fail(`Des slots 120 min chevauchent la pause (count=${lunchOverlaps120.length}).`)
  } else {
    ok('Aucun slot 120 min ne chevauche la pause 12:00–13:00 (si pause configurée).')
  }
}

main().catch(e => fail(e?.message || String(e)))
