import React, { useEffect, useMemo, useRef, useState, lazy, Suspense, useCallback } from 'react';
import { Calendar, Clock, User, Phone, Mail, Trash2, Plus, X, CreditCard as Edit, Tag } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { format, addDays, startOfWeek, isSameDay, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Booking } from '../types/booking';
// Code-splitting: charge les modales à la demande pour accélérer l'ouverture du planning
const BookingEditModal = lazy(() => import('./BookingEditModal'));
import { supabase } from '../lib/supabase';
import { invokeFunction, invokeRawFunction } from '../api/supa';
import { useToast } from '../contexts/ToastContext';
const AdminPromotions = lazy(() => import('./AdminPromotions'));

interface AdminPlanningProps {
  onClose: () => void;
}

const AdminPlanning: React.FC<AdminPlanningProps> = ({ onClose }) => {
  const { bookings, deleteBooking, updateBooking, addBooking, refreshBookings, reloadSettings } = useBooking();
  const { showToast } = useToast();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPromotions, setShowPromotions] = useState(false);
  // Références pour scroller un rendez-vous dans le panneau de droite
  const bookingItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [focusBookingId, setFocusBookingId] = useState<string | null>(null);
  const [highlightBookingId, setHighlightBookingId] = useState<string | null>(null);
  // Popup de détails pour la vue semaine
  const [weekPopupBooking, setWeekPopupBooking] = useState<Booking | null>(null);
  // Occupations serveur (RPC publique) par date: permet d'afficher les créneaux bloqués même si RLS masque des lignes
  type Busy = { startMin: number; endMin: number };
  const [busyByDate, setBusyByDate] = useState<Record<string, Busy[]>>({});

  useEffect(() => {
    if (!focusBookingId || !selectedDate) return;
    const el = bookingItemRefs.current[focusBookingId];
    if (!el) return;
    // Scroll doux dans le panneau de droite et surbrillance éphémère
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightBookingId(focusBookingId);
      setTimeout(() => setHighlightBookingId(null), 1600);
    });
  }, [focusBookingId, selectedDate]);
  // Refs pour grilles Jour/Semaine (calcul hauteur -> slot height sans scroll)
  const dayGridRef = useRef<HTMLDivElement | null>(null);
  const weekGridRef = useRef<HTMLDivElement | null>(null);
  // Ref pour la grille de la vue mois (afin d'ancrer "aujourd'hui" en haut)
  const monthGridRef = useRef<HTMLDivElement | null>(null);
  // Hauteur dynamique inutilisée (on privilégie un scroll vertical confortable)
  // const [dayGridH, setDayGridH] = useState(600);
  // const [weekGridH, setWeekGridH] = useState(600);

  // Verrouillage du scroll de fond pendant l’ouverture du planning
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Observer de taille pour ajuster la hauteur des slots et éviter le scroll
  // Debounce pour éviter trop de re-renders lors du resize
  // On n'ajuste plus la hauteur des slots à la taille disponible: le scroll vertical est préféré pour tout voir.

  // Quand on passe en vue Mois, ancrer la cellule "aujourd'hui" en haut du conteneur scrollable
  useEffect(() => {
    if (viewMode !== 'month') return;
    // Laisser le temps au DOM de se peindre
    const id = window.requestAnimationFrame(() => {
      const root = monthGridRef.current;
      const todayEl = root?.querySelector('[data-today="true"]') as HTMLElement | null;
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [viewMode, currentMonth]);

  // Business hours and closures state
  type BusinessHour = {
    day_of_week: number;
    is_closed: boolean;
    open_time: string | null;
    close_time: string | null;
  };
  // Selon les types générés, public.closures.id est un uuid (string)
  type Closure = { id: string; start_date: string; end_date: string; reason: string | null };
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [closures, setClosures] = useState<Closure[]>([]);
  // Baseline pour diff au moment de "Enregistrer tout"
  const initialClosuresRef = useRef<Record<string, Closure>>({});
  const [saving, setSaving] = useState(false);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [closuresError, setClosuresError] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  // Pauses déjeuner supprimées: plus de lecture ni d'affichage

  const dayLabels = useMemo(() => ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], []);
  // ISO du jour (AAAA-MM-JJ) pour valeurs par défaut et filtres d'affichage
  const todayISO = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Helper: initiales du client (ex: "Anthony Corradi" -> "AC")
  const initials = (first?: string, last?: string) => {
    const a = (first || '').trim();
    const b = (last || '').trim();
    const i1 = a ? a[0].toUpperCase() : '';
    const i2 = b ? b[0].toUpperCase() : '';
    return `${i1}${i2}` || '';
  };

  useEffect(() => {
  type BusinessHourRow = { day_of_week: number; open_time: string | null; close_time: string | null; is_closed?: boolean; closed?: boolean };
    const loadSettings = async () => {
      setHoursError(null);
      setClosuresError(null);
      // Tenter is_closed; fallback sur closed si la colonne n'existe pas (42703)
  let h: BusinessHourRow[] = [];
      try {
        const r1 = await supabase
          .from('business_hours')
          .select('day_of_week, open_time, close_time, is_closed')
          .order('day_of_week', { ascending: true });
        if (r1.error && r1.error.code === '42703') {
          const r2 = await supabase
            .from('business_hours')
            .select('day_of_week, open_time, close_time, closed')
            .order('day_of_week', { ascending: true });
          if (r2.error) throw r2.error;
          h = ((r2.data as unknown) as BusinessHourRow[]) || [];
        } else if (r1.error) {
          throw r1.error;
        } else {
          h = (r1.data as BusinessHourRow[]) || [];
        }
      } catch (err) {
        console.error('Erreur chargement business_hours:', err);
        const msg = (err as { message?: string })?.message || 'Erreur lors du chargement des horaires';
        setHoursError(msg);
      }

      const { data: c, error: cErr } = await supabase
        .from('closures')
        .select('id, start_date, end_date, reason')
        .order('start_date', { ascending: true });
      if (cErr) {
        console.error('Erreur chargement closures:', cErr);
        setClosuresError(cErr.message || 'Erreur lors du chargement des fermetures');
      }

      setHours((h || []).map((row: BusinessHourRow) => {
        const normalized: BusinessHour = {
          day_of_week: row.day_of_week,
          open_time: row.open_time ? String(row.open_time).slice(0,5) : null,
          close_time: row.close_time ? String(row.close_time).slice(0,5) : null,
          is_closed: (row.is_closed ?? row.closed ?? false) as boolean,
        };
        return normalized;
      }));
      setClosures(c || []);
      // Snapshot initial pour détecter insert/update/delete au moment d'enregistrer tout
      const base: Record<string, Closure> = {};
      for (const cl of (c || [])) base[cl.id] = { ...cl };
      initialClosuresRef.current = base;
    };
    loadSettings();
  }, []);

  // Section "Pause déjeuner" sera affichée en lecture seule (dérivée d'AM/PM)

  // Générer les 7 jours de la semaine (mémoïsé pour éviter les recalculs inutiles)
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Lundi
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentWeek]);

  // Helper non utilisé désormais (remplacé par filtres inline)

  const handleDeleteBooking = useCallback((id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      deleteBooking(id);
    }
  }, [deleteBooking]);

  const handleStatusChange = useCallback((id: string, status: 'confirmed' | 'pending' | 'cancelled') => {
    updateBooking(id, { status });
  }, [updateBooking]);

  const nextWeek = () => { setCurrentWeek(addDays(currentWeek, 7)); };
  const prevWeek = () => { setCurrentWeek(addDays(currentWeek, -7)); };
  const nextDay = () => {
    const base = selectedDate ? new Date(selectedDate) : new Date();
    const d = addDays(base, 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };
  const prevDay = () => {
    const base = selectedDate ? new Date(selectedDate) : new Date();
    const d = addDays(base, -1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };
  const nextMonth = () => { const d = new Date(currentMonth); d.setMonth(d.getMonth() + 1); setCurrentMonth(d); };
  const prevMonth = () => { const d = new Date(currentMonth); d.setMonth(d.getMonth() - 1); setCurrentMonth(d); };

  // Couleur de badge: passe en rouge si le rendez-vous est terminé (heure de fin dépassée),
  // sauf si déjà annulé (reste rouge de toute façon)
  const isBookingFinished = (b: Booking): boolean => {
    try {
      // Date de fin = +60min (fallback). Si besoin on affinera avec la durée réelle par service.
      const endStr = addMinutes(b.date, b.time, 60);
      const end = new Date(`${b.date}T${endStr}:00`);
      const now = new Date();
      if (b.date < new Date().toISOString().slice(0,10)) return true; // jours passés
      if (b.date > new Date().toISOString().slice(0,10)) return false; // futur
      return now >= end; // même jour: comparer l'heure
    } catch { return false; }
  };

  const getChipColor = (b: Booking) => {
    if (b.status !== 'cancelled' && isBookingFinished(b)) {
      return 'bg-red-100 text-red-800';
    }
    switch (b.status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const addMinutes = (dateISO: string, time: string, min: number) => {
    try {
      const d = new Date(`${dateISO}T${time}:00`);
      const d2 = new Date(d.getTime() + min * 60000);
      const hh = String(d2.getHours()).padStart(2,'0');
      const mm = String(d2.getMinutes()).padStart(2,'0');
      return `${hh}:${mm}`;
    } catch { return time; }
  };

  // Utils minutes
  const timeToMin = (s: string | null | undefined): number | null => {
    if (!s) return null; const [h, m] = String(s).split(':').map(n => parseInt(n, 10));
    if (Number.isNaN(h)) return null; return h * 60 + (Number.isNaN(m) ? 0 : m);
  };
  // Arrondi visuel des fins de rendez-vous au pas de 30min pour correspondre au blocage réel
  const roundUpToStep = (minutes: number, stepMin: number) => Math.ceil(minutes / stepMin) * stepMin;
  const minToHHmm = (minutes: number) => {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };
  // Formatage convivial des durées en minutes (ex: 90 -> "1h30", 60 -> "1h", 35 -> "35 min")
  const formatDuration = (min?: number | null): string => {
    const m = typeof min === 'number' && min > 0 ? min : 60;
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (h > 0 && r > 0) return `${h}h${String(r).padStart(2, '0')}`.replace('h0', 'h');
    if (h > 0 && r === 0) return `${h}h`;
    return `${m} min`;
  };
  // Helpers réservés pour d'éventuels ajustements ultérieurs

  // Layout des événements d'une journée pour éviter toute superposition visuelle (robuste)
  type DayEvt = { id: string; startMin: number; endMin: number; raw: Booking };
  type LaidEvt = DayEvt & { lane: number; lanes: number };
  const layoutDayEvents = (events: DayEvt[]): LaidEvt[] => {
    const evs = [...events]
      .filter(e => e.endMin > e.startMin)
      .sort((a,b) => a.startMin - b.startMin || a.endMin - b.endMin);

    // 1) Concurrence par événement (nombre max qui se chevauchent avec lui)
    const overlapCount: Record<string, number> = {};
    for (let i = 0; i < evs.length; i++) {
      let cnt = 1;
      for (let j = 0; j < evs.length; j++) {
        if (i === j) continue;
        const a = evs[i]; const b = evs[j];
        const overlap = !(a.endMin <= b.startMin || b.endMin <= a.startMin);
        if (overlap) cnt++;
      }
      overlapCount[evs[i].id] = Math.max(1, cnt);
    }

    // 2) Attribution des "pistes" (lanes) via un algorithme glouton
    const trackEnd: number[] = []; // heure de fin par piste
    const result: LaidEvt[] = [];
    for (const e of evs) {
      let lane = 0;
      // trouver la première piste libre
      while (lane < trackEnd.length && trackEnd[lane] > e.startMin) {
        lane++;
      }
      trackEnd[lane] = e.endMin;
      result.push({ ...e, lane, lanes: overlapCount[e.id] });
    }

    // 3) Normalisation: s'assurer que lanes >= (max piste index + 1) pour tout chevauchement
    // (sécurité supplémentaire pour les cas chaînés)
    for (let i = 0; i < result.length; i++) {
      const a = result[i];
      let maxLane = a.lane;
      for (let j = 0; j < result.length; j++) {
        if (i === j) continue;
        const b = result[j];
        const overlap = !(a.endMin <= b.startMin || b.endMin <= a.startMin);
        if (overlap) maxLane = Math.max(maxLane, b.lane);
      }
      const needed = maxLane + 1;
      if (a.lanes < needed) result[i] = { ...a, lanes: needed };
    }

    return result;
  };

  // Index des réservations par date (évite de filtrer plusieurs fois le même tableau)
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of bookings) {
      (map[b.date] ||= []).push(b);
    }
    // Tri par heure pour les usages les plus fréquents
    for (const k of Object.keys(map)) {
      map[k] = map[k].slice().sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [bookings]);

  // Statistiques mémoïsées (évite .filter() à chaque render)
  const bookingStats = useMemo(() => {
    let confirmed = 0;
    let pending = 0;
    for (const b of bookings) {
      if (b.status === 'confirmed') confirmed++;
      else if (b.status === 'pending') pending++;
    }
    return { confirmed, pending, total: bookings.length };
  }, [bookings]);

  // Fermetures actives (non expirées) mémoïsées
  const activeClosures = useMemo(() => {
    const todayISO = new Date().toISOString().slice(0, 10);
    return closures.filter(c => (c.end_date || '') >= todayISO);
  }, [closures]);

  // Calcul de la plage horaire à afficher
  const DEFAULT_START    = 8 * 60;      // 08:00
  const MAX_END_UI_DAY   = 19 * 60;     // 19:00 (vue jour)
  const MAX_END_UI_WEEK  = 19 * 60 + 30; // 19:30 (vue semaine, +1 slot)
  const DEFAULT_END      = MAX_END_UI_DAY;  // Fallback
  const MIN_START_UI  = 8 * 60;   // Ne jamais afficher avant 08:00
  // Marges visuelles supprimées pour conserver un alignement net sur 19:00
  const toUiDow = (d: Date) => ((d.getDay() + 6) % 7); // JS: 0=dim → UI: 0=lun

  // Plus de calcul dynamique pour l’échelle d’affichage: on force 08:00 → 19:00.

  const getDayRange = (): { start: number, end: number } => {
    // Pour une lisibilité homogène, on force l'affichage 08:00 → 19:00
    // (les événements au-delà de 19:00 seraient rognés visuellement si présents)
    try {
      // On conserve la logique pour le futur si besoin, mais on renvoie une plage fixe
  return { start: MIN_START_UI, end: MAX_END_UI_DAY };
    } catch {
      return { start: DEFAULT_START, end: DEFAULT_END };
    }
  };

  const getWeekRange = (): { start: number, end: number } => {
    // Vue semaine: afficher 08:00 → 19:30 pour voir deux demi-rectangles supplémentaires en bas
    return { start: MIN_START_UI, end: MAX_END_UI_WEEK };
  };

  // Helpers fermetures/fermé hebdo
  const isDateClosedUI = (d: Date): { closed: boolean; reason?: string | null } => {
    try {
      const iso = format(d, 'yyyy-MM-dd');
      const dow = toUiDow(d);
      const h = hours.find(x => x.day_of_week === dow);
      const byHours = !!h?.is_closed;
      const cl = closures.find(c => iso >= c.start_date && iso <= c.end_date);
      return { closed: byHours || !!cl, reason: cl?.reason ?? null };
    } catch { return { closed: false }; }
  };

  const handleSaveBooking = async (bookingData: {
    service: string;
    serviceIds?: string[];
    date: string;
    time: string;
    clientName: string;
    clientFirstName: string;
    clientPhone: string;
    clientEmail: string;
    status?: 'confirmed' | 'pending' | 'cancelled';
  }) => {
    try {
      if (editingBooking) {
        await updateBooking(editingBooking.id, {
          ...bookingData,
          status: bookingData.status ?? editingBooking.status,
        });
      } else {
        await addBooking({
          service: bookingData.service,
          serviceIds: bookingData.serviceIds,
          date: bookingData.date,
          time: bookingData.time,
          clientName: bookingData.clientName,
          clientFirstName: bookingData.clientFirstName,
          clientPhone: bookingData.clientPhone,
          clientEmail: bookingData.clientEmail,
          status: bookingData.status ?? 'confirmed',
        });
      }
      setEditingBooking(null);
      setShowAddModal(false);
      showToast('Rendez-vous enregistré.', 'success');
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'SLOT_OVERLAP') {
        showToast('Ce créneau est déjà occupé pour la durée sélectionnée.', 'error');
      } else {
        const msg = (err as { message?: string })?.message || 'Erreur lors de la création du rendez-vous';
        showToast(msg, 'error');
      }
      // Laisse la modale ouverte pour permettre un autre choix d’horaire
      throw err;
    }
  };

  // -------- RPC get_booked_slots → parse en intervalles minute du jour (Europe/Paris) --------
  const parseRpcBookedSlots = useCallback((rows: unknown[]): Busy[] => {
    const result: Busy[] = [];
    for (const it of rows as unknown[]) {
      const rangeStr = typeof it === 'string'
        ? it
        : (it && typeof it === 'object' && 'ts' in (it as Record<string, unknown>)
            ? String((it as Record<string, unknown>).ts)
            : undefined);
      if (!rangeStr) continue;
      let inner = rangeStr.trim();
      if (inner.startsWith('[') || inner.startsWith('(')) inner = inner.slice(1);
      if (inner.endsWith(']') || inner.endsWith(')')) inner = inner.slice(0, -1);
      const parts = inner.split(',');
      if (parts.length >= 2) {
        const start = new Date(parts[0].trim());
        const end = new Date(parts[1].trim());
        if (!isNaN(+start) && !isNaN(+end)) {
          const sm = start.getHours() * 60 + start.getMinutes();
          const em = end.getHours() * 60 + end.getMinutes();
          if (em > sm) result.push({ startMin: sm, endMin: em });
        }
      }
    }
    return result.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  }, []);

  const ensureBusyForDate = useCallback(async (dateISO: string) => {
    if (!dateISO || busyByDate[dateISO]) return;
    try {
      const { data, error } = await supabase.rpc('get_booked_slots', { p_date: dateISO });
      if (!error && Array.isArray(data)) {
        const busy = parseRpcBookedSlots(data as unknown[]);
        setBusyByDate(prev => ({ ...prev, [dateISO]: busy }));
      } else {
        setBusyByDate(prev => ({ ...prev, [dateISO]: [] }));
      }
    } catch {
      setBusyByDate(prev => ({ ...prev, [dateISO]: [] }));
    }
  }, [busyByDate, parseRpcBookedSlots]);

  // Charger les occupations pour la vue en cours
  useEffect(() => {
    if (viewMode === 'week') {
      weekDays.forEach(d => ensureBusyForDate(format(d, 'yyyy-MM-dd')));
    } else if (viewMode === 'day') {
      const iso = selectedDate || format(new Date(), 'yyyy-MM-dd');
      ensureBusyForDate(iso);
    }
  }, [viewMode, weekDays, selectedDate, ensureBusyForDate]);

  // Save business hours via Edge Function (admin only)
  const saveBusinessHours = async () => {
    setSaving(true);
    setHoursError(null);
    try {
      // Validation minimale côté client (ouvert => heures nécessaires et ordonnées)
      for (const row of hours) {
        if (!row.is_closed) {
          const ot = row.open_time?.slice(0,5) || '';
          const ct = row.close_time?.slice(0,5) || '';
          if (!ot || !ct) {
            setHoursError('Renseignez des horaires d\'ouverture et de fermeture pour les jours ouverts, ou cochez "Fermé".');
            setSaving(false);
            return;
          }
          if (ot >= ct) {
            setHoursError('L\'heure d\'ouverture doit être antérieure à l\'heure de fermeture.');
            setSaving(false);
            return;
          }
        }
      }
      const payload = hours.map(row => ({
        day_of_week: row.day_of_week,
        is_closed: row.is_closed,
        open_time: row.is_closed ? null : (row.open_time ? row.open_time.slice(0,5) : null),
        close_time: row.is_closed ? null : (row.close_time ? row.close_time.slice(0,5) : null),
      }));
      await invokeFunction('upsert-hours', payload, { timeoutMs: 8000 })
      showToast('Horaires enregistrés.', 'success')
    } catch (e) {
      console.error('Erreur saveBusinessHours:', e);
      const msg = (e as { message?: string; code?: string })?.message || 'Erreur lors de la sauvegarde des horaires';
      setHoursError(msg);
      showToast(`Erreur horaires — ${msg}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addClosure = async () => {
    // Création locale d'une ligne temporaire, à confirmer
    setClosuresError(null);
    const tmpId = `tmp-${Date.now()}`;
    // Par défaut, pré-sélectionner la date du jour pour début et fin
    const row: Closure = { id: tmpId, start_date: todayISO, end_date: todayISO, reason: '' };
    setClosures(prev => [...prev, row]);
  };

  // Plus de sauvegarde dédiée des pauses: elles sont dérivées automatiquement d'AM/PM côté serveur lors de l'upsert des horaires.

  // Enregistrer tous les paramètres (horaires + pauses + fermetures via diff)
  const saveAllSettings = async () => {
    setSavingAll(true);
    try {
  await saveBusinessHours();

      // Valider et persister les fermetures en lot
      setClosuresError(null);
      // Validation minimale
      for (const c of closures) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(c.start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(c.end_date)) {
          const msg = 'Dates de fermeture invalides (format AAAA-MM-JJ).';
          setClosuresError(msg);
          showToast(`Erreur fermeture — ${msg}`, 'error');
          setSavingAll(false);
          return;
        }
        if (c.start_date > c.end_date) {
          const msg = 'La date de début doit être avant ou égale à la date de fin.';
          setClosuresError(msg);
          showToast(`Erreur fermeture — ${msg}`, 'error');
          setSavingAll(false);
          return;
        }
      }

      const baseline = initialClosuresRef.current || {};
      // Nettoyage automatique: ignorer/supprimer les fermetures expirées (fin strictement avant aujourd'hui)
      const currentList = activeClosures;
      const currentMap: Record<string, Closure> = {};
      for (const c of currentList) currentMap[c.id] = c;

      // Supprimer côté base tout ce qui a disparu du courant (y compris expirés)
      const toDelete = Object.keys(baseline).filter(id => !(id in currentMap));
      const toInsert = currentList.filter(c => c.id.startsWith('tmp-'));
      const changed = Object.keys(currentMap).filter(id => !id.startsWith('tmp-') && baseline[id] && (
        baseline[id].start_date !== currentMap[id].start_date ||
        baseline[id].end_date !== currentMap[id].end_date ||
        (baseline[id].reason || '') !== (currentMap[id].reason || '')
      ));

      // Exécuter les opérations (séquentiel pour surfacer les erreurs)
      for (const id of toDelete) {
        await invokeRawFunction('manage-closures', { op: 'delete', data: { id } }, { timeoutMs: 8000 });
      }
      // Inserts: remplacer les ids temporaires par les ids réels
      for (const tmp of toInsert) {
        const created = await invokeRawFunction<Closure>('manage-closures', { op: 'insert', data: { start_date: tmp.start_date, end_date: tmp.end_date, reason: tmp.reason || '' } }, { timeoutMs: 8000 });
        setClosures(prev => prev.map(x => x.id === tmp.id ? created : x));
      }
      for (const id of changed) {
        const c = currentMap[id];
        await invokeRawFunction('manage-closures', { op: 'update', data: { id: c.id, start_date: c.start_date, end_date: c.end_date, reason: c.reason ?? '' } }, { timeoutMs: 8000 });
      }

      // Re-synchroniser la baseline depuis l'état actuel
      setClosures(prev => {
        // Nettoyer aussi l'état local des fermetures expirées
        const filtered = prev.filter(c => (c.end_date || '') >= todayISO);
        const nextBase: Record<string, Closure> = {};
        for (const cl of filtered) nextBase[cl.id] = { ...cl };
        initialClosuresRef.current = nextBase;
        return filtered;
      });

  showToast('Paramètres enregistrés (horaires et fermetures).', 'success');
      // Rafraîchir les réglages globaux pour le reste de l'app (Contact, disponibilité, etc.)
      try { await reloadSettings(); } catch { /* ignore */ }
    } finally {
      setSavingAll(false);
    }
  };

  const deleteClosure = async (id: string) => {
    setClosuresError(null);
    if (!confirm('Supprimer cette fermeture ?')) return;
    // Suppression locale uniquement; la persistance sera faite lors de "Enregistrer tout"
    setClosures(prev => prev.filter(c => c.id !== id));
  };

  // Confirmation rapide: toutes les réservations en attente pour la date sélectionnée
  const confirmAllPending = async () => {
    if (!selectedDate) return;
    const pendings = (bookingsByDate[selectedDate] || []).filter(b => b.status === 'pending');
    if (pendings.length === 0) return;
    try {
      await Promise.all(pendings.map(b => updateBooking(b.id, { status: 'confirmed' })));
      showToast(`Confirmé ${pendings.length} rendez-vous.`, 'success');
    } catch (e) {
      const msg = (e as { message?: string })?.message || 'Erreur lors de la confirmation';
      showToast(msg, 'error');
    }
  };

  // UI test email retirée (centralisation des réglages sous "Enregistrer tout")

  return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-3 sm:p-6 md:p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="bg-white w-full sm:max-w-7xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden shadow-2xl relative">
        {/* En-tête sticky */}
  <div className="sticky top-0 z-10 bg-white/95 backdrop-blur flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 border-b border-harmonie-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-harmonie-100 text-harmonie-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <h3 className="font-display text-base sm:text-xl font-bold text-harmonie-800">
              Planning des rendez-vous
            </h3>
            <button
              onClick={() => refreshBookings()}
              className="ml-1 sm:ml-2 px-2 py-1 text-xs border border-harmonie-200 rounded hover:bg-harmonie-50"
              title="Rafraîchir les rendez-vous"
            >
              Rafraîchir
            </button>
          </div>
          {/* Bouton fermer (mobile uniquement) */}
          <button
            aria-label="Fermer"
            onClick={onClose}
            className="sm:hidden p-2 text-harmonie-400 hover:text-harmonie-600 hover:bg-harmonie-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
          {/* Bouton paramètres visible sous la navigation */}
          <div className="mt-2 hidden sm:flex justify-end gap-2">
            <button
              onClick={() => setShowSettings(s => !s)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-harmonie-200 rounded-lg hover:bg-harmonie-50 transition-colors text-xs sm:text-sm"
            >
              {showSettings ? 'Masquer les paramètres' : 'Paramètres d’ouverture'}
            </button>
            <button
              onClick={() => setShowPromotions(true)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-harmonie-200 rounded-lg hover:bg-harmonie-50 transition-colors text-xs sm:text-sm flex items-center gap-2"
              title="Gérer les promotions"
            >
              <Tag size={14} /> Promotions
            </button>
            {/* Bouton fermer aligné à droite des actions (desktop) */}
            <button
              aria-label="Fermer le planning"
              onClick={onClose}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-harmonie-200 rounded-lg hover:bg-harmonie-50 transition-colors text-xs sm:text-sm flex items-center gap-2"
              title="Fermer"
            >
              <X size={16} />
              <span className="hidden md:inline">Fermer</span>
            </button>
          </div>
        </div>

        {/* Navigation et vue */}
  <div className="bg-harmonie-50 border-b border-harmonie-100 p-2 sm:p-4 sticky top-[52px] sm:top-[64px] z-30">
          {viewMode === 'week' ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <button aria-label="Semaine précédente" onClick={prevWeek} className="h-9 w-9 flex items-center justify-center rounded-full bg-white border border-harmonie-200 hover:bg-harmonie-50 text-sm">←</button>
                <h4 className="text-center font-semibold text-harmonie-800 text-xs sm:text-base truncate">Semaine du {format(weekDays[0], 'd MMMM', { locale: fr })} au {format(weekDays[6], 'd MMMM yyyy', { locale: fr })}</h4>
                <button aria-label="Semaine suivante" onClick={nextWeek} className="h-9 w-9 flex items-center justify-center rounded-full bg-white border border-harmonie-200 hover:bg-harmonie-50 text-sm">→</button>
              </div>
              <div className="mt-2 flex items-center justify-center">
                <div className="inline-flex rounded-full border border-harmonie-200 bg-white p-0.5 shadow-sm">
                  <button onClick={() => { setViewMode('day'); if (!selectedDate) setSelectedDate(format(new Date(), 'yyyy-MM-dd')); }} className="px-3 py-1.5 rounded-full text-sm text-harmonie-700 hover:bg-harmonie-50">Jour</button>
                  <button onClick={() => setViewMode('week')} className="px-3 py-1.5 rounded-full text-sm bg-harmonie-600 text-white">Semaine</button>
                  <button onClick={() => setViewMode('month')} className="px-3 py-1.5 rounded-full text-sm text-harmonie-700 hover:bg-harmonie-50">Mois</button>
                </div>
                <div className="ml-auto hidden sm:block">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="ml-2 flex items-center gap-2 px-4 py-2 bg-harmonie-600 text-white rounded-lg hover:bg-harmonie-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    <Plus size={16} />
                    Nouveau rendez-vous
                  </button>
                </div>
              </div>
            </>
          ) : viewMode === 'month' ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <button aria-label="Mois précédent" onClick={prevMonth} className="h-9 w-9 flex items-center justify-center rounded-full bg-white border border-harmonie-200 hover:bg-harmonie-50 text-sm">←</button>
                <h4 className="text-center font-semibold text-harmonie-800 text-xs sm:text-base truncate">{format(currentMonth, 'MMMM yyyy', { locale: fr })}</h4>
                <button aria-label="Mois suivant" onClick={nextMonth} className="h-9 w-9 flex items-center justify-center rounded-full bg-white border border-harmonie-200 hover:bg-harmonie-50 text-sm">→</button>
              </div>
              <div className="mt-2 flex items-center justify-center">
                <div className="inline-flex rounded-full border border-harmonie-200 bg-white p-0.5 shadow-sm">
                  <button onClick={() => { setViewMode('day'); if (!selectedDate) setSelectedDate(format(new Date(), 'yyyy-MM-dd')); }} className="px-3 py-1.5 rounded-full text-sm text-harmonie-700 hover:bg-harmonie-50">Jour</button>
                  <button onClick={() => setViewMode('week')} className="px-3 py-1.5 rounded-full text-sm text-harmonie-700 hover:bg-harmonie-50">Semaine</button>
                  <button onClick={() => setViewMode('month')} className="px-3 py-1.5 rounded-full text-sm bg-harmonie-600 text-white">Mois</button>
                </div>
                <div className="ml-auto hidden sm:block">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="ml-2 flex items-center gap-2 px-4 py-2 bg-harmonie-600 text-white rounded-lg hover:bg-harmonie-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    <Plus size={16} />
                    Nouveau rendez-vous
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <button aria-label="Jour précédent" onClick={prevDay} className="h-9 w-9 flex items-center justify-center rounded-full bg-white border border-harmonie-200 hover:bg-harmonie-50 text-sm">←</button>
                <h4 className="text-center font-semibold text-harmonie-800 text-xs sm:text-base truncate">{format(selectedDate ? new Date(selectedDate) : new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</h4>
                <button aria-label="Jour suivant" onClick={nextDay} className="h-9 w-9 flex items-center justify-center rounded-full bg-white border border-harmonie-200 hover:bg-harmonie-50 text-sm">→</button>
              </div>
              <div className="mt-2 flex items-center justify-center">
                <div className="inline-flex rounded-full border border-harmonie-200 bg-white p-0.5 shadow-sm">
                  <button onClick={() => { setViewMode('day'); if (!selectedDate) setSelectedDate(format(new Date(), 'yyyy-MM-dd')); }} className="px-3 py-1.5 rounded-full text-sm bg-harmonie-600 text-white">Jour</button>
                  <button onClick={() => setViewMode('week')} className="px-3 py-1.5 rounded-full text-sm text-harmonie-700 hover:bg-harmonie-50">Semaine</button>
                  <button onClick={() => setViewMode('month')} className="px-3 py-1.5 rounded-full text-sm text-harmonie-700 hover:bg-harmonie-50">Mois</button>
                </div>
                <div className="ml-auto hidden sm:block">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="ml-2 flex items-center gap-2 px-4 py-2 bg-harmonie-600 text-white rounded-lg hover:bg-harmonie-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    <Plus size={16} />
                    Nouveau rendez-vous
                  </button>
                </div>
              </div>
            </>
          )}
          
          {/* Actions secondaires (mobile) */}
          <div className="mt-1 sm:hidden flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setShowSettings(s => !s)}
              className="px-3 py-1.5 text-sm border border-harmonie-200 rounded-full bg-white hover:bg-harmonie-50"
            >
              {showSettings ? 'Masquer les paramètres' : 'Paramètres horaires'}
            </button>
            <button
              onClick={() => setShowPromotions(true)}
              className="px-3 py-1.5 text-sm border border-harmonie-200 rounded-full bg-white hover:bg-harmonie-50 flex items-center gap-2"
            >
              <Tag size={14} /> Promotions
            </button>
          </div>
          {/* Bouton ajout sur desktop déplacé sous la navigation */}

        {showSettings && (
          <div className="border-b border-harmonie-200 bg-white p-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colonne gauche: Horaires hebdomadaires */}
              <div>
                <h4 className="font-semibold text-harmonie-800 mb-3">Horaires hebdomadaires</h4>
                {hoursError && <p className="text-red-600 mb-2">{hoursError}</p>}
                <div className="space-y-2">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const h =
                      hours.find(x => x.day_of_week === i) ||
                      ({
                        day_of_week: i,
                        open_time: '09:00',
                        close_time: '18:00',
                        is_closed: i >= 5, // sam/dim fermés par défaut
                      } as BusinessHour);
                    const d: BusinessHour = { ...h };
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-12 text-harmonie-700">{dayLabels[i]}</div>
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={h.is_closed}
                            onChange={e => setHours(prev => {
                              const willClose = e.target.checked;
                              const open_time = !willClose && (!h.open_time || h.open_time.trim() === '') ? '09:00' : (h.open_time || null);
                              const close_time = !willClose && (!h.close_time || h.close_time.trim() === '') ? '18:00' : (h.close_time || null);
                              const nextRow: BusinessHour = { ...h, is_closed: willClose, open_time, close_time };
                              const next = [...prev.filter(x => x.day_of_week !== i), nextRow];
                              return next.sort((a,b) => a.day_of_week - b.day_of_week);
                            })}
                          />
                          <span>Fermé</span>
                        </label>
                        {!h.is_closed && (
                          <div className="flex items-center gap-2">
                            <span className="text-harmonie-600 text-xs">Ouverture</span>
                            <input type="time" step={600} value={d.open_time || ''} onChange={e => setHours(prev => {
                              const next = [...prev.filter(x => x.day_of_week !== i), { ...h, open_time: e.target.value } as BusinessHour];
                              return next.sort((a,b) => a.day_of_week - b.day_of_week);
                            })} className="border border-harmonie-200 rounded px-2 py-1" />
                            <span className="text-harmonie-600 text-xs">Fermeture</span>
                            <input type="time" step={600} value={d.close_time || ''} onChange={e => setHours(prev => {
                              const next = [...prev.filter(x => x.day_of_week !== i), { ...h, close_time: e.target.value } as BusinessHour];
                              return next.sort((a,b) => a.day_of_week - b.day_of_week);
                            })} className="border border-harmonie-200 rounded px-2 py-1" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex gap-2 items-center flex-wrap">
                  <button
                    onClick={saveAllSettings}
                    disabled={saving || savingAll}
                    className="px-4 py-2 bg-harmonie-700 text-white rounded-lg shadow hover:bg-harmonie-800 disabled:opacity-50"
                    title="Enregistrer horaires et fermetures"
                  >
                    {savingAll ? 'Enregistrement…' : 'Enregistrer tout'}
                  </button>
                </div>
              </div>

              {/* Colonne droite: Fermetures exceptionnelles */}
              <div>
                <h4 className="font-semibold text-harmonie-800 mb-3">Fermetures exceptionnelles</h4>
                {closuresError && <p className="text-red-600 mb-2">{closuresError}</p>}
                {/*
                  N'afficher que les fermetures à venir (ou en cours).
                  Une fermeture est considérée expirée si end_date < todayISO.
                */}
                <div className="space-y-3">
                  {activeClosures.map(c => (
                    <div key={c.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="date"
                        value={c.start_date}
                        onChange={e => {
                          const v = e.target.value;
                          setClosures(prev => prev.map(x => x.id === c.id ? { ...x, start_date: v } : x));
                        }}
                        className="border border-harmonie-200 rounded px-2 py-1"
                      />
                      <span>→</span>
                      <input
                        type="date"
                        value={c.end_date}
                        onChange={e => {
                          const v = e.target.value;
                          setClosures(prev => prev.map(x => x.id === c.id ? { ...x, end_date: v } : x));
                        }}
                        className="border border-harmonie-200 rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        placeholder="Raison (optionnel)"
                        value={c.reason || ''}
                        onChange={e => {
                          const v = e.target.value;
                          setClosures(prev => prev.map(x => x.id === c.id ? { ...x, reason: v } : x));
                        }}
                        className="flex-1 border border-harmonie-200 rounded px-2 py-1"
                      />
                      <button onClick={() => deleteClosure(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Supprimer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {activeClosures.length === 0 && (
                    <div className="text-sm text-harmonie-600">Aucune fermeture à venir.</div>
                  )}
                </div>
                <div className="mt-3 flex gap-2 items-center">
                  <button
                    onClick={addClosure}
                    className="px-4 py-2 bg-white border border-harmonie-200 rounded-lg hover:bg-harmonie-50"
                  >
                    Ajouter une fermeture
                  </button>
                  {/* Espace réservé supprimé pour l'envoi test d'email */}
                </div>
              </div>
            </div>
          </div>
        )}

        </div>

  <div className="flex flex-col sm:flex-row h-[calc(92vh-150px)] sm:h-[calc(90vh-180px)] min-w-0">
          {/* Vue calendrier */}
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-auto">
            {viewMode === 'week' ? (
              // Vue semaine: grille horaire sans scroll (slot height adapté à la hauteur dispo)
              <div ref={weekGridRef} className="h-full min-w-0">
                {(() => {
                  const { start: startMin, end: endMin } = getWeekRange();
                  const stepMin = 30;
                  const rows = Math.ceil((endMin - startMin) / stepMin);
                  const slotPx = 22; // Hauteur fixe pour activer le scroll vertical si nécessaire
                  const dayIso = (d: Date) => format(d, 'yyyy-MM-dd');
                    const laidByDay = weekDays.map((d) => {
                    const iso = dayIso(d);
                    const evs: DayEvt[] = (bookingsByDate[iso] || [])
                      .map(b => {
                        const sm = timeToMin(b.time) ?? startMin;
                        const emRaw = sm + (b.duration_minutes || 60);
                        const em = roundUpToStep(emRaw, stepMin); // étend visuellement au prochain palier de 30min
                        return { id: b.id, startMin: sm, endMin: em, raw: b };
                      })
                      .filter(e => e.endMin > e.startMin);
                    return layoutDayEvents(evs);
                  });
                  return (
                    <>
                      {/* En-tête sticky des jours */}
                      <div className="sticky top-0 z-10 grid grid-cols-[44px_repeat(7,1fr)] gap-1 sm:gap-2 p-1 sm:p-2 pb-1 sm:pb-2 bg-harmonie-50 border-b border-harmonie-100">
                        <div />
                        {weekDays.map((d, di) => {
                          const isToday = isSameDay(d, new Date());
                          const closedInfo = isDateClosedUI(d);
                          return (
                            <div key={`hd-${di}`} className={`text-center text-[11px] sm:text-xs font-medium ${isToday ? 'text-harmonie-800' : 'text-harmonie-700'}`}>
                              <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full ${isToday ? 'bg-harmonie-100 border border-harmonie-200' : 'bg-white border border-harmonie-100'}`}>
                                <span>{format(d, 'EEE d', { locale: fr })}</span>
                                {closedInfo.closed && <span className="text-[10px] text-red-700">Fermé</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-[44px_repeat(7,1fr)] gap-1 sm:gap-2 p-1 sm:p-2" style={{ height: `${rows*slotPx}px` }}>
                      {/* Heures */}
                      <div className="text-[10px] text-harmonie-600 select-none sticky left-0 z-10 bg-harmonie-50">
                        {Array.from({ length: rows + 1 }).map((_, i) => {
                          const m = startMin + i*stepMin;
                          const hh = String(Math.floor(m/60)).padStart(2,'0');
                          const mm = String(m%60).padStart(2,'0');
                          return (<div key={i} className="absolute right-1" style={{ top: `${i*slotPx}px` }}>{hh}:{mm}</div>);
                        })}
                      </div>
                      {/* Jours */}
                      {weekDays.map((d, di) => {
                        const isToday = isSameDay(d, new Date());
                        const isPast = isBefore(startOfDay(d), startOfDay(new Date()));
                        const closedInfo = isDateClosedUI(d);
                        
                        return (
                          <div key={di} className={`relative border border-harmonie-200 rounded bg-white overflow-hidden ${isPast ? 'opacity-70' : ''}`}>
                            {/* Titres */}
                            <div className={`absolute top-1 left-1 z-10 text-[11px] ${isToday ? 'text-harmonie-700 font-semibold' : 'text-harmonie-500'}`}>
                              {format(d, 'EEE d', { locale: fr })}
                            </div>
                            {/* Lignes demi-heure */}
                            {Array.from({ length: rows + 1 }).map((_, i) => (
                              <div key={i} className={`absolute left-0 right-0 border-t ${i % 2 === 0 ? 'border-harmonie-200' : 'border-harmonie-100'}`} style={{ top: `${i*slotPx}px` }} />
                            ))}
                            <div style={{ height: `${rows*slotPx}px` }} />
                            {/* Fin visuelle de colonne (bordure + fade) */}
                            <div className="absolute left-0 right-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                            <div className="absolute left-0 right-0 bottom-0 border-t border-harmonie-300/70 pointer-events-none" />
                            {/* Ligne de l'heure actuelle */}
                            {isToday && (() => {
                              const now = new Date();
                              const nowMin = now.getHours() * 60 + now.getMinutes();
                              if (nowMin < startMin || nowMin > endMin) return null;
                              const top = ((nowMin - startMin) / stepMin) * slotPx;
                              return <div className="absolute left-0 right-0 z-20 h-[2px] bg-red-500/70" style={{ top: `${top}px` }} />;
                            })()}
                            {/* Overlay pause déjeuner supprimée */}
                            {/* Overlay fermeture (hebdo ou exceptionnelle) */}
                            {closedInfo.closed && (
                              <>
                                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(220,38,38,0.10) 0 10px, rgba(220,38,38,0.05) 10px 20px)' }} />
                                <div className="absolute top-5 left-1 right-1 z-10">
                                  <div className="text-center text-[11px] text-red-700 font-semibold bg-white/70 backdrop-blur-sm border border-red-200 rounded px-1 py-0.5">
                                    Fermé{closedInfo.reason ? ` — ${closedInfo.reason}` : ''}
                                  </div>
                                </div>
                              </>
                            )}
                            {/* Overlay des créneaux occupés (RPC) */}
                            {(() => {
                              const iso = format(d, 'yyyy-MM-dd');
                              const busy = busyByDate[iso] || [];
                              return busy.map((b, idx) => {
                                const top = Math.max(0, ((Math.max(b.startMin, startMin) - startMin) / stepMin) * slotPx);
                                const bottomBound = Math.min(b.endMin, endMin);
                                const h = Math.max(0, ((bottomBound - Math.max(b.startMin, startMin)) / stepMin) * slotPx);
                                if (h <= 0) return null;
                                return (
                                  <div key={`busy-${idx}`} className="absolute left-0 right-0 bg-red-200/20 border-y border-red-200/40 pointer-events-none" style={{ top: `${top}px`, height: `${h}px` }} />
                                );
                              });
                            })()}
                            {/* Événements */}
                             {laidByDay[di].map((e) => {
                              const top = Math.max(0, ((e.startMin - startMin) / stepMin) * slotPx);
                              const h = Math.max(slotPx, ((e.endMin - e.startMin) / stepMin) * slotPx);
                               const widthPct = 100 / e.lanes; const leftPct = e.lane * widthPct; const gapPx = 6;
                              const b = e.raw;
                              const color = (b.status !== 'cancelled' && isBookingFinished(b))
                                ? 'border-red-500 bg-red-50'
                                : (b.status === 'confirmed' ? 'border-green-500 bg-green-50' : b.status === 'pending' ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50');
                              return (
                                <div
                                  key={e.id}
                                  className={`absolute rounded border-l-2 shadow-sm p-1 text-[10px] sm:text-[11px] cursor-pointer hover:brightness-95 overflow-hidden ${color}`}
                                  style={{ top: `${top}px`, height: `${h}px`, left: `calc(${leftPct}% + ${e.lane > 0 ? gapPx/2 : 0}px)`, width: `calc(${widthPct}% - ${gapPx}px)` }}>
                                  <div className="font-medium whitespace-normal break-words leading-tight">{b.time} · {initials(b.clientFirstName, b.clientName)}</div>
                                  <div
                                    className="absolute inset-0"
                                    onClick={() => {
                                      // En vue semaine, ouvrir une petite pop-up de détails au lieu de la colonne droite
                                      setWeekPopupBooking(b);
                                    }}
                                    title="Voir le détail à droite"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : viewMode === 'month' ? (
              // Vue mensuelle simple
              <div ref={monthGridRef} className="grid grid-cols-2 sm:grid-cols-7 gap-px bg-harmonie-200">
                {(() => {
                  const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                  const start = new Date(first);
                  // Normaliser au lundi
                  const dow = (start.getDay() + 6) % 7; // 0=lundi
                  start.setDate(start.getDate() - dow);
                  const days: Date[] = [];
                  for (let i = 0; i < 42; i++) { // 6 semaines
                    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
                  }
                  return days.map((d, idx) => {
                    const inMonth = d.getMonth() === currentMonth.getMonth();
                    const isPast = isBefore(startOfDay(d), startOfDay(new Date()));
                    const dateStr = format(d, 'yyyy-MM-dd');
                    const dayBookings = (bookingsByDate[dateStr] || []);
                    const isToday = isSameDay(d, new Date());
                    const closedInfo = isDateClosedUI(d);
                    return (
                        <div key={idx} data-today={isToday ? 'true' : undefined} className={`relative min-h-[120px] p-2 ${closedInfo.closed ? 'bg-red-50' : 'bg-white'} ${!inMonth ? 'opacity-40' : ''} ${isPast ? 'opacity-60' : ''}`} onClick={() => setSelectedDate(dateStr)}>
                        <div className={`flex items-center justify-between mb-1 ${isToday ? 'text-harmonie-600 font-bold' : 'text-harmonie-700'}`}>
                          <span className="text-xs">{format(d, 'EEE', { locale: fr })}</span>
                          <span className={`text-sm ${isToday ? 'bg-harmonie-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{format(d, 'd')}</span>
                        </div>
                        {closedInfo.closed && (
                          <div className="absolute top-1 right-1 text-[10px] text-red-700 bg-white/80 border border-red-200 rounded px-1 py-[1px]">Fermé</div>
                        )}
                        <div className="space-y-1">
                          {dayBookings.slice(0,3).map((b) => (
                            <div key={b.id} className="text-[11px] p-1 rounded bg-harmonie-50 border border-harmonie-200 truncate">{b.time} · {initials(b.clientFirstName, b.clientName)} · {b.service} · {formatDuration(b.duration_minutes || 60)}</div>
                          ))}
                          {dayBookings.length > 3 && (
                            <div className="text-[11px] text-harmonie-500">+{dayBookings.length - 3} autres…</div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              // Vue jour avec repère toutes les 30 minutes
              (() => {
                const dayIso = selectedDate || format(new Date(), 'yyyy-MM-dd');
                const dayBookings = (bookingsByDate[dayIso] || []);
                const { start: startMin, end: endMin } = getDayRange();
                const stepMin = 30;
                const rows = Math.ceil((endMin - startMin) / stepMin);
                const slotPx = 28; // Hauteur fixe pour activer le scroll vertical si nécessaire
                const laid = layoutDayEvents(dayBookings.map(b => {
                  const sm = timeToMin(b.time) ?? startMin;
                  const emRaw = sm + (b.duration_minutes || 60);
                  const em = roundUpToStep(emRaw, stepMin); // étend visuellement au prochain palier de 30min
                  return { id: b.id, startMin: sm, endMin: em, raw: b };
                }));

                return (
                  <div ref={dayGridRef} className="grid grid-cols-[64px_1fr] gap-2 p-2 h-full">
                    {/* Colonne heures */}
                    <div className="text-[11px] text-harmonie-600 select-none">
                      {Array.from({ length: rows + 1 }).map((_, i) => {
                        const m = startMin + i*stepMin;
                        const hh = String(Math.floor(m/60)).padStart(2,'0');
                        const mm = String(m%60).padStart(2,'0');
                        return (
                          <div key={i} className="h-[28px] flex items-start justify-end pr-1">
                            <span>{hh}:{mm}</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Colonne planning jour */}
                    <div className="relative border border-harmonie-200 rounded bg-white overflow-hidden">
                      {/* Lignes de demi-heure */}
                      {Array.from({ length: rows + 1 }).map((_, i) => (
                        <div key={i} className={`absolute left-0 right-0 border-t ${i % 2 === 0 ? 'border-harmonie-200' : 'border-harmonie-100'}`} style={{ top: `${i*slotPx}px` }} />
                      ))}
                      <div style={{ height: `${rows*slotPx}px` }} />
                      {/* Fin visuelle de colonne (bordure + fade) */}
                      <div className="absolute left-0 right-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                      <div className="absolute left-0 right-0 bottom-0 border-t border-harmonie-300/70 pointer-events-none" />
                      {/* Ligne de l'heure actuelle (vue jour) */}
                      {(() => {
                        // Afficher le trait rouge uniquement si la date affichée est aujourd'hui
                        if (dayIso !== todayISO) return null;
                        const now = new Date();
                        const nowMin = now.getHours() * 60 + now.getMinutes();
                        if (nowMin < startMin || nowMin > endMin) return null;
                        const top = ((nowMin - startMin) / stepMin) * slotPx;
                        return (
                          <div
                            className="absolute left-0 right-0 z-20 h-[2px] bg-red-500/70"
                            style={{ top: `${top}px` }}
                          />
                        );
                      })()}
                      {/* Overlay pause déjeuner supprimée */}
                      {/* Overlay fermeture jour */}
                      {(() => { const info = isDateClosedUI(new Date(dayIso)); return info.closed ? (
                        <>
                          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(220,38,38,0.10) 0 10px, rgba(220,38,38,0.05) 10px 20px)' }} />
                          <div className="absolute top-4 left-0 right-0 text-center z-10">
                            <span className="inline-block text-xs text-red-700 font-semibold bg-white/80 border border-red-200 rounded px-2 py-1">Fermé{info.reason ? ` — ${info.reason}` : ''}</span>
                          </div>
                        </>
                      ) : null; })()}
                      {/* Overlay des créneaux occupés (RPC) */}
                      {(() => {
                        const busy = busyByDate[dayIso] || [];
                        return busy.map((b, idx) => {
                          const top = Math.max(0, ((Math.max(b.startMin, startMin) - startMin) / stepMin) * slotPx);
                          const bottomBound = Math.min(b.endMin, endMin);
                          const h = Math.max(0, ((bottomBound - Math.max(b.startMin, startMin)) / stepMin) * slotPx);
                          if (h <= 0) return null;
                          return (
                            <div key={`busy-day-${idx}`} className="absolute left-0 right-0 bg-red-200/20 border-y border-red-200/40 pointer-events-none" style={{ top: `${top}px`, height: `${h}px` }} />
                          );
                        });
                      })()}
                      {/* Bookings positionnés */}
                      {laid.map((e) => {
                        const top = Math.max(0, ((e.startMin - startMin) / stepMin) * slotPx);
                        const h = Math.max(slotPx, ((e.endMin - e.startMin) / stepMin) * slotPx);
                        const widthPct = 100 / e.lanes; const leftPct = e.lane * widthPct; const gapPx = 8;
                        const b = e.raw;
                        const color = (b.status !== 'cancelled' && isBookingFinished(b))
                          ? 'border-red-500 bg-red-50'
                          : (b.status === 'confirmed' ? 'border-green-500 bg-green-50' : b.status === 'pending' ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50');
                        const endLabel = minToHHmm(e.endMin);
                        return (
                          <div key={e.id} className={`absolute rounded border-l-2 shadow-sm p-2 text-xs cursor-pointer hover:brightness-95 ${color}`}
                               style={{ top: `${top}px`, height: `${h}px`, left: `calc(${leftPct}% + ${e.lane > 0 ? gapPx/2 : 0}px)`, width: `calc(${widthPct}% - ${gapPx}px)` }}>
                            <div className="font-medium">{b.time} – {endLabel} · {initials(b.clientFirstName, b.clientName)}</div>
                            <div className="truncate text-harmonie-700">{b.service} · {formatDuration(b.duration_minutes || 60)}</div>
                            <div
                              className="absolute inset-0"
                              onClick={() => {
                                // Sur mobile (<640px), ouvrir une popup de détails au lieu du panneau latéral
                                if (window.innerWidth < 640) {
                                  setWeekPopupBooking(b);
                                } else {
                                  setSelectedDate(dayIso);
                                  setFocusBookingId(b.id);
                                }
                              }}
                              title="Voir le détail"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* Détails du jour sélectionné (sauf en vue semaine) */}
          {selectedDate && viewMode !== 'week' && (
              <div className="hidden sm:block w-full sm:w-80 sm:min-w-[20rem] sm:max-w-[20rem] shrink-0 border-t sm:border-t-0 sm:border-l border-harmonie-200 bg-harmonie-50 overflow-y-auto">
              <div className="p-4 border-b border-harmonie-200 bg-white">
                <h5 className="font-semibold text-harmonie-800">
                  {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })}
                </h5>
              </div>
              
              <div className="p-4 space-y-4">
                {(bookingsByDate[selectedDate] || [])
                  .map((booking) => (
                    <div
                      key={booking.id}
                      ref={(el) => { bookingItemRefs.current[booking.id] = el; }}
                      className={`bg-white rounded-lg p-3 shadow-sm border ${highlightBookingId === booking.id ? 'border-harmonie-400 ring-2 ring-harmonie-200' : 'border-harmonie-200'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-harmonie-600" />
                          {(() => { const sm = timeToMin(booking.time) ?? 0; const endLabel = minToHHmm(roundUpToStep(sm + (booking.duration_minutes || 60), 30)); return (
                            <span className="font-medium text-harmonie-800">{booking.time} – {endLabel}</span>
                          ); })()}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingBooking(booking)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Modifier"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteBooking(booking.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-harmonie-600" />
                          <span>{booking.clientFirstName} {booking.clientName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-harmonie-600" />
                          <span>{booking.clientPhone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-harmonie-600" />
                          <span className="truncate">{booking.clientEmail}</span>
                        </div>
                        <div className="text-harmonie-700 font-medium">
                          {booking.service} · {formatDuration(booking.duration_minutes || 60)}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChipColor(booking)}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                          <select
                            aria-label="Modifier le statut du rendez-vous"
                            value={booking.status}
                            onChange={(e) => handleStatusChange(booking.id, e.target.value as 'confirmed' | 'pending' | 'cancelled')}
                            className="text-xs border border-harmonie-200 rounded px-2 py-1 bg-white text-harmonie-800"
                          >
                            <option value="confirmed">Confirmé</option>
                            <option value="pending">En attente</option>
                            <option value="cancelled">Annulé</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {(bookingsByDate[selectedDate] || []).length === 0 && (
                  <div className="text-center text-harmonie-500 py-8">
                    Aucun rendez-vous ce jour
                  </div>
                )}
              </div>

              {/* Barre d'action rapide: confirmer tous les rendez-vous "En attente" de la journée */}
              {(() => {
                const pendings = (bookingsByDate[selectedDate] || []).filter(b => b.status === 'pending').length;
                return pendings > 0 ? (
                  <div className="sticky bottom-0 p-3 bg-white border-t border-harmonie-200">
                    <button
                      onClick={confirmAllPending}
                      className="w-full bg-harmonie-600 text-white rounded-lg px-4 py-2 hover:bg-harmonie-700 transition-colors"
                      title="Confirmer tous les rendez-vous en attente de ce jour"
                    >
                      Confirmer tout ({pendings})
                    </button>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Pop-up de détails (semaine et jour sur mobile) */}
        {weekPopupBooking && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-3" onClick={() => setWeekPopupBooking(null)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-[81] w-full max-w-md bg-white rounded-xl shadow-2xl border border-harmonie-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-3 border-b border-harmonie-100">
                <div className="flex items-center gap-2 text-sm text-harmonie-700">
                  <Clock size={16} className="text-harmonie-600" />
                  {(() => { const sm = timeToMin(weekPopupBooking.time) ?? 0; const endLabel = minToHHmm(roundUpToStep(sm + (weekPopupBooking.duration_minutes || 60), 30)); return (
                    <span className="font-medium">{weekPopupBooking.time} – {endLabel}</span>
                  ); })()}
                </div>
                <button className="p-2 text-harmonie-400 hover:text-harmonie-600 hover:bg-harmonie-50 rounded-lg" aria-label="Fermer" onClick={() => setWeekPopupBooking(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-harmonie-600" />
                  <span>{weekPopupBooking.clientFirstName} {weekPopupBooking.clientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-harmonie-600" />
                  <span>{weekPopupBooking.clientPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-harmonie-600" />
                  <span className="truncate">{weekPopupBooking.clientEmail}</span>
                </div>
                <div className="text-harmonie-700 font-medium">{weekPopupBooking.service} · {formatDuration(weekPopupBooking.duration_minutes || 60)}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChipColor(weekPopupBooking)}`}>
                    {getStatusLabel(weekPopupBooking.status)}
                  </span>
                  <select
                    aria-label="Modifier le statut du rendez-vous"
                    value={weekPopupBooking.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as 'confirmed' | 'pending' | 'cancelled';
                      handleStatusChange(weekPopupBooking.id, newStatus);
                      setWeekPopupBooking({ ...weekPopupBooking, status: newStatus });
                    }}
                    className="text-xs border border-harmonie-200 rounded px-2 py-1 bg-white text-harmonie-800"
                  >
                    <option value="confirmed">Confirmé</option>
                    <option value="pending">En attente</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => { setEditingBooking(weekPopupBooking); setWeekPopupBooking(null); }}
                    className="px-3 py-1.5 text-sm border border-harmonie-200 rounded hover:bg-harmonie-50 text-harmonie-700 flex items-center gap-1"
                    title="Modifier"
                  >
                    <Edit size={14} /> Modifier
                  </button>
                  <button
                    onClick={() => { handleDeleteBooking(weekPopupBooking.id); setWeekPopupBooking(null); }}
                    className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded hover:bg-red-50 flex items-center gap-1"
                    title="Supprimer"
                  >
                    <Trash2 size={14} /> Supprimer
                  </button>
                  
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton d'action flottant (mobile) */}
        <button
          onClick={() => setShowAddModal(true)}
          aria-label="Nouveau rendez-vous"
          className="sm:hidden fixed right-4 bottom-20 z-[75] h-12 w-12 rounded-full bg-harmonie-600 text-white shadow-lg shadow-harmonie-600/30 flex items-center justify-center active:scale-95"
        >
          <Plus size={20} />
        </button>

        {/* Statistiques en bas */}
        <div className="border-t border-harmonie-200 p-3 sm:p-4 bg-harmonie-50">
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="font-bold text-harmonie-800">{bookingStats.confirmed}</div>
              <div className="text-harmonie-600">Confirmés</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-harmonie-800">{bookingStats.pending}</div>
              <div className="text-harmonie-600">En attente</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-harmonie-800">{bookingStats.total}</div>
              <div className="text-harmonie-600">Total</div>
            </div>
          </div>
        </div>
      </div>

      {(showAddModal || editingBooking) && (
        <Suspense fallback={<div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/10"><div className="bg-white px-4 py-2 rounded shadow">Chargement…</div></div>}>
          <BookingEditModal
            booking={editingBooking || undefined}
            selectedDate={selectedDate || undefined}
            onClose={() => {
              setShowAddModal(false);
              setEditingBooking(null);
            }}
            onSave={handleSaveBooking}
          />
        </Suspense>
      )}

      {showPromotions && (
        <Suspense fallback={<div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/10"><div className="bg-white px-4 py-2 rounded shadow">Chargement…</div></div>}>
          <AdminPromotions onClose={() => setShowPromotions(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default AdminPlanning;
