import { execSync } from 'node:child_process'
import pg from 'pg'

function getStatus() {
  const raw = execSync('supabase status -o json', { encoding: 'utf8' })
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new Error('Cannot parse supabase status json')
  return JSON.parse(raw.slice(start, end + 1))
}

async function main() {
  const { DB_URL } = getStatus()
  const client = new pg.Client({ connectionString: DB_URL })
  await client.connect()
  try {
    const { rows } = await client.query("select column_name, data_type from information_schema.columns where table_schema='public' and table_name='services' order by ordinal_position")
    console.log(rows)
  } finally {
    await client.end()
  }
}

main().catch(e => { console.error(e?.message || e); process.exit(1) })
