import fs from 'fs'
import path from 'path'
import { execSync } from 'node:child_process'

function getStatus() {
  const raw = execSync('supabase status -o json', { encoding: 'utf8' })
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new Error('Cannot parse supabase status json')
  const json = raw.slice(start, end + 1)
  return JSON.parse(json)
}

function parseCSV(text) {
  // minimal CSV parser supporting quoted fields and commas
  const lines = text.split(/\r?\n/).filter(l => l.length > 0)
  if (lines.length === 0) return []
  const header = splitCSVLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i])
    if (cols.length === 1 && cols[0] === '') continue
    const obj = {}
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = cols[j] ?? ''
    }
    rows.push(obj)
  }
  return rows
}

function splitCSVLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"') {
        if (line[i+1] === '"') { cur += '"'; i++; } else { inQuotes = false }
      } else {
        cur += c
      }
    } else {
      if (c === ',') { out.push(cur); cur = '' }
      else if (c === '"') { inQuotes = true }
      else { cur += c }
    }
  }
  out.push(cur)
  return out
}

function toTyped(obj) {
  const out = {}
  for (const [k,v] of Object.entries(obj)) {
    if (v === '') { out[k] = null; continue }
    // try ints
    if (/^-?\d+$/.test(v)) { out[k] = parseInt(v,10); continue }
    // try bool
    if (v === 'true' || v === 'false') { out[k] = (v === 'true'); continue }
    out[k] = v
  }
  return out
}

async function insertTable(apiUrl, key, table, rows) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, apikey: key }
  const url = new URL(`${apiUrl.replace(/\/?$/, '')}/rest/v1/${table}`)
  const chunkSize = 200
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(chunk) })
    if (!res.ok) {
      const t = await res.text(); let p
      try { p = JSON.parse(t) } catch { p = { raw: t } }
      throw new Error(`HTTP ${res.status} on ${table}: ${JSON.stringify(p)}`)
    }
  }
}

async function main() {
  const status = getStatus()
  const API = status.API_URL
  const SRK = status.SERVICE_ROLE_KEY
  const root = path.resolve(process.cwd(), 'supabase/seed/csv')
  const files = fs.readdirSync(root).filter(f => f.endsWith('.csv'))
  const load = (name) => {
    const p = path.join(root, name)
    if (!fs.existsSync(p)) return []
    const txt = fs.readFileSync(p, 'utf8')
    const rows = parseCSV(txt).map(toTyped)
    return rows
  }

  // Import order respecting FK
  const plan = [
    { file: 'services.csv', table: 'services' },
    { file: 'service_items.csv', table: 'service_items' },
    { file: 'portfolio_categories.csv', table: 'portfolio_categories' },
    { file: 'portfolio_items.csv', table: 'portfolio_items' },
    { file: 'promotions.csv', table: 'promotions' },
    { file: 'about_content.csv', table: 'about_content' },
    { file: 'site_settings.csv', table: 'site_settings' },
    { file: 'reviews.csv', table: 'reviews' },
    { file: 'business_hours.csv', table: 'business_hours' },
    { file: 'closures.csv', table: 'closures' },
    { file: 'profiles.csv', table: 'profiles' },
    { file: 'admin_users.csv', table: 'admin_users' },
    { file: 'bookings.csv', table: 'bookings' },
    { file: 'booking_items.csv', table: 'booking_items' },
    { file: 'email_logs.csv', table: 'email_logs' },
    { file: 'cancellation_tokens.csv', table: 'cancellation_tokens' },
  ]

  for (const step of plan) {
    const rows = load(step.file)
    if (!rows.length) { console.log(`[SKIP] ${step.file} (vide)`); continue }
    console.log(`[LOAD] ${step.table}: ${rows.length} lignes`)
  await insertTable(API, SRK, step.table, rows)
    console.log(`[OK]   ${step.table}`)
  }

  console.log('[DONE] Import CSV terminé')
}

main().catch(e => { console.error('[FAIL]', e?.message || e); process.exit(1) })
