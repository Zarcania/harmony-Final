import { execSync } from 'node:child_process'

function getStatus() {
  const raw = execSync('supabase status -o json', { encoding: 'utf8' })
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new Error('Cannot parse supabase status json')
  const json = raw.slice(start, end + 1)
  const obj = JSON.parse(json)
  return obj
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`
}

function addDays(d, n) {
  const c = new Date(d.getTime());
  c.setDate(c.getDate() + n)
  return c
}

async function postJson(url, body, headers={}) {
  const res = await fetch(url, { method:'POST', headers: { 'Content-Type':'application/json', ...headers }, body: JSON.stringify(body) })
  const text = await res.text()
  let payload
  try { payload = JSON.parse(text) } catch { payload = { raw: text } }
  if (!res.ok) {
    const err = new Error(payload?.error || payload?.message || `HTTP ${res.status}`)
    err.status = res.status
    err.details = payload
    throw err
  }
  return payload
}

async function insertBooking(apiUrl, bearer, dateOff) {
  const today = new Date()
  const date = toISODate(addDays(today, dateOff))
  const start = `${date}T10:00:00`
  const end   = `${date}T11:00:00`
  const row = [{
    client_name: 'Test Window',
    client_email: 'tw@example.com',
    client_phone: '',
    service_name: 'Test',
    preferred_date: date,
    preferred_time: '10:00',
    status: 'confirmed',
    duration_minutes: 60,
    user_id: null,
    start_at: start,
    end_at: end
  }]
  const res = await fetch(`${apiUrl}/rest/v1/bookings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearer}`,
      apikey: bearer,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(row)
  })
  const text = await res.text()
  let payload
  try { payload = JSON.parse(text) } catch { payload = { raw: text } }
  return { ok: res.ok, status: res.status, payload }
}

async function main() {
  const { API_URL, ANON_KEY, SERVICE_ROLE_KEY } = getStatus()
  const base = API_URL.replace(/\/?$/, '')

  // 1) Set 26 days
  const setRes = await postJson(`${base}/functions/v1/set-booking-window`, { days: 26 }, { Authorization: `Bearer ${SERVICE_ROLE_KEY}` })
  console.log('[OK] set-booking-window 26:', setRes)

  // 2) Read RPC
  const maxDays = await postJson(`${base}/rest/v1/rpc/get_booking_max_days`, {}, { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY })
  console.log('[OK] get_booking_max_days:', maxDays)
  if (Number(maxDays) !== 26) throw new Error(`Expected 26, got ${maxDays}`)

  // 3) Insert at +26 days (should pass)
  const ins26 = await insertBooking(base, SERVICE_ROLE_KEY, 26)
  if (!ins26.ok) throw new Error(`Insert +26 failed: ${ins26.status} ${JSON.stringify(ins26.payload)}`)
  console.log('[OK] insert +26 days')

  // 4) Set 30 days then try +33 (should fail)
  const set30 = await postJson(`${base}/functions/v1/set-booking-window`, { days: 30 }, { Authorization: `Bearer ${SERVICE_ROLE_KEY}` })
  console.log('[OK] set-booking-window 30:', set30)
  const ins33 = await insertBooking(base, SERVICE_ROLE_KEY, 33)
  if (ins33.ok) throw new Error('Insert +33 should have failed')
  console.log('[OK] insert +33 correctly failed:', ins33.status, ins33.payload)
}

main().catch(e => { console.error('[FAIL]', e?.message || e); process.exit(1) })
