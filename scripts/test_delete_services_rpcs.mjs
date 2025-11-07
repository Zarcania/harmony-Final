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
  const { data: signIn, error: signErr } = await supabase.auth.signInWithPassword({ email, password })
  if (signErr) { console.error('[FAIL] Connexion admin', signErr.message); process.exit(1) }
  console.log('[OK] Admin connecté', signIn.user?.email)

  // 1) Créer une catégorie temporaire et la supprimer via RPC
  const tmpServiceTitle = 'TEMP RPC TEST ' + new Date().toISOString()
  const { data: svc, error: svcErr } = await supabase.from('services').insert({ title: tmpServiceTitle, icon: 'zap' }).select('id').single()
  if (svcErr) { console.error('[FAIL] Création service temporaire', svcErr.message); process.exit(1) }
  const serviceId = svc.id
  console.log('[OK] Service temporaire créé', serviceId)

  const { error: delSvcErr } = await supabase.rpc('delete_service', { p_id: serviceId })
  if (delSvcErr) { console.error('[FAIL] delete_service RPC', delSvcErr.message); process.exit(1) }
  console.log('[OK] delete_service a réussi sur une catégorie vide')

  // 2) Créer une catégorie et un item puis tester delete_service_item
  const tmpServiceTitle2 = 'TEMP RPC ITEM ' + new Date().toISOString()
  const { data: svc2, error: svcErr2 } = await supabase.from('services').insert({ title: tmpServiceTitle2, icon: 'zap' }).select('id').single()
  if (svcErr2) { console.error('[FAIL] Création service 2', svcErr2.message); process.exit(1) }
  const serviceId2 = svc2.id
  const { data: item, error: itemErr } = await supabase.from('service_items').insert({ service_id: serviceId2, label: 'Item test', price: '10€', duration: '30m' }).select('id').single()
  if (itemErr) { console.error('[FAIL] Création service_item', itemErr.message); process.exit(1) }
  const itemId = item.id
  console.log('[OK] service_item temporaire créé', itemId)

  // delete_service_item should succeed (pas de réservation future)
  const { error: delItemErr } = await supabase.rpc('delete_service_item', { p_id: itemId })
  if (delItemErr) { console.error('[FAIL] delete_service_item RPC', delItemErr.message); process.exit(1) }
  console.log('[OK] delete_service_item a réussi pour un item sans réservations')

  // 3) Recréer un item puis créer une réservation future confirmée et vérifier le blocage
  const { data: item2, error: itemErr2 } = await supabase.from('service_items').insert({ service_id: serviceId2, label: 'Item test 2', price: '20€', duration: '30m' }).select('id').single()
  if (itemErr2) { console.error('[FAIL] Création service_item 2', itemErr2.message); process.exit(1) }
  const itemId2 = item2.id

  // Créer une réservation confirmée via create_booking_by_service (SEC DEFINER)
  const startAt = new Date(Date.now() + 24*60*60*1000).toISOString() // +1 jour
  const { data: bookingRes, error: bookErr } = await supabase.rpc('create_booking_by_service', {
    p_client_name: 'Test RPC',
    p_client_email: 'rpc@example.com',
    p_client_phone: '+33000000000',
    p_service_item_id: itemId2,
    p_start_at: startAt,
    p_user_id: null,
  })
  if (bookErr) { console.error('[FAIL] Création réservation future', bookErr.message); process.exit(1) }
  console.log('[OK] Réservation future créée (status par défaut)')

  // Forcer status à 'confirmed' si nécessaire
  const bookingId = bookingRes?.id || null
  if (bookingId) {
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId)
  }

  // Tentative de suppression: doit échouer
  const { error: delItemBlockedErr } = await supabase.rpc('delete_service_item', { p_id: itemId2 })
  if (!delItemBlockedErr) { console.error('[FAIL] delete_service_item aurait dû être bloqué par réservation future confirmée'); process.exit(1) }
  console.log('[OK] Blocage confirmé pour delete_service_item: ', delItemBlockedErr.message)

  console.log('\n[SUCCES] Tous les tests RPC de suppression sont passés')
}

main().catch(e => { console.error('[FAIL]', e?.message || String(e)); process.exit(1) })
