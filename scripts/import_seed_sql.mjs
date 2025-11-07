import fs from 'fs'
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

async function main() {
  const sqlPath = 'supabase/seed.sql'
  if (!fs.existsSync(sqlPath)) {
    console.error('[FAIL] Fichier introuvable:', sqlPath)
    process.exit(1)
  }
  const sql = fs.readFileSync(sqlPath, 'utf8')
  const { DB_URL } = getStatus()
  if (!DB_URL) {
    console.error('[FAIL] DB_URL introuvable. Assurez-vous que Supabase local est démarré (supabase start).')
    process.exit(1)
  }
  const client = new pg.Client({ connectionString: DB_URL })
  try {
    await client.connect()
    console.log('[INFO] Connexion locale OK')
    // Désactiver contraintes bloquantes pour import massif (ex: CHECK sur bookings)
    await client.query('begin')
    await client.query(`
      do $$ begin
        if exists (
          select 1 from pg_constraint c
          join pg_class t on t.oid = c.conrelid
          where t.relname = 'bookings' and c.conname = 'bookings_start_not_past_active'
        ) then
          execute 'alter table public.bookings drop constraint "bookings_start_not_past_active"';
        end if;
      end $$;
    `)

    // Vider toutes les tables du schéma public (hors tables système)
    const truncateSql = `
      do $$ declare stmt text; begin
        select 'truncate table ' || string_agg(format('%I.%I', schemaname, tablename), ', ') || ' restart identity cascade' into stmt
        from pg_tables
        where schemaname = 'public'
          and tablename not like 'pg_%'
          and tablename not like 'sql_%';
        if stmt is not null then execute stmt; end if;
      end $$;
    `
    await client.query(truncateSql)

    await client.query(sql)

    // Réinstalle la contrainte en NOT VALID (préserve la règle pour les nouvelles lignes)
    await client.query(`
      alter table if exists public.bookings
      add constraint if not exists bookings_start_not_past_active
      check ((start_at >= now()) or (status = any (array['cancelled'::text,'completed'::text]))) not valid;
    `)

    await client.query('commit')
    console.log('[OK] Import seed.sql terminé')
  } catch (e) {
    try { await client.query('rollback') } catch {}
    console.error('[FAIL]', e?.message || e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch(e => { console.error('[FAIL]', e?.message || e); process.exit(1) })
