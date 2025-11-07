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
  console.error('Env manquantes: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function count(table) {
  const { data, error, status } = await sb.from(table).select('id')
  if (error) return { table, status, error: error.message }
  return { table, status, count: Array.isArray(data) ? data.length : 0 }
}

async function main() {
  const tables = [
    'services',
    'service_items',
    'business_hours',
    'closures',
    'promotions',
    'about_content',
    'site_settings',
    'reviews',
  ]
  const results = []
  for (const t of tables) results.push(await count(t))
  console.log(JSON.stringify({ url: SUPABASE_URL, results }, null, 2))
}

main().catch(e => { console.error(e?.message || String(e)); process.exit(1) })
