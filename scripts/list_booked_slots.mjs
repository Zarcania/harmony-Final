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

let SUPABASE_URL = process.env.VITE_SUPABASE_URL
let SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  loadEnvFallback()
  SUPABASE_URL = process.env.VITE_SUPABASE_URL
  SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
}
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants (.env.local)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function toParisHM(d) {
  const fmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false })
  return fmt.format(d)
}

function dstr(d) {
  const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${dd}`
}

async function listDay(dateISO) {
  const { data, error } = await supabase.rpc('get_booked_slots', { p_date: dateISO })
  if (error) {
    console.error(`[${dateISO}] ERROR:`, error.message)
    return []
  }
  const out = []
  for (const it of (Array.isArray(data) ? data : [])) {
    let inner = null
    if (typeof it === 'string') inner = it
    else if (it && typeof it === 'object' && 'ts' in it) inner = String(it.ts)
    if (!inner) continue
    inner = inner.trim()
    if (inner.startsWith('[') || inner.startsWith('(')) inner = inner.slice(1)
    if (inner.endsWith(']') || inner.endsWith(')')) inner = inner.slice(0,-1)
    const [s,e] = inner.split(',')
    const sd = new Date(s.trim())
    const ed = new Date(e.trim())
    out.push({ start: sd, end: ed })
  }
  return out
}

async function main() {
  const start = process.env.START_DATE ? new Date(process.env.START_DATE) : new Date()
  const days = Number(process.env.DAYS || 14)
  const results = []
  for (let i=0;i<days;i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate()+i)
    const iso = dstr(d)
    const items = await listDay(iso)
    if (items.length) results.push({ date: iso, items })
  }
  if (!results.length) {
    console.log('Aucune occupation trouvée dans la période demandée.')
    return
  }
  for (const day of results) {
    console.log(`\n${day.date}`)
    for (const it of day.items) {
      console.log(` - ${toParisHM(it.start)} → ${toParisHM(it.end)}`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
