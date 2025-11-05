import React, { useState, useCallback } from 'react';
import { X, Calendar, User, Phone, Mail, CheckCircle } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { BookingFormData } from '../types/booking';
import { format, addDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAdmin } from '../contexts/AdminContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface BookingModalProps {
  onClose: () => void;
  preselectedService?: string | null;
}

const BookingModal: React.FC<BookingModalProps> = ({ onClose, preselectedService }) => {
  const { addBooking, checkSlotAvailable, filterSlotsBySchedule, getAvailableSlots, businessHours } = useBooking();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [showDates, setShowDates] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [promoPrice, setPromoPrice] = useState<number | null>(null);
  const [promoOriginalPrice, setPromoOriginalPrice] = useState<number | null>(null);

  const [formData, setFormData] = useState<BookingFormData>({
    service: preselectedService || '',
    serviceIds: [],
    date: '',
    time: '',
    clientName: '',
    clientFirstName: '',
    clientPhone: '',
    clientEmail: ''
  });

  // Limite anonyme: 3h max
  const MAX_DURATION_MIN = 180;

  // Verrouille le scroll de fond quand le modal est monté
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Autofill depuis localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('hc_contact');
      if (raw) {
        const v = JSON.parse(raw) as Partial<BookingFormData>;
        setFormData((f) => ({
          ...f,
          clientName: v.clientName ?? f.clientName,
          clientFirstName: v.clientFirstName ?? f.clientFirstName,
          clientPhone: v.clientPhone ?? f.clientPhone,
          clientEmail: v.clientEmail ?? f.clientEmail,
        }));
      }
    } catch (e) {
      console.debug('[Autofill] no stored contact', e);
    }
  }, []);

  // Persister à la volée les coordonnées (mémoïsé)
  const persistContact = useCallback((next: Partial<BookingFormData>) => {
    try {
      const current = { ...formData, ...next };
      const payload = {
        clientName: current.clientName,
        clientFirstName: current.clientFirstName,
        clientPhone: current.clientPhone,
        clientEmail: current.clientEmail,
      };
      localStorage.setItem('hc_contact', JSON.stringify(payload));
    } catch (e) {
      console.debug('[Autofill] cannot persist contact', e);
    }
  }, [formData]);

  // Prestations dynamiques depuis AdminContext (sections + items)
  const { serviceSections } = useAdmin();
  // Sections repliées par défaut
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  React.useEffect(() => {
    const init: Record<string, boolean> = {};
    for (const s of serviceSections) init[s.id] = true; // fermé par défaut
    setCollapsed(init);
  }, [serviceSections]);

  const toggleSection = useCallback((id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] })), []);

  // Helpers prix/durée (mémoïsés)
  const parsePrice = useCallback((price?: string) => {
    if (!price) return 0;
    const s = String(price).replace(/[^\d.,]/g, '').replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }, []);

  const parseDurMin = useCallback((raw?: string | null) => {
    if (!raw) return 60;
    const s = raw.toLowerCase().replace(/\s+/g, '');
    const m1 = s.match(/^(\d+)h(?:(\d{1,2}))?$/);
    if (m1) {
      const h = parseInt(m1[1], 10);
      const mm = m1[2] ? parseInt(m1[2], 10) : 0;
      return h * 60 + mm;
    }
    const m2 = s.match(/^(\d+)(?:min|m)$/);
    if (m2) return parseInt(m2[1], 10);
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n > 0 ? n : 60;
  }, []);
  const allItems = React.useMemo(() => serviceSections.flatMap(s => s.items.map(it => ({ ...it }))), [serviceSections]);
  // Mémorise les items présélectionnés (promo) pour calculer les extras
  const initialSelectedIdsRef = React.useRef<string[] | null>(null);

  // Préselection robuste par UUID via localStorage (prioritaire sur le libellé)
  const appliedPreselectRef = React.useRef(false);
  React.useEffect(() => {
    if (appliedPreselectRef.current) return;
    try {
      // Ancien format (single id)
      const singleId = localStorage.getItem('hc_preselected_service_id');
      // Nouveau format (liste d'ids JSON)
      const multiRaw = localStorage.getItem('hc_preselected_service_ids');
      // Prix promo éventuels
      const pp = localStorage.getItem('hc_promo_price');
      const po = localStorage.getItem('hc_promo_original_price');

      const selectedIds: string[] = [];
      if (multiRaw) {
        try { selectedIds.push(...(JSON.parse(multiRaw) as string[])); } catch { /* ignore */ }
      } else if (singleId) {
        selectedIds.push(singleId);
      }

      if (pp) {
        const p = parseFloat(String(pp).replace(/[^\d.,]/g, '').replace(',', '.'));
        if (Number.isFinite(p)) setPromoPrice(p);
      }
      if (po) {
        const p = parseFloat(String(po).replace(/[^\d.,]/g, '').replace(',', '.'));
        if (Number.isFinite(p)) setPromoOriginalPrice(p);
      }

      if (selectedIds.length) {
        const items = allItems.filter(it => selectedIds.includes(it.id));
        const lbl = items.map(it => it.label).join(' + ');
        setFormData(prev => ({
          ...prev,
          service: lbl,
          serviceIds: selectedIds,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          serviceId: selectedIds.length === 1 ? selectedIds[0] : undefined,
        }));
        initialSelectedIdsRef.current = [...selectedIds];
        // Ouvre les sections contenant ces items
        setCollapsed(prev => {
          const next = { ...prev };
          for (const s of serviceSections) {
            if (s.items.some(it => selectedIds.includes(it.id))) next[s.id] = false;
          }
          return next;
        });
        setStep(1);
      }

      try { localStorage.removeItem('hc_preselected_service_id'); } catch { /* ignore */ }
      try { localStorage.removeItem('hc_preselected_service_ids'); } catch { /* ignore */ }
      try { localStorage.removeItem('hc_promo_price'); } catch { /* ignore */ }
      try { localStorage.removeItem('hc_promo_original_price'); } catch { /* ignore */ }
    } catch { /* ignore */ }
    finally { appliedPreselectRef.current = true; }
  }, [allItems, serviceSections]);

  // Si un service est présélectionné, tenter une correspondance exacte parmi les items DB
  React.useEffect(() => {
    if (!preselectedService) return;
    const lower = preselectedService.toLowerCase().trim();
    const match = allItems.find(it => it.label.toLowerCase().trim() === lower);
    if (match) {
      setFormData(prev => ({
        ...prev,
        service: match.label,
        serviceIds: [match.id],
        // serviceId utile pour certains chemins
  // Note: serviceId est utilisé en interne dans ce composant
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  serviceId: match.id,
      }));
      // Laisser l'utilisateur sur l'écran 1 pour pouvoir ajuster les prestations
      setStep(1);
    } else {
      // Aucune correspondance: ne pas sauter l'étape 1
      setStep(1);
    }
  }, [preselectedService, allItems]);
  const selectedItems = React.useMemo(() => allItems.filter(it => formData.serviceIds?.includes(it.id)), [allItems, formData.serviceIds]);
  const totalPrice = React.useMemo(() => selectedItems.reduce((acc, it) => acc + parsePrice(it.price), 0), [selectedItems, parsePrice]);
  const totalDurationMin = React.useMemo(() => selectedItems.reduce((acc, it) => acc + parseDurMin(it.duration), 0) || 60, [selectedItems, parseDurMin]);
  const extrasPrice = React.useMemo(() => {
    if (promoPrice == null) return 0;
    const base = new Set(initialSelectedIdsRef.current || []);
    return selectedItems.filter(it => !base.has(it.id)).reduce((acc, it) => acc + parsePrice(it.price), 0);
  }, [promoPrice, selectedItems, parsePrice]);
  const displayTotal = React.useMemo(() => (promoPrice != null ? promoPrice + extrasPrice : totalPrice), [promoPrice, extrasPrice, totalPrice]);
  const combinedServiceLabel = React.useMemo(() => selectedItems.map(it => it.label).join(' + '), [selectedItems]);
  // UI: on affiche directement serviceSections groupées

  // Pré-calcul des dates disponibles (cache local sur 14 jours, exclut dimanches)
  const [availableDates, setAvailableDates] = React.useState<Date[]>([]);
  const [nextAvailableFallback, setNextAvailableFallback] = React.useState<Date | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const out: Date[] = [];
      const today = startOfDay(new Date());
      // Afficher immédiatement un fallback visuel: prochains jours ouvrés (lun-sam)
      const immediateFallback: Date[] = [];
      for (let i = 0; i < 30 && immediateFallback.length < 14; i++) {
        const d = addDays(today, i);
        if (d.getDay() !== 0) immediateFallback.push(d);
      }
      if (!cancelled) setAvailableDates(immediateFallback);
      const ids = (formData.serviceIds && formData.serviceIds.length) ? formData.serviceIds : (formData.serviceId ? [formData.serviceId] : undefined);
      for (let i = 0; i < 20; i++) {
        const d = addDays(today, i);
        if (d.getDay() === 0) continue; // pas dimanche
        const iso = format(d, 'yyyy-MM-dd');
        const slots = await getAvailableSlots(iso, ids, totalDurationMin);
        if (slots && slots.length > 0) {
          out.push(d);
          if (!cancelled) setAvailableDates([...out]); // Mise à jour incrémentale
        }
        if (out.length >= 14) break;
      }
      if (!cancelled) setAvailableDates(out);
      // Si aucune dispo dans les 7 prochains jours, calculer le prochain créneau jusqu'à 30 jours
      if (out.filter(d => +d - +today <= 7 * 24 * 3600 * 1000).length === 0) {
        for (let i = 7; i < 30; i++) {
          const d = addDays(today, i);
          if (d.getDay() === 0) continue;
          const iso = format(d, 'yyyy-MM-dd');
          const slots = await getAvailableSlots(iso, ids, totalDurationMin);
          if (slots && slots.length > 0) { setNextAvailableFallback(d); break; }
        }
      } else {
        setNextAvailableFallback(null);
      }

      // Fallback fort: si aucune date n’a été trouvée (p.ex. tables non lisibles en public),
      // proposer tout de même les 14 prochains jours ouvrés (lun-sam) pour ne pas bloquer l’UI.
      if (!cancelled && out.length === 0) {
        const fallback: Date[] = [];
        for (let i = 0; i < 30 && fallback.length < 14; i++) {
          const d = addDays(today, i);
          if (d.getDay() !== 0) fallback.push(d);
        }
        setAvailableDates(fallback);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [formData.serviceId, formData.serviceIds, totalDurationMin, getAvailableSlots]);

  const handleSubmit = async () => {
    // Réservation sans connexion: insert anonyme autorisé par RLS
    try {
      const serviceText = (formData.service && formData.service.trim().length) ? formData.service : (combinedServiceLabel || '');
      await addBooking({ ...formData, service: serviceText, status: 'confirmed' });
      showToast('Rendez-vous enregistré.', 'success');
      setIsSubmitted(true);
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? 'Erreur lors de la réservation';
      showToast(msg, 'error');
    }
  };

  const [slots, setSlots] = useState<string[]>([]);
  const emailValid = React.useMemo(() => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(formData.clientEmail || ''), [formData.clientEmail]);
  const phoneValid = React.useMemo(() => {
    const v = (formData.clientPhone || '').trim();
    // Formats FR acceptés: 0XXXXXXXXX (10 chiffres commençant par 0), ou +33XXXXXXXXX (9 chiffres après +33)
    return /^0[1-9]\d{8}$/.test(v) || /^\+33[1-9]\d{8}$/.test(v);
  }, [formData.clientPhone]);
  // Récupère les créneaux depuis le contexte (prend en compte horaires/fermetures et chevauchements)
  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!formData.date) { setSlots([]); return; }
      try {
  const sid = formData.serviceIds && formData.serviceIds.length ? formData.serviceIds : (formData.serviceId ? [formData.serviceId] : undefined);
  let list = await getAvailableSlots(formData.date, sid, totalDurationMin);
        // Sécurité UX: si aucune dispo n'est renvoyée (p.ex. lecture DB transitoire), on affiche un fallback local
        if (!list || list.length === 0) {
          // Tant que les horaires ne sont pas chargés, ne pas afficher de base 09:00–18:00 pour éviter des faux positifs (12:00/12:30)
          const bhReady = Array.isArray(businessHours) && businessHours.length > 0;
          if (!bhReady) { if (!cancelled) setSlots([]); return; }
          
          // Récupérer horaires configurés pour ce jour
          const dateObj = new Date(formData.date);
          const dow = (dateObj.getDay() + 6) % 7; // JS: 0=dim → DB: 0=lun
          const bh = businessHours.find(b => b.day_of_week === dow);
          const openTime = bh?.open_time || '09:00';
          const closeTime = bh?.close_time || '18:00';
          
          const buildSlots = (open: string, close: string, stepMin = 30) => {
            const [oh, om] = open.split(':').map(n => parseInt(n, 10));
            const [ch, cm] = close.split(':').map(n => parseInt(n, 10));
            const out: string[] = [];
            let cur = new Date(`${formData.date}T${String(oh).padStart(2,'0')}:${String(om).padStart(2,'0')}:00`);
            const end = new Date(`${formData.date}T${String(ch).padStart(2,'0')}:${String(cm).padStart(2,'0')}:00`);
            while (cur < end) {
              const hh = String(cur.getHours()).padStart(2, '0');
              const mm = String(cur.getMinutes()).padStart(2, '0');
              out.push(`${hh}:${mm}`);
              cur = new Date(cur.getTime() + stepMin * 60 * 1000);
            }
            return out;
          };
          
          let base = buildSlots(openTime, closeTime);
          
          // ✅ AJOUT: Filtrer les créneaux déjà réservés via RPC get_booked_slots (SETOF tstzrange)
          try {
            const { data: bookedData } = await supabase.rpc('get_booked_slots', { p_date: formData.date });
            if (bookedData && Array.isArray(bookedData)) {
              const occupiedSet = new Set<string>();
              for (const it of bookedData as unknown[]) {
                const rangeStr = typeof it === 'string' ? it : (it && typeof it === 'object' && 'ts' in (it as Record<string, unknown>) ? String((it as Record<string, unknown>).ts) : undefined);
                if (!rangeStr) continue;
                let inner = rangeStr.trim();
                if (inner.startsWith('[') || inner.startsWith('(')) inner = inner.slice(1);
                if (inner.endsWith(']') || inner.endsWith(')')) inner = inner.slice(0, -1);
                const parts = inner.split(',');
                if (parts.length < 2) continue;
                const start = new Date(parts[0].trim());
                const end = new Date(parts[1].trim());
                if (isNaN(+start) || isNaN(+end)) continue;
                const startMin = start.getHours() * 60 + start.getMinutes();
                const totalMin = Math.max(30, Math.round((+end - +start) / 60000));
                const steps = Math.max(1, Math.ceil(totalMin / 30));
                for (let k = 0; k < steps; k++) {
                  const cur = startMin + k * 30;
                  const hh = String(Math.floor(cur / 60)).padStart(2, '0');
                  const mm = String(cur % 60).padStart(2, '0');
                  occupiedSet.add(`${hh}:${mm}`);
                }
              }
              // Filtrer les créneaux occupés ET vérifier que la durée totale est disponible
              const stepsNeeded = Math.max(1, Math.ceil(totalDurationMin / 30));
              base = base.filter(slot => {
                // Vérifier que tous les pas nécessaires sont libres
                for (let k = 0; k < stepsNeeded; k++) {
                  const [h, m] = slot.split(':').map(n => parseInt(n, 10));
                  const totalMin = h * 60 + m + (k * 30);
                  const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
                  const mm = String(totalMin % 60).padStart(2, '0');
                  if (occupiedSet.has(`${hh}:${mm}`)) return false;
                }
                return true;
              });
            }
          } catch (err) {
            console.warn('[Booking] get_booked_slots failed in fallback, showing all slots', err);
          }
          
          // On filtre par horaires SI disponibles, sinon on garde la base pour ne pas bloquer l'utilisateur
          const filtered = filterSlotsBySchedule(new Date(formData.date), base);
          const usable = (filtered && filtered.length > 0) ? filtered : base;
          const today = new Date().toISOString().slice(0,10);
          const nowStr = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).replace(/[^\d]/g, '').replace(/(\d{2})(\d{2})/, '$1:$2');
          list = formData.date !== today ? usable : usable.filter(t => t > nowStr);
        }
        if (!cancelled) setSlots(list);
      } catch (e) {
        console.warn('[Booking] getAvailableSlots failed, fallback to schedule-only filter', e);
        // Fallback minimal en cas d’erreur: génère localement et filtre par horaires
        const buildSlots = (open: string, close: string, stepMin = 30) => {
          const [oh, om] = open.split(':').map(n => parseInt(n, 10));
          const [ch, cm] = close.split(':').map(n => parseInt(n, 10));
          const out: string[] = [];
          let cur = new Date(`${formData.date}T${String(oh).padStart(2,'0')}:${String(om).padStart(2,'0')}:00`);
          const end = new Date(`${formData.date}T${String(ch).padStart(2,'0')}:${String(cm).padStart(2,'0')}:00`);
          while (cur < end) {
            const hh = String(cur.getHours()).padStart(2, '0');
            const mm = String(cur.getMinutes()).padStart(2, '0');
            out.push(`${hh}:${mm}`);
            cur = new Date(cur.getTime() + stepMin * 60 * 1000);
          }
          return out;
        };
        // Si les horaires ne sont pas encore chargés, n'afficher aucun slot
        const bhReady = Array.isArray(businessHours) && businessHours.length > 0;
        if (!bhReady) { if (!cancelled) setSlots([]); return; }
        
        // Récupérer horaires configurés
        const dateObj = new Date(formData.date);
        const dow = (dateObj.getDay() + 6) % 7;
        const bh = businessHours.find(b => b.day_of_week === dow);
        const openTime = bh?.open_time || '09:00';
        const closeTime = bh?.close_time || '18:00';
        let base = buildSlots(openTime, closeTime);
        
        // Filtrer via get_booked_slots (même logique que le fallback principal)
        const duration = totalDurationMin;
        const stepsNeeded = Math.ceil(duration / 30);
        try {
          const { data: bookedData } = await supabase.rpc('get_booked_slots', { p_date: formData.date });
          if (Array.isArray(bookedData)) {
            const occupiedSet = new Set<string>();
            for (const it of bookedData as unknown[]) {
              const rangeStr = typeof it === 'string' ? it : (it && typeof it === 'object' && 'ts' in (it as Record<string, unknown>) ? String((it as Record<string, unknown>).ts) : undefined);
              if (!rangeStr) continue;
              let inner = rangeStr.trim();
              if (inner.startsWith('[') || inner.startsWith('(')) inner = inner.slice(1);
              if (inner.endsWith(']') || inner.endsWith(')')) inner = inner.slice(0, -1);
              const parts = inner.split(',');
              if (parts.length < 2) continue;
              const start = new Date(parts[0].trim());
              const end = new Date(parts[1].trim());
              if (isNaN(+start) || isNaN(+end)) continue;
              const startMin = start.getHours() * 60 + start.getMinutes();
              const totalMin = Math.max(30, Math.round((+end - +start) / 60000));
              const steps = Math.max(1, Math.ceil(totalMin / 30));
              for (let k = 0; k < steps; k++) {
                const cur = startMin + k * 30;
                const hh = String(Math.floor(cur / 60)).padStart(2, '0');
                const mm = String(cur % 60).padStart(2, '0');
                occupiedSet.add(`${hh}:${mm}`);
              }
            }
            base = base.filter(slot => {
              for (let k = 0; k < stepsNeeded; k++) {
                const [h, m] = slot.split(':').map(Number);
                const newM = m + k * 30;
                const finalH = Math.floor(h + newM / 60);
                const finalM = newM % 60;
                const timeSlot = `${String(finalH).padStart(2,'0')}:${String(finalM).padStart(2,'0')}`;
                if (occupiedSet.has(timeSlot)) return false;
              }
              return true;
            });
          }
        } catch {
          // Si get_booked_slots échoue, on affiche tous les créneaux (comportement existant)
        }
        
        const filtered = filterSlotsBySchedule(new Date(formData.date), base);
        const usable = (filtered && filtered.length > 0) ? filtered : base;
        const today = new Date().toISOString().slice(0,10);
        const nowStr = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).replace(/[^\d]/g, '').replace(/(\d{2})(\d{2})/, '$1:$2');
        const onlyFuture = formData.date !== today ? usable : usable.filter(t => t > nowStr);
        if (!cancelled) setSlots(onlyFuture);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [formData.date, formData.serviceId, formData.serviceIds, getAvailableSlots, filterSlotsBySchedule, totalDurationMin, businessHours]);

  if (isSubmitted) {
    // Build calendar helpers
    const findServiceDurationMin = () => totalDurationMin;
    const startDate = formData.date && formData.time ? new Date(`${formData.date}T${formData.time}:00`) : null;
    const durationMin = findServiceDurationMin();
    const endDate = startDate ? new Date(startDate.getTime() + durationMin * 60 * 1000) : null; // duration from service or 1h
    const pad = (n: number) => n.toString().padStart(2, '0');
    const toGoogleDate = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const title = encodeURIComponent(`Rendez-vous - ${combinedServiceLabel || formData.service}`);
    const details = encodeURIComponent('Rendez-vous pris via Harmonie Cils');
    const location = encodeURIComponent('Harmonie Cils');
    const googleUrl = startDate && endDate
      ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${toGoogleDate(startDate)}/${toGoogleDate(endDate)}&details=${details}&location=${location}`
      : '';

    // ICS supprimé

    // ICS supprimé à la demande; le bouton de téléchargement n'est plus affiché
    return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-6 md:p-8 overflow-y-auto pt-[env(safe-area-inset-top)]">
        <div className="relative bg-white rounded-2xl max-w-md w-full p-6 md:p-8 text-center shadow-2xl my-auto">
          <button
            onClick={onClose}
            aria-label="Fermer"
            title="Fermer"
            className="absolute top-3 right-3 p-2 text-harmonie-400 hover:text-harmonie-600 hover:bg-harmonie-50 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h3 className="font-display text-2xl font-bold text-harmonie-800 mb-2">
            Réservation confirmée !
          </h3>
          <p className="text-harmonie-600 mb-4">
            Votre rendez-vous a été enregistré avec succès.
          </p>
          <div className="bg-harmonie-50 rounded-xl p-4 text-left">
            <p className="text-sm text-harmonie-700">
              <strong>Prestations :</strong> {combinedServiceLabel || formData.service}<br />
              <strong>Date :</strong> {format(new Date(formData.date), 'EEEE d MMMM yyyy', { locale: fr })}<br />
              <strong>Heure :</strong> {formData.time}<br />
              <strong>Durée :</strong> {durationMin} min
            </p>
          </div>
          {startDate && googleUrl && (
            <div className="mt-5">
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 transition-colors"
              >
                Ajouter à l'agenda
              </a>
            </div>
          )}
          <button
            onClick={onClose}
            className="mt-5 w-full bg-harmonie-600 text-white rounded-lg px-4 py-2 hover:bg-harmonie-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-6 md:p-8 pt-[env(safe-area-inset-top)]" style={{ overscrollBehavior: 'contain' }}>
  <div className="bg-white rounded-xl md:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-auto" style={{ overscrollBehavior: 'contain' }}>
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-harmonie-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-harmonie-100 text-harmonie-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <h3 className="font-display text-lg md:text-xl font-bold text-harmonie-800">
              Prendre rendez-vous
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer le modal"
            title="Fermer"
            className="p-2 text-harmonie-400 hover:text-harmonie-600 hover:bg-harmonie-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-center p-4 bg-harmonie-50">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= stepNumber 
                  ? 'bg-harmonie-600 text-white' 
                  : 'bg-harmonie-200 text-harmonie-600'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div className={`w-12 h-1 mx-2 ${
                  step > stepNumber ? 'bg-harmonie-600' : 'bg-harmonie-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="p-4 md:p-6">
          {/* Étape 1: Prestations (multi-sélection) */}
          {step === 1 && (
            <div>
              <h4 className="font-semibold text-harmonie-800 mb-4 text-base md:text-lg">
                Choisissez vos prestations
              </h4>
              {(preselectedService || (formData.serviceIds && formData.serviceIds.length > 0)) && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Suggestion :</strong> {combinedServiceLabel || preselectedService}
                    {promoPrice != null && (
                      <>
                        {' '}
                        <span className="ml-2 inline-block px-2 py-0.5 rounded bg-harmonie-100 text-harmonie-700 text-xs">
                          Promo {promoOriginalPrice != null ? `${promoPrice.toFixed(2)}€ au lieu de ${promoOriginalPrice.toFixed(2)}€` : `${promoPrice.toFixed(2)}€`}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              )}
              <div className="grid gap-3">
                {serviceSections.map((section) => (
                  <div key={section.id} className="border border-harmonie-200 rounded-xl overflow-hidden">
                    <button onClick={() => toggleSection(section.id)} className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-harmonie-700 bg-harmonie-50">
                      <span>{section.title}</span>
                      <span className="text-harmonie-500">{collapsed[section.id] ? '▸' : '▾'}</span>
                    </button>
                    {!collapsed[section.id] && (
                      <div className="p-2 grid gap-2">
                        {section.items.map((item) => {
                          const checked = formData.serviceIds?.includes(item.id) || false;
                          return (
                            <label key={item.id} className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${checked ? 'border-harmonie-500 bg-harmonie-50' : 'border-harmonie-200 hover:border-harmonie-300'}`}>
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 mt-0.5"
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = new Set(formData.serviceIds || []);
                                    if (e.target.checked) next.add(item.id); else next.delete(item.id);
                                    const nextIds = Array.from(next);
                                    setFormData({
                                      ...formData,
                                      serviceIds: nextIds,
                                      // service (texte) combiné pour l’enregistrement
                                      service: nextIds.length ? allItems.filter(it => nextIds.includes(it.id)).map(it => it.label).join(' + ') : '',
                                      serviceId: nextIds.length === 1 ? nextIds[0] : undefined,
                                    })
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-harmonie-900">{item.label}</div>
                                  <div className="text-xs text-harmonie-600">{item.description || '—'}</div>
                                </div>
                                <div className="text-right whitespace-nowrap">
                                  <div className="font-semibold text-harmonie-900">{item.price}</div>
                                  <div className="text-xs text-harmonie-600">{item.duration || '—'}</div>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Total */}
              <div className="flex items-center justify-between mt-4 text-sm">
                <div className="text-harmonie-700">Total</div>
                <div className="font-semibold text-harmonie-900">
                  {promoPrice != null && promoOriginalPrice != null ? (
                    <>
                      <span className="text-neutral-400 line-through mr-2">{promoOriginalPrice.toFixed(2)}€</span>
                      <span>{displayTotal.toFixed(2)}€</span>
                    </>
                  ) : (
                    <span>{displayTotal.toFixed(2)}€</span>
                  )}
                </div>
              </div>
              {totalDurationMin > MAX_DURATION_MIN && (
                <div className="mt-2 text-xs text-amber-700">
                  La durée totale dépasse 3 heures. Merci de réduire votre sélection.
                </div>
              )}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={((!formData.serviceIds || formData.serviceIds.length === 0) && promoPrice == null) || totalDurationMin > MAX_DURATION_MIN}
                  className="bg-harmonie-600 text-white px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base rounded-lg hover:bg-harmonie-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Étape 2: Date et heure */}
          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-harmonie-800 text-base md:text-lg">
                  Choisissez votre créneau
                </h4>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm px-3 py-1.5 border border-harmonie-300 rounded hover:bg-harmonie-50 text-harmonie-700"
                >
                  Changer de prestations
                </button>
              </div>
              {preselectedService && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Prestation :</strong> {formData.service}
                  </p>
                </div>
              )}
              
              {/* Sélection de date */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-harmonie-700 mb-3">
                  Date
                </label>
                {formData.date && !showDates ? (
                  <div className="flex items-center justify-between p-3 border border-harmonie-200 rounded-lg bg-harmonie-50">
                    <div className="text-sm font-medium text-harmonie-800">
                      {format(new Date(formData.date), 'EEEE d MMMM yyyy', { locale: fr })}
                    </div>
                    <button
                      onClick={() => setShowDates(true)}
                      className="text-sm px-3 py-1.5 border border-harmonie-300 rounded hover:bg-white"
                    >
                      Changer de date
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableDates.map((date) => (
                      <button
                        key={date.toISOString()}
                        onClick={() => { setFormData({ ...formData, date: format(date, 'yyyy-MM-dd'), time: '' }); setShowDates(false); }}
                        className={`p-2 md:p-3 rounded-lg border text-xs md:text-sm transition-all ${
                          formData.date === format(date, 'yyyy-MM-dd')
                            ? 'border-harmonie-500 bg-harmonie-50'
                            : 'border-harmonie-200 hover:border-harmonie-300'
                        }`}
                      >
                        <div className="font-medium">
                          {format(date, 'EEE d', { locale: fr })}
                        </div>
                        <div className="text-xs text-harmonie-600">
                          {format(date, 'MMM', { locale: fr })}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {availableDates.length === 0 && nextAvailableFallback && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  Aucun créneau dans les 7 prochains jours. Prochain jour disponible: <button onClick={() => { setFormData({ ...formData, date: format(nextAvailableFallback, 'yyyy-MM-dd'), time: '' }); setShowDates(false); }} className="underline font-medium">{format(nextAvailableFallback, 'EEEE d MMMM', { locale: fr })}</button>
                </div>
              )}

              {/* Sélection d'heure */}
              {formData.date && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-harmonie-700 mb-3">
                    Heure
                  </label>
                  {slots.length === 0 ? (
                    <div className="text-sm text-harmonie-600">Aucun créneau</div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 relative">
                      {slots.map((t) => (
                        <button
                          key={t}
                          onClick={() => setFormData({ ...formData, time: t })}
                          className={`p-2 md:p-3 rounded-lg border text-xs md:text-sm transition-all ${
                            formData.time === t ? 'border-harmonie-500 bg-harmonie-50' : 'border-harmonie-200 hover:border-harmonie-300'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="border border-harmonie-200 text-harmonie-600 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base rounded-lg hover:bg-harmonie-50 transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={async () => {
                    if (!formData.date || !formData.time) return;
                    const sid = formData.serviceIds && formData.serviceIds.length ? formData.serviceIds : (formData.serviceId ? [formData.serviceId] : undefined);
                    const ok = await checkSlotAvailable(formData.date, formData.time, sid, totalDurationMin);
                    if (ok) setStep(3);
                    else {
                      alert("Ce créneau vient d'être pris. Merci d'en choisir un autre.");
                    }
                  }}
                  disabled={!formData.date || !formData.time}
                  className="bg-harmonie-600 text-white px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base rounded-lg hover:bg-harmonie-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Étape 3: Informations client */}
          {step === 3 && (
            <div>
              <h4 className="font-semibold text-harmonie-800 mb-4 text-base md:text-lg">
                Vos coordonnées
              </h4>
              
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-harmonie-700 mb-2">
                    Nom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-harmonie-400" size={16} />
                    <input
                      type="text"
                      autoComplete="family-name"
                      name="lastName"
                      value={formData.clientName}
                      onChange={(e) => { const v = e.target.value; setFormData({ ...formData, clientName: v }); persistContact({ clientName: v }); }}
                      className="w-full pl-10 pr-4 py-2.5 md:py-3 text-sm md:text-base border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-harmonie-700 mb-2">
                    Prénom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-harmonie-400" size={16} />
                    <input
                      type="text"
                      autoComplete="given-name"
                      name="firstName"
                      value={formData.clientFirstName}
                      onChange={(e) => { const v = e.target.value; setFormData({ ...formData, clientFirstName: v }); persistContact({ clientFirstName: v }); }}
                      className="w-full pl-10 pr-4 py-2.5 md:py-3 text-sm md:text-base border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                      placeholder="Votre prénom"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-harmonie-700 mb-2">
                    Téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-harmonie-400" size={16} />
                    <input
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      name="phone"
                      title="Numéro de téléphone (FR: 0XXXXXXXXX ou +33XXXXXXXXX)"
                      value={formData.clientPhone}
                      onChange={(e) => {
                        // Nettoyage léger: conserver chiffres et + en tête
                        const raw = e.target.value;
                        const cleaned = raw.replace(/[^+\d]/g, '');
                        setFormData({ ...formData, clientPhone: cleaned });
                        persistContact({ clientPhone: cleaned });
                      }}
                      className="w-full pl-10 pr-4 py-2.5 md:py-3 text-sm md:text-base border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                      placeholder="Ex: 06XXXXXXXX ou +33XXXXXXXXX"
                    />
                  </div>
                  {!phoneValid && (
                    <p className="mt-1 text-xs text-amber-700">Format attendu: 0XXXXXXXXX (10 chiffres) ou +33XXXXXXXXX (9 chiffres).</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-harmonie-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-harmonie-400" size={16} />
                    <input
                      type="email"
                      autoComplete="email"
                      name="email"
                      value={formData.clientEmail}
                      onChange={(e) => { const v = e.target.value; setFormData({ ...formData, clientEmail: v }); persistContact({ clientEmail: v }); }}
                      className="w-full pl-10 pr-4 py-2.5 md:py-3 text-sm md:text-base border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Récapitulatif */}
              <div className="bg-harmonie-50 rounded-xl p-4 mb-6">
                <h5 className="font-medium text-harmonie-800 mb-2">Récapitulatif</h5>
                <div className="text-sm text-harmonie-700 space-y-1">
                  <p><strong>Prestations :</strong> {combinedServiceLabel || formData.service}</p>
                  <p><strong>Date :</strong> {format(new Date(formData.date), 'EEEE d MMMM yyyy', { locale: fr })}</p>
                  <p><strong>Heure :</strong> {formData.time}</p>
                  <p><strong>Durée :</strong> {totalDurationMin} min</p>
                  <p>
                    <strong>Total :</strong>{' '}
                    {promoPrice != null && promoOriginalPrice != null ? (
                      <>
                        <span className="text-neutral-400 line-through mr-2">{promoOriginalPrice.toFixed(2)}€</span>
                        <span>{displayTotal.toFixed(2)}€</span>
                      </>
                    ) : (
                      <span>{displayTotal.toFixed(2)}€</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="border border-harmonie-200 text-harmonie-600 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base rounded-lg hover:bg-harmonie-50 transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.clientName || !formData.clientFirstName || !formData.clientPhone || !emailValid || !phoneValid}
                  className="bg-harmonie-600 text-white px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base rounded-lg hover:bg-harmonie-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmer le rendez-vous
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;