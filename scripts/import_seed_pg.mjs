import fs from 'fs'
import path from 'path'
import { execSync } from 'node:child_process'
import pg from 'pg'

function getStatus() {
  const raw = execSync('supabase status -o json', { encoding: 'utf8' })
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new Error('Cannot parse supabase status json')
  const json = raw.slice(start, end + 1)
  return JSON.parse(json)
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.length > 0)
  if (lines.length === 0) return { header: [], rows: [] }
  let header = splitCSVLine(lines[0])
  if (header.length > 0) header[0] = header[0].replace(/^\uFEFF/, '')
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
  return { header, rows }
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

function toTypedRow(obj) {
  const out = {}
  for (const [k,v] of Object.entries(obj)) {
    if (v === '') { out[k] = null; continue }
    if (/^-?\d+$/.test(v)) { out[k] = parseInt(v,10); continue }
    if (v === 'true' || v === 'false') { out[k] = (v === 'true'); continue }
    out[k] = v
  }
  return out
}

async function insertTableSQL(client, table, header, rows) {
  if (rows.length === 0) return
  const cols = header
  const placeholders = cols.map((_,i)=>`$${i+1}`).join(',')
  const sql = `insert into ${table} (${cols.map(c=>`"${c}"`).join(',')}) values (${placeholders})`;
  for (const raw of rows) {
    const r = toTypedRow(raw)
    const params = cols.map(c => r[c] ?? null)
    await client.query(sql, params)
  }
}

async function main() {
  const { DB_URL } = getStatus()
  const client = new pg.Client({ connectionString: DB_URL })
  await client.connect()

  // Harmonisation minimale du schÃ©ma local avant import (idempotent)
  // business_hours: s'assurer que les colonnes matin/aprÃ¨s-midi existent
  await client.query(`
    alter table if exists public.business_hours add column if not exists open_time_morning time;
    alter table if exists public.business_hours add column if not exists close_time_morning time;
    alter table if exists public.business_hours add column if not exists open_time_afternoon time;
    alter table if exists public.business_hours add column if not exists close_time_afternoon time;
    create table if not exists public.business_breaks (
      id uuid not null default gen_random_uuid() primary key,
      day_of_week integer not null,
      break_start time,
      break_end time,
      enabled boolean not null default false,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  `)

  const root = path.resolve(process.cwd(), 'supabase/seed/csv')
  const load = (name) => {
    const p = path.join(root, name)
    if (!fs.existsSync(p)) return null
    const txt = fs.readFileSync(p, 'utf8')
    const parsed = parseCSV(txt)
    return parsed
  }

  // Minimal set to get UI back up
  const plan = [
    { file: 'services.csv', table: 'public.services' },
    { file: 'service_items.csv', table: 'public.service_items' },
    { file: 'business_hours.csv', table: 'public.business_hours' },
    { file: 'closures.csv', table: 'public.closures' },
    { file: 'promotions.csv', table: 'public.promotions' },
    { file: 'about_content.csv', table: 'public.about_content' },
    { file: 'site_settings.csv', table: 'public.site_settings' },
    { file: 'reviews.csv', table: 'public.reviews' },
  ]

  try {
    await client.query('begin')
    for (const step of plan) {
      const parsed = load(step.file)
      if (!parsed || parsed.rows.length === 0) { console.log(`[SKIP] ${step.file} (vide)`); continue }
      console.log(`[LOAD] ${step.table}: ${parsed.rows.length} lignes`)
      // Idempotent: on vide la table ciblée avant réimport (cascade pour FKs)
      await client.query(`truncate table ${step.table} cascade`)
      // Spécifique: "public.service_items.duration_minutes" est une colonne générée (GENERATED ALWAYS),
      // on ne doit pas l'inclure dans l'INSERT.
      let header = parsed.header
      if (step.table === 'public.service_items') {
        header = header.filter(h => h !== 'duration_minutes')
      }
      await insertTableSQL(client, step.table, header, parsed.rows)
      console.log(`[OK]   ${step.table}`)
    }
    await client.query('commit')
    console.log('[DONE] Import PG terminé')
  } catch (e) {
    await client.query('rollback')
    console.error('[FAIL]', e?.message || e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch(e => { console.error('[FAIL]', e?.message || e); process.exit(1) })
