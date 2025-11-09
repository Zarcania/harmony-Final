/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Booking, BookingFormData } from '../types/booking';
import { supabase } from '../lib/supabase';
import { invokeFunction, invokeRawFunction } from '../api/supa';
import { useToast } from './ToastContext';
import { useHttp } from './HttpContext';

interface BookingContextType {
  bookings: Booking[];
  addBooking: (bookingData: BookingFormData) => void;
  deleteBooking: (id: string) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  getAvailableSlots: (date: string, serviceId?: string | string[], durationOverrideMin?: number) => Promise<string[]>;
  checkSlotAvailable: (date: string, time: string, serviceId?: string | string[], durationOverrideMin?: number) => Promise<boolean>;
  getBookingsForDate: (date: string) => Booking[];
  isDateClosed: (date: Date) => boolean;
  filterSlotsBySchedule: (date: Date, slots: string[])  => string[];
  isLoadingSlots: boolean;
  refreshBookings: () => Promise<void>;
  // Exposé pour l'admin et les pages publiques
  businessHours: Array<{ day_of_week: number; open_time: string | null; close_time: string | null; closed: boolean }>;
  closures: Array<{ id: string; start_date: string; end_date: string; reason?: string }>;
  reloadSettings: () => Promise<void>;
}

const composeClientName = (first?: string, last?: string) => {
  const parts = [first, last]
    .map((value) => (value ?? '').trim())
    .filter((value) => value.length > 0);
  return parts.join(' ').trim();
};

const splitClientName = (full?: string | null) => {
  const trimmed = (full ?? '').trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }
  const segments = trimmed.split(/\s+/);
  if (segments.length === 1) {
    return { firstName: '', lastName: trimmed };
  }
  const [first, ...rest] = segments;
  return { firstName: first, lastName: rest.join(' ').trim() };
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { setHttpError } = useHttp();
  const { showToast } = useToast();
  type BusinessHour = {
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    closed: boolean;
  };
  type Closure = { id: string; start_date: string; end_date: string; reason?: string };
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [closures, setClosures] = useState<Closure[]>([]);
  const serviceDurationCache = useRef(new Map<string, number>());
  // Cache pour RPC get_booked_slots afin d'éviter les rafales et coalescer les requêtes
  const rpcSlotsCacheRef = useRef({
    map: new Map<string, { ts: number; rows: Array<{ preferred_time: string; duration_minutes?: number }> }>(),
    inflight: new Map<string, Promise<Array<{ preferred_time: string; duration_minutes?: number }>>>(),
  });
  // TTL réduit à 2s pour éviter les doubles réservations (balance entre fraîcheur et charge serveur)
  // La contrainte DB EXCLUDE sur ts protège en dernier recours
  const RPC_CACHE_TTL_MS = 2_000;

  // Helpers durée/prestations
  const parseDurationMinutes = (raw?: string | null): number => {
    if (!raw) return 60;
    const s = raw.toLowerCase().replace(/\s+/g, '');
    // Formats acceptés: "1h", "1h30", "90min", "45m"
    const m1 = s.match(/^(\d+)h(?:(\d{1,2}))?$/); // 1h, 1h30
    if (m1) {
      const h = parseInt(m1[1], 10);
      const mm = m1[2] ? parseInt(m1[2], 10) : 0;
      return h * 60 + mm;
    }
    const m2 = s.match(/^(\d+)(?:min|m)$/); // 90min, 45m
    if (m2) return parseInt(m2[1], 10);
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n > 0 ? n : 60;
  };

  const addMinutesToTime = (dateISO: string, timeHHmm: string, minutes: number): string => {
    const d = new Date(`${dateISO}T${timeHHmm}:00`);
    const d2 = new Date(d.getTime() + minutes * 60 * 1000);
    const hh = String(d2.getHours()).padStart(2, '0');
    const mm = String(d2.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // fetchBookings est défini plus bas via useCallback

  // Fonction factorisée pour charger heures/fermetures/pauses et l'exposer
  const reloadSettings = React.useCallback(async () => {
      // business_hours: tenter is_closed, basculer sur closed si 42703
      let normalizedBH: BusinessHour[] = [];
      try {
        const r1 = await supabase
          .from('business_hours')
          .select('day_of_week, open_time, close_time, is_closed')
          .order('day_of_week', { ascending: true });
        if (typeof r1.status === 'number') {
          if (r1.error) console.warn('[API]', r1.status, 'table:business_hours', r1.error);
          else console.info('[API]', r1.status, 'table:business_hours');
        }
        if (r1.error && r1.error.code === '42703') {
          // colonne is_closed absente: on retente avec closed
          const r2 = await supabase
            .from('business_hours')
            .select('day_of_week, open_time, close_time, closed')
            .order('day_of_week', { ascending: true });
          if (r2.error) throw r2.error;
          const bh2 = (r2.data as unknown) as Array<{ day_of_week: number; open_time: string | null; close_time: string | null; closed?: boolean }>;
          normalizedBH = (bh2 || []).map((row) => ({
            day_of_week: row.day_of_week,
            open_time: row.open_time ? String(row.open_time).slice(0, 5) : null,
            close_time: row.close_time ? String(row.close_time).slice(0, 5) : null,
            closed: row.closed ?? false,
          }));
        } else {
          if (r1.error) throw r1.error;
          const bh1 = r1.data as Array<{ day_of_week: number; open_time: string | null; close_time: string | null; is_closed?: boolean }>;
          normalizedBH = (bh1 || []).map((row) => ({
            day_of_week: row.day_of_week,
            open_time: row.open_time ? String(row.open_time).slice(0, 5) : null,
            close_time: row.close_time ? String(row.close_time).slice(0, 5) : null,
            closed: row.is_closed ?? false,
          }));
        }
      } catch (bhErr) {
        console.error('Erreur chargement business_hours:', bhErr);
      }

      // closures
      try {
        const r = await supabase
          .from('closures')
          .select('id, start_date, end_date, reason')
          .order('start_date', { ascending: true });
        if (typeof r.status === 'number') {
          if (r.error) console.warn('[API]', r.status, 'table:closures', r.error);
          else console.info('[API]', r.status, 'table:closures');
        }
        if (r.error) throw r.error;
      setClosures(((r.data as unknown) as Closure[]) || []);
      } catch (clErr) {
        console.error('Erreur chargement closures:', clErr);
      }

      setBusinessHours(normalizedBH);

      // Plus de chargement des pauses déjeuner: logique supprimée
  }, []);

  // Charger horaires & fermetures au montage
  useEffect(() => {
    // Déterminer l'état d'authentification au montage (évite des getUser répétés)
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        setIsAuthenticated(!!auth.user);
      } catch { /* ignore */ }
    })();

    reloadSettings();
  }, [reloadSettings]);

  // (abonnement auth déplacé plus bas)

  const fetchBookings = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        // Visiteur non connecté: ne pas interroger la table protégée par RLS
        return;
      }
      const { data, error, status } = await supabase
        .from('bookings')
        .select('*')
        .order('preferred_date', { ascending: true })
        .order('preferred_time', { ascending: true });
      if (typeof status === 'number') {
        if (error) console.warn('[API]', status, 'table:bookings', error);
        else console.info('[API]', status, 'table:bookings');
      }

      if (error) {
        const errObj = error as unknown as { status?: number; message?: string };
        const st = errObj.status;
        if (st && [401,403,404].includes(st)) {
          setHttpError({ status: st, message: errObj.message || 'Erreur de chargement des rendez-vous' });
        }
        console.error('Error fetching bookings:', error);
        return;
      }

      if (data) {
        console.log('Fetched bookings from DB:', data);
  const formattedBookings: Booking[] = data.map((booking) => {
          const { firstName, lastName } = splitClientName(booking.client_name);
          return {
            id: booking.id,
            date: booking.preferred_date,
            time: booking.preferred_time,
            service: booking.service_name,
            clientName: lastName || booking.client_name,
            clientFirstName: firstName,
            clientPhone: booking.client_phone,
            clientEmail: booking.client_email,
            status: booking.status as 'confirmed' | 'pending' | 'cancelled',
            createdAt: booking.created_at ?? '',
            duration_minutes: booking.duration_minutes ?? 60 // Fallback 60min si absent
          };
        });
        console.log('Formatted bookings:', formattedBookings);
        setBookings(formattedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }, [setHttpError, isAuthenticated]);

  // Abonnement aux changements d'auth une fois fetchBookings défini
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const authed = !!session?.user;
      setIsAuthenticated(authed);
      // Éviter un fetch protégé immédiatement après un sign-out (isAuthenticated encore à true dans la closure)
      if (authed) {
        fetchBookings();
      } else {
        // Nettoyer la liste pour les visiteurs et éviter l'appel interdit
        setBookings([]);
      }
    });
    return () => {
      try { sub.subscription?.unsubscribe(); } catch { /* ignore */ }
    };
  }, [fetchBookings]);

  const refreshBookings = useCallback(async () => {
    await fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchBookings();

    // S'abonner aux changements seulement pour les utilisateurs connectés
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      if (!isAuthenticated) return;
      channel = supabase
        .channel('bookings_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
          fetchBookings();
        })
        .subscribe();
    })();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchBookings, isAuthenticated]);

  // (Plus utilisé) Les créneaux sont désormais générés dynamiquement depuis business_hours

  const addBooking = useCallback(async (bookingData: BookingFormData) => {
    // Génère un id client pour pouvoir déclencher l'email de confirmation ensuite
    const bookingId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    // Durée (minutes) associée à la prestation sélectionnée
    const resolveDurationMinutes = async (): Promise<number> => {
      try {
        const ids = (bookingData.serviceIds && bookingData.serviceIds.length > 0)
          ? bookingData.serviceIds
          : (bookingData.serviceId ? [bookingData.serviceId] : []);
        if (ids.length) {
          const { data, error } = await supabase
            .from('service_items')
            .select('id,duration,duration_minutes')
            .in('id', ids as string[]);
          if (!error && Array.isArray(data) && data.length) {
            return (data as Array<{ duration?: string | null; duration_minutes?: number | null }>).
              reduce((acc, row) => acc + (typeof row.duration_minutes === 'number' && row.duration_minutes > 0
                ? row.duration_minutes
                : parseDurationMinutes(row?.duration ?? undefined)
              ), 0);
          }
        }
      } catch {
        /* ignore */
      }
      return 60;
    };
    const duration_minutes = await resolveDurationMinutes();

    const combinedName = composeClientName(bookingData.clientFirstName, bookingData.clientName)
      || bookingData.clientName
      || bookingData.clientFirstName;
    const clientNameForDb = (combinedName ?? '').trim() || bookingData.clientEmail || 'Client';

    const baseRow = {
      id: bookingId,
      client_name: clientNameForDb,
      client_email: bookingData.clientEmail,
      client_phone: bookingData.clientPhone,
      service_name: bookingData.service,
      preferred_date: bookingData.date,
      preferred_time: bookingData.time,
      duration_minutes,
      status: (bookingData.status ?? 'pending') as 'confirmed' | 'pending' | 'cancelled',
    }

    // Réservation publique autorisée: passe toujours par la Function Edge (aucune clé privée côté front)
  await supabase.auth.getUser();
    try {
      // Création via Edge Function (utilise la clé service côté serveur)
      // Inclure les identifiants de prestations pour permettre au backend de recalculer la durée et normaliser le service_name
      const ids = (bookingData.serviceIds && bookingData.serviceIds.length > 0)
        ? bookingData.serviceIds
        : (bookingData.serviceId ? [bookingData.serviceId] : []);
      const payload = {
        ...baseRow,
        service_id: ids[0] ?? null,
        service_ids: ids.length ? ids : null,
        service_name: baseRow.service_name,
      };
      // Utiliser l'invocateur RAW pour récupérer le corps JSON d'erreur (codes: day_closed, slot_in_break, slot_outside_hours)
      await invokeRawFunction('create-booking', payload, { timeoutMs: 8000 });
    } catch (error) {
      // Gestion dédiée pour conflits/chevauchements
      const pgCode = (error as unknown as { code?: string })?.code;
      const rawMsg = (error as { message?: string })?.message || '';
      if (pgCode === '23P01' || pgCode === '23505' || /bookings_no_overlap_excl|uniq_bookings_start_active|overlap/i.test(rawMsg)) {
        const friendly = 'Ce créneau n’est plus disponible pour la durée choisie. Merci de sélectionner un autre horaire.';
        showToast(friendly, 'error');
        // Surface une erreur spécifique pour l’UI admin
        throw Object.assign(new Error('SLOT_OVERLAP'), { code: 'SLOT_OVERLAP' });
      }
      // Mapping convivial des règles métier renvoyées par la Function Edge
  const httpStatus = (error as unknown as { status?: number })?.status;
  const details = (error as unknown as { details?: unknown })?.details as { error?: string; details?: string } | undefined;
      const code = details?.error || rawMsg;
      if (httpStatus === 409) {
        if (code === 'day_closed') {
          const msg = 'Impossible de réserver: le salon est fermé à cette date.';
          showToast(msg, 'error');
          throw Object.assign(new Error(msg), { code: 'SLOT_RULES' });
        }
        if (code === 'slot_outside_hours') {
          const msg = 'Cet horaire est en dehors des heures d’ouverture. Merci de choisir un autre créneau.';
          showToast(msg, 'error');
          throw Object.assign(new Error(msg), { code: 'SLOT_RULES' });
        }
        if (code === 'slot_in_break') {
          const msg = 'Cet horaire tombe pendant la pause. Merci de sélectionner un autre créneau.';
          showToast(msg, 'error');
          throw Object.assign(new Error(msg), { code: 'SLOT_RULES' });
        }
      }
      const st = (error as unknown as { status?: number }).status;
      if (st && [401,403,404].includes(st)) {
        const emsg = (error as { message?: string })?.message || 'Erreur lors de la réservation';
        setHttpError({ status: st, message: emsg });
      }
      const emsg = (error as { message?: string; code?: string })?.message ?? 'Erreur lors de la réservation';
      const anyCode = (error as { code?: string; status?: number })?.code || st;
      showToast(`Réservation échouée — ${emsg}${anyCode ? ` (code: ${anyCode})` : ''}`, 'error');
      throw error;
    }

    await fetchBookings();
  }, [fetchBookings, showToast, setHttpError]);

  const deleteBooking = useCallback(async (id: string) => {
    try {
      // Passage par une Edge Function (service role) pour contourner la RLS et valider le rôle admin côté serveur.
      await invokeFunction('delete-booking', { booking_id: id }, { timeoutMs: 8000 });
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      const msg = (error as { message?: string })?.message || 'Erreur lors de la suppression du rendez-vous';
      alert(msg);
    }
  }, [fetchBookings]);

  const updateBooking = useCallback(async (id: string, updates: Partial<Booking>) => {
    try {
  const updateData: Record<string, string | undefined> = {};

      if (updates.clientName !== undefined) updateData.client_name = updates.clientName;
      if (updates.clientEmail !== undefined) updateData.client_email = updates.clientEmail;
      if (updates.clientPhone !== undefined) updateData.client_phone = updates.clientPhone;
      if (updates.service !== undefined) updateData.service_name = updates.service;
      if (updates.date !== undefined) updateData.preferred_date = updates.date;
      if (updates.time !== undefined) updateData.preferred_time = updates.time;
      if (updates.status !== undefined) updateData.status = updates.status;

      if (updates.clientFirstName !== undefined || updates.clientName !== undefined) {
        const existing = bookings.find((b) => b.id === id);
        const combined = composeClientName(
          updates.clientFirstName ?? existing?.clientFirstName ?? '',
          updates.clientName ?? existing?.clientName ?? ''
        );
        if (combined) {
          updateData.client_name = combined;
        } else if (existing) {
          updateData.client_name = composeClientName(existing.clientFirstName, existing.clientName) || existing.clientName;
        }
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id);

      if (error) {
        const rawMsg = (error as { message?: string })?.message || '';
        const code = (error as unknown as { code?: string })?.code;
        if (code === '23P01' || code === '23505' || /bookings_no_overlap_excl|uniq_bookings_start_active|overlap/i.test(rawMsg)) {
          showToast('Ce créneau est déjà occupé pour la durée de ce rendez-vous.', 'error');
          throw Object.assign(new Error('SLOT_OVERLAP'), { code: 'SLOT_OVERLAP' });
        }
        throw error;
      }
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      if ((error as { code?: string }).code !== 'SLOT_OVERLAP') {
        showToast('Erreur lors de la mise à jour du rendez-vous', 'error');
      }
    }
  }, [fetchBookings, bookings, showToast]);

  // central logging in api/supa.ts

  const getParisNowHHmm = (): string => {
    try {
      const s = new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Europe/Paris',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date());
      const m = s.match(/(\d{2}).?(\d{2})/);
      if (m) return `${m[1]}:${m[2]}`;
      return s;
    } catch {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
  };
  const getParisTodayISO = (): string => {
    try {
      // Obtenir la date locale Europe/Paris au format AAAA-MM-JJ
      const now = new Date();
      const y = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', year: 'numeric' }).format(now);
      const m = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', month: '2-digit' }).format(now);
      const d = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit' }).format(now);
      const yy = String(y).padStart(4, '0');
      return `${yy}-${m}-${d}`;
    } catch {
      return new Date().toISOString().slice(0,10);
    }
  };

  // DB utilise 0 = lundi .. 6 = dimanche (isodow-1). JS getDay(): 0 = dimanche .. 6 = samedi
  // Convertit une date JS vers l'index DB (0=lundi)
  const getDbDow = (d: Date): number => (d.getDay() + 6) % 7;

  const isDateClosed = useCallback((d: Date): boolean => {
    const iso = d.toISOString().slice(0, 10);
    if (closures.some(c => iso >= c.start_date && iso <= c.end_date)) return true;
    // Si aucun horaire n'est chargé (RLS public par ex.), on considère le jour OUVERT pour ne pas bloquer la réservation en local
    if (!businessHours || businessHours.length === 0) return false;
    const bh = businessHours.find(b => b.day_of_week === getDbDow(d));
    // Si l'entrée du jour est absente, ne pas bloquer non plus
    if (!bh) return false;
    return !!bh.closed;
  }, [closures, businessHours]);

  // Génère les créneaux depuis business_hours + closures + bookings (pas de 30min)
  const getAvailableSlots = useCallback(async (date: string, _serviceId?: string | string[], durationOverrideMin?: number): Promise<string[]> => {
    try {
      setIsLoadingSlots(true);
      // Durée totale de la sélection (par défaut 60min)
      let selectedDurationMin = typeof durationOverrideMin === 'number' && durationOverrideMin > 0 ? durationOverrideMin : 60;
      if (_serviceId) {
  const ids: string[] = Array.isArray(_serviceId) ? _serviceId : [_serviceId];
        const cacheKey = ids.slice().sort().join(',');
        if (!durationOverrideMin && serviceDurationCache.current.has(cacheKey)) {
          selectedDurationMin = serviceDurationCache.current.get(cacheKey)!;
        } else {
          if (!durationOverrideMin) {
            try {
              const { data, error } = await supabase
                .from('service_items')
                .select('id,duration,duration_minutes')
                .in('id', ids as string[]);
              if (error) throw error;
              const sum = (data as Array<{ duration?: string | null; duration_minutes?: number | null }> | null)?.
                reduce((acc, row) => acc + (typeof row.duration_minutes === 'number' && row.duration_minutes > 0
                  ? row.duration_minutes
                  : parseDurationMinutes(row?.duration ?? undefined)
                ), 0) ?? 0;
              selectedDurationMin = sum > 0 ? sum : 60;
              serviceDurationCache.current.set(cacheKey, selectedDurationMin);
            } catch {
              selectedDurationMin = 60;
            }
          }
        }
      }
      // Europe/Paris: ne proposer que le futur
      const nowStr = getParisNowHHmm();

      // 1) Vérifie fermetures
      const dObj = new Date(date);
      if (isDateClosed(dObj)) return [];

      // 2) Tenter d'abord la RPC serveur get_available_slots pour récupérer une liste à jour (y compris aujourd'hui)
      const parisToday = getParisTodayISO();
      try {
        const { data, error } = await supabase.rpc('get_available_slots', {
          p_date: date,
          p_duration_minutes: selectedDurationMin,
          p_slot_step_minutes: 30,
          p_buffer_minutes: 0,
        });
        if (!error && Array.isArray(data) && data.length) {
          // Convertir slot_start -> HH:mm Europe/Paris, tri croissant et unique
          const rawList = (data as Array<{ slot_start: string | null }>).
            map((r) => {
              const s = r.slot_start ? new Date(r.slot_start) : null;
              if (!s) return null;
              try {
                const t = new Intl.DateTimeFormat('fr-FR', {
                  timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false
                }).format(s);
                const m = t.match(/(\d{2}).?(\d{2})/);
                return m ? `${m[1]}:${m[2]}` : t.slice(0,5);
              } catch {
                const hh = String(s.getHours()).padStart(2, '0');
                const mm = String(s.getMinutes()).padStart(2, '0');
                return `${hh}:${mm}`;
              }
            })
            .filter((v): v is string => !!v);
          let uniq = Array.from(new Set(rawList)).sort();

          // Filtrer le passé si c'est aujourd'hui (UX publique)
          if (date === parisToday && !isAuthenticated) {
            uniq = uniq.filter(t => t > nowStr);
          }

          if (uniq.length) {
            // La fonction SQL get_available_slots retourne déjà les créneaux filtrés
            // en tenant compte de la durée (p_duration_minutes) et des réservations existantes.
            // Pas besoin de re-filtrer côté client - on utilise directement les résultats.
            let filtered = uniq;
            const stepsNeeded = Math.max(1, Math.ceil(selectedDurationMin / 30));

            // 2) Renforcer côté public: retirer toute heure qui chevauche un créneau déjà réservé (RPC get_booked_slots)
            if (!isAuthenticated && filtered.length) {
              try {
                const key = `slots:${date}`;
                const nowMs = Date.now();
                const cached = rpcSlotsCacheRef.current.map.get(key);
                let rpcData: Array<{ preferred_time: string; duration_minutes?: number }> | null = null;
                if (cached && nowMs - cached.ts < RPC_CACHE_TTL_MS) {
                  rpcData = cached.rows;
                } else {
                  let p = rpcSlotsCacheRef.current.inflight.get(key);
                  if (!p) {
                    p = (async () => {
                      const { data: sdata } = await supabase.rpc('get_booked_slots', { p_date: date });
                      const rows: Array<{ preferred_time: string; duration_minutes?: number }> = [];
                      if (Array.isArray(sdata)) {
                        for (const it of sdata as unknown[]) {
                          // Supporte SETOF tstzrange: chaîne "[start,end)"
                          const rangeStr = typeof it === 'string' ? it
                            : (it && typeof it === 'object' && 'ts' in (it as Record<string, unknown>)
                                ? String((it as Record<string, unknown>).ts)
                                : undefined);
                          if (rangeStr) {
                            let inner = rangeStr.trim();
                            if (inner.startsWith('[') || inner.startsWith('(')) inner = inner.slice(1);
                            if (inner.endsWith(']') || inner.endsWith(')')) inner = inner.slice(0, -1);
                            const parts = inner.split(',');
                            if (parts.length >= 2) {
                              const start = new Date(parts[0].trim());
                              const end = new Date(parts[1].trim());
                              if (!isNaN(+start) && !isNaN(+end)) {
                                const hh = String(start.getHours()).padStart(2,'0');
                                const mm = String(start.getMinutes()).padStart(2,'0');
                                const mins = Math.max(30, Math.round((+end - +start) / 60000));
                                rows.push({ preferred_time: `${hh}:${mm}`, duration_minutes: mins });
                              }
                            }
                          }
                        }
                      }
                      rpcSlotsCacheRef.current.map.set(key, { ts: Date.now(), rows });
                      return rows;
                    })();
                    rpcSlotsCacheRef.current.inflight.set(key, p);
                  }
                  rpcData = await p;
                  rpcSlotsCacheRef.current.inflight.delete(key);
                }
                if (rpcData) {
                  const occupied = new Set<string>();
                  for (const r of rpcData) {
                    const start = String(r.preferred_time).slice(0,5);
                    const dmin = typeof r.duration_minutes === 'number' ? r.duration_minutes : 60;
                    const steps = Math.max(1, Math.ceil(dmin / 30));
                    for (let k = 0; k < steps; k++) occupied.add(addMinutesToTime(date, start, k * 30));
                  }
                  filtered = filtered.filter((t) => {
                    for (let k = 0; k < stepsNeeded; k++) {
                      const tt = addMinutesToTime(date, t, k * 30);
                      if (occupied.has(tt)) return false;
                    }
                    return true;
                  });
                }
              } catch {
                // si l'appel échoue, on garde 'filtered' tel quel
              }
            }

            if (filtered.length) return filtered;
          }
        }
      } catch {
        // ignore, on retombera sur la génération locale
      }

      // 3) Génération locale fallback (jour courant ou échec RPC):
      //    Récupère les créneaux d'ouverture du jour
      const dow = getDbDow(dObj);
      const bh = businessHours.find(b => b.day_of_week === dow);
      if (bh && bh.closed) return [];
      // Construire fenêtres
      const toWindows = () => {
        // Si pas d'horaires configurés (null), considérer jour fermé
        if (!bh?.open_time || !bh?.close_time) return [];
        const open = bh.open_time;
        const close = bh.close_time;
        if (!open || !close) return [];
        return [{ o: open, c: close }];
      };
      const windows = toWindows();
      if (!windows.length) return [];

      // Génère les créneaux par pas de 30min
      const buildSlots = (open: string, close: string, stepMin = 30) => {
        const [oh, om] = open.split(':').map(n => parseInt(n, 10));
        const [ch, cm] = close.split(':').map(n => parseInt(n, 10));
        const slots: string[] = [];
        let cur = new Date(`${date}T${String(oh).padStart(2,'0')}:${String(om).padStart(2,'0')}:00`);
        const end = new Date(`${date}T${String(ch).padStart(2,'0')}:${String(cm).padStart(2,'0')}:00`);
        while (cur < end) {
          const hh = String(cur.getHours()).padStart(2, '0');
          const mm = String(cur.getMinutes()).padStart(2, '0');
          slots.push(`${hh}:${mm}`);
          cur = new Date(cur.getTime() + stepMin * 60 * 1000);
        }
        return slots;
      };

  // Générer slots pour chaque fenêtre
  let slots: string[] = [];
  for (const w of windows) slots = slots.concat(buildSlots(w.o, w.c));

      // Suppression du filtrage par "pause": seules les fenêtres AM/PM ou unique sont prises en compte

  // Retire les créneaux déjà réservés (sauf annulés)
      //    - si admin connecté: on s'appuie sur l'état 'bookings'
      //    - sinon: on lit une vue publique 'public_booked_slots' (date, time, duration_minutes)
      let dayBookings = bookings.filter(b => b.date === date && b.status !== 'cancelled');
      try {
        if (!isAuthenticated) {
          // Essayer d'abord l'appel RPC sécurisé (security definer) pour contourner RLS, avec cache TTL + déduplication
          const key = `slots:${date}`;
          const now = Date.now();
          const cached = rpcSlotsCacheRef.current.map.get(key);
          let rpcData: Array<{ preferred_time: string; duration_minutes?: number }> | null = null;
          if (cached && now - cached.ts < RPC_CACHE_TTL_MS) {
            rpcData = cached.rows;
          } else {
            let p = rpcSlotsCacheRef.current.inflight.get(key);
            if (!p) {
              p = (async () => {
                const { data } = await supabase.rpc('get_booked_slots', { p_date: date });
                const rows: Array<{ preferred_time: string; duration_minutes?: number }> = [];
                if (Array.isArray(data)) {
                  for (const it of data as unknown[]) {
                    const rangeStr = typeof it === 'string' ? it
                      : (it && typeof it === 'object' && 'ts' in (it as Record<string, unknown>)
                          ? String((it as Record<string, unknown>).ts)
                          : undefined);
                    if (rangeStr) {
                      let inner = rangeStr.trim();
                      if (inner.startsWith('[') || inner.startsWith('(')) inner = inner.slice(1);
                      if (inner.endsWith(']') || inner.endsWith(')')) inner = inner.slice(0, -1);
                      const parts = inner.split(',');
                      if (parts.length >= 2) {
                        // FIX: Parser correctement les timestamps UTC et convertir en heure locale
                        const startStr = parts[0].trim();
                        const endStr = parts[1].trim();
                        
                        // Créer un Date object et forcer l'interprétation UTC
                        const start = new Date(startStr.includes('+') || startStr.includes('Z') ? startStr : startStr + 'Z');
                        const end = new Date(endStr.includes('+') || endStr.includes('Z') ? endStr : endStr + 'Z');
                        
                        if (!isNaN(+start) && !isNaN(+end)) {
                          // Utiliser toLocaleTimeString pour obtenir l'heure locale (Europe/Paris)
                          const hh = String(start.getHours()).padStart(2,'0');
                          const mm = String(start.getMinutes()).padStart(2,'0');
                          const mins = Math.max(30, Math.round((+end - +start) / 60000));
                          rows.push({ preferred_time: `${hh}:${mm}`, duration_minutes: mins });
                        }
                      }
                    }
                  }
                }
                rpcSlotsCacheRef.current.map.set(key, { ts: Date.now(), rows });
                return rows;
              })();
              rpcSlotsCacheRef.current.inflight.set(key, p);
            }
            rpcData = await p;
            rpcSlotsCacheRef.current.inflight.delete(key);
          }
          if (rpcData) {
            dayBookings = (rpcData as Array<{ preferred_time: string; duration_minutes?: number }>).map((r) => ({
              date,
              time: String(r.preferred_time).slice(0,5),
              service: '',
              status: 'confirmed' as const,
              clientFirstName: '',
              clientName: '',
              clientEmail: '',
              clientPhone: '',
              createdAt: '',
              id: `rpc-${date}-${String(r.preferred_time).slice(0,5)}`,
              duration_minutes: typeof r.duration_minutes === 'number' ? r.duration_minutes : 60,
            })) as unknown as Booking[] & Array<{ duration_minutes?: number }>;
          } else {
            // Fallback éventuel sur une vue publique si présente
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as unknown as { from: (t: any) => any }).from('booked_slots_public')
              .select('day, ts')
              .eq('day', date);
            if (!error && Array.isArray(data)) {
              const tmp: Booking[] = [] as unknown as Booking[];
              for (const row of data as Array<{ day: string; ts: string }>) {
                const rangeStr = String(row.ts);
                let inner = rangeStr.trim();
                if (inner.startsWith('[') || inner.startsWith('(')) inner = inner.slice(1);
                if (inner.endsWith(']') || inner.endsWith(')')) inner = inner.slice(0, -1);
                const parts = inner.split(',');
                if (parts.length >= 2) {
                  const start = new Date(parts[0].trim());
                  const end = new Date(parts[1].trim());
                  if (!isNaN(+start) && !isNaN(+end)) {
                    const hh = String(start.getHours()).padStart(2,'0');
                    const mm = String(start.getMinutes()).padStart(2,'0');
                    const mins = Math.max(30, Math.round((+end - +start) / 60000));
                    tmp.push({
                      id: `pb-${date}-${hh}:${mm}`,
                      date,
                      time: `${hh}:${mm}`,
                      service: '',
                      clientFirstName: '',
                      clientName: '',
                      clientEmail: '',
                      clientPhone: '',
                      status: 'confirmed',
                      createdAt: '',
                      duration_minutes: mins,
                    } as unknown as Booking);
                  }
                }
              }
              dayBookings = tmp as unknown as Booking[] & Array<{ duration_minutes?: number }>;
            }
          }
        }
      } catch {
        // vue absente ou RLS: on continue avec l'état admin (ou vide public)
      }

      // Essayer d'étendre le blocage selon la durée de chaque réservation existante
      // On construit un set des créneaux occupés (par pas de 30min)
      const occupied = new Set<string>();
      if (dayBookings.length) {
        try {
          const labels = Array.from(new Set(dayBookings.map(b => b.service).filter(Boolean)));
          const labelDur: Record<string, number> = {};
          if (labels.length) {
            const { data, error } = await supabase
              .from('service_items')
              .select('label,duration')
              .in('label', labels as string[]);
            if (!error && data) {
              for (const row of data as Array<{ label: string; duration?: string | null }>) {
                labelDur[row.label] = parseDurationMinutes(row.duration ?? undefined);
              }
            }
          }
          for (const b of dayBookings) {
            const dmin = (b as Booking & { duration_minutes?: number }).duration_minutes ?? labelDur[b.service] ?? 60;
            const steps = Math.max(1, Math.ceil(dmin / 30));
            for (let k = 0; k < steps; k++) {
              occupied.add(addMinutesToTime(date, b.time, k * 30));
            }
          }
        } catch {
          // En cas d'échec lecture service_items, fallback: n'occupe que l'heure de départ
          for (const b of dayBookings) occupied.add(b.time);
        }
      }
      // Retire les créneaux occupés
      slots = slots.filter(t => !occupied.has(t));

      // Filtrer le passé pour le jour courant (Europe/Paris)
      //    - Public: on ne montre que le futur
      //    - Admin authentifié: on laisse aussi les créneaux passés (édition/ajout rétroactif)
      const onlyFuture = (() => {
        if (isAuthenticated) return slots;
        return slots.filter(t => {
          if (date !== new Date().toISOString().slice(0,10)) return true;
          return t > nowStr;
        });
      })();

      // 6) Si une prestation est sélectionnée, ne garder que les heures de départ
      // qui disposent de suffisamment de créneaux consécutifs pour couvrir la durée
        const result = (() => {
        if (!selectedDurationMin) return onlyFuture;
        const stepsNeeded = Math.max(1, Math.ceil(selectedDurationMin / 30));
        const setFuture = new Set(onlyFuture);
        return onlyFuture.filter((t) => {
          // Si deux fenêtres existent, garantir que tous les pas restent dans au moins une fenêtre
          if (windows.length >= 1) {
            const inWindow = (tt: string) => windows.some(w => tt >= w.o && tt < w.c);
            for (let k = 0; k < stepsNeeded; k++) {
              const tt = addMinutesToTime(date, t, k * 30);
              if (!inWindow(tt)) return false;
            }
          }
          for (let k = 0; k < stepsNeeded; k++) {
            const tt = addMinutesToTime(date, t, k * 30);
            if (!setFuture.has(tt)) return false;
          }
          return true;
        });
      })();

      // Retourne trié (sans fallback dangereux - retourne vide si aucun slot disponible)
      const sorted = [...result].sort((a,b) => (a < b ? -1 : a > b ? 1 : 0));
      
      // IMPORTANT: Fallback 3 (09:00-18:00) supprimé pour éviter les doubles réservations
      // Si sorted est vide, cela signifie qu'aucun créneau n'est disponible pour cette date/durée
      // L'utilisateur verra un message approprié dans l'UI au lieu de créneaux potentiellement invalides
      
      return sorted;
    } catch (err: unknown) {
      console.error('Erreur getAvailableSlots', err);
      const e = err as { status?: number; message?: string };
      if (e?.status && [401,403,404].includes(e.status)) {
        setHttpError({ status: e.status, message: e.message || 'Erreur de chargement des créneaux' });
      }
      // Message simple
      showToast(`Erreur créneaux — ${(e?.message) ?? 'inconnue'}` , 'error');
      return [];
    } finally {
      setIsLoadingSlots(false);
    }
  }, [serviceDurationCache, setHttpError, showToast, bookings, isAuthenticated, businessHours, isDateClosed]);

  // Vérifie seulement un créneau précis via RPC publique (ou état local si admin)
  const checkSlotAvailable = useCallback(async (date: string, time: string, _serviceId?: string | string[], durationOverrideMin?: number): Promise<boolean> => {
    try {
      // Durée requise pour la prestation
      let selectedDurationMin = typeof durationOverrideMin === 'number' && durationOverrideMin > 0 ? durationOverrideMin : 60;
      if (_serviceId) {
        if (!durationOverrideMin) {
          try {
            const ids: string[] = Array.isArray(_serviceId) ? _serviceId : [_serviceId];
            const { data, error } = await supabase
              .from('service_items')
              .select('id,duration,duration_minutes')
              .in('id', ids as string[]);
            if (!error && Array.isArray(data)) {
              selectedDurationMin = (data as Array<{ duration?: string | null; duration_minutes?: number | null }>).
                reduce((acc, row) => acc + (typeof row.duration_minutes === 'number' && row.duration_minutes > 0
                  ? row.duration_minutes
                  : parseDurationMinutes(row?.duration ?? undefined)
                ), 0);
            }
          } catch { /* ignore */ }
        }
      }

      const stepsNeeded = Math.max(1, Math.ceil(selectedDurationMin / 30));
      const tset = new Set<string>();

      // 1) Tentative rapide côté serveur: vérifier si l'heure demandée figure parmi les slots disponibles RPC
      try {
        const { data, error } = await supabase.rpc('get_available_slots', {
          p_date: date,
          p_duration_minutes: selectedDurationMin,
          p_slot_step_minutes: 30,
          p_buffer_minutes: 0,
        });
        if (!error && Array.isArray(data)) {
          const rawList = (data as Array<{ slot_start: string | null }>).
            map((r) => r.slot_start ? new Date(r.slot_start) : null)
            .filter((d): d is Date => !!d);
          const listHHmm = rawList.map((s) => {
            try {
              const t = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }).format(s);
              const m = t.match(/(\d{2}).?(\d{2})/); return m ? `${m[1]}:${m[2]}` : t.slice(0,5);
            } catch { const hh = String(s.getHours()).padStart(2,'0'); const mm = String(s.getMinutes()).padStart(2,'0'); return `${hh}:${mm}`; }
          });
          const set = new Set(listHHmm);
          if (set.has(time)) {
            // Optionnel: filtrer le passé si aujourd'hui côté public
            const todayIso = getParisTodayISO();
            if (date === todayIso) {
              const nowStr = getParisNowHHmm();
              if (!isAuthenticated && time <= nowStr) return false;
            }
            return true;
          }
          return false; // non proposé par la RPC
        }
      } catch { /* ignore et fallback local */ }

      // Suppression du blocage spécifique par "pause"

      // Si admin, on peut utiliser l'état local; sinon RPC publique
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const day = bookings.filter(b => b.date === date && b.status !== 'cancelled');
        for (const b of day) {
          // Durée connue côté admin ? on tente via service label
          const dmin = 60; // simplifié; l’exclusion côté DB reste la source de vérité
          const steps = Math.max(1, Math.ceil(dmin / 30));
          for (let k = 0; k < steps; k++) tset.add(addMinutesToTime(date, b.time, k * 30));
        }
      } else {
        // IMPORTANT: Bypass du cache pour vérification finale avant soumission
        // On force un appel RPC frais pour éviter les doubles réservations
        const key = `slots:${date}`;
        let rpcData: Array<{ preferred_time: string; duration_minutes?: number }> | null = null;
        
        // Ne pas utiliser le cache, toujours faire un appel frais
        {
          let p = rpcSlotsCacheRef.current.inflight.get(key);
          if (!p) {
            p = (async () => {
              const { data } = await supabase.rpc('get_booked_slots', { p_date: date });
              const rows: Array<{ preferred_time: string; duration_minutes?: number }> = [];
              if (Array.isArray(data)) {
                for (const it of data as unknown[]) {
                  const rangeStr = typeof it === 'string' ? it
                    : (it && typeof it === 'object' && 'ts' in (it as Record<string, unknown>)
                        ? String((it as Record<string, unknown>).ts)
                        : undefined);
                  if (rangeStr) {
                    let inner = rangeStr.trim();
                    if (inner.startsWith('[') || inner.startsWith('(')) inner = inner.slice(1);
                    if (inner.endsWith(']') || inner.endsWith(')')) inner = inner.slice(0, -1);
                    const parts = inner.split(',');
                    if (parts.length >= 2) {
                      const start = new Date(parts[0].trim());
                      const end = new Date(parts[1].trim());
                      if (!isNaN(+start) && !isNaN(+end)) {
                        const hh = String(start.getHours()).padStart(2,'0');
                        const mm = String(start.getMinutes()).padStart(2,'0');
                        const mins = Math.max(30, Math.round((+end - +start) / 60000));
                        rows.push({ preferred_time: `${hh}:${mm}`, duration_minutes: mins });
                      }
                    }
                  }
                }
              }
              // Ne pas mettre en cache pour checkSlotAvailable - toujours frais
              return rows;
            })();
          }
          rpcData = await p;
        }
        if (rpcData) {
          for (const r of rpcData as Array<{ preferred_time: string; duration_minutes?: number }>) {
            const start = String(r.preferred_time).slice(0,5);
            const dmin = typeof r.duration_minutes === 'number' ? r.duration_minutes : 60;
            const steps = Math.max(1, Math.ceil(dmin / 30));
            for (let k = 0; k < steps; k++) tset.add(addMinutesToTime(date, start, k * 30));
          }
        }
      }

      // Enforce que tous les pas requis restent dans une fenêtre horaire valide
      try {
        const d = new Date(date);
        const dow = getDbDow(d);
        const bh = businessHours.find(b => b.day_of_week === dow);
        if (bh && !bh.closed) {
          const wins: Array<{ o: string; c: string }> = [];
          if (bh.open_time && bh.close_time && bh.open_time < bh.close_time) {
            wins.push({ o: bh.open_time, c: bh.close_time });
          }
          if (wins.length > 0) {
            const inWindow = (tt: string) => wins.some(w => tt >= w.o && tt < w.c);
            for (let k = 0; k < stepsNeeded; k++) {
              const tt = addMinutesToTime(date, time, k * 30);
              if (!inWindow(tt)) return false;
            }
          }
        }
      } catch { /* ignore, on laisse la DB trancher */ }

      // Vérifie la disponibilité de tous les pas nécessaires (conflits & pause via tset)
      for (let k = 0; k < stepsNeeded; k++) {
        const tt = addMinutesToTime(date, time, k * 30);
        if (tset.has(tt)) return false;
      }
      return true;
    } catch (e) {
      console.warn('checkSlotAvailable fallback to optimistic allow', e);
      // En cas de doute, on laisse passer; la contrainte DB protègera à l’insert
      return true;
    }
  }, [bookings, businessHours, isAuthenticated]);

  const getBookingsForDate = useCallback((date: string): Booking[] => {
    return bookings.filter(booking => booking.date === date);
  }, [bookings]);

  

  const filterSlotsBySchedule = useCallback((d: Date, slots: string[]): string[] => {
    const bh = businessHours.find(b => b.day_of_week === getDbDow(d));
    if (!bh) return slots;
    if (bh.closed) return [];
    if (!bh.open_time || !bh.close_time) return [];
    return slots.filter(t => t >= bh.open_time! && t < bh.close_time!);
  }, [businessHours]);

  const contextValue = useMemo(() => ({
    bookings,
    addBooking,
    deleteBooking,
    updateBooking,
    getAvailableSlots,
    checkSlotAvailable,
    getBookingsForDate,
    isDateClosed,
    filterSlotsBySchedule,
    isLoadingSlots,
    refreshBookings,
    businessHours,
    closures,
    reloadSettings
  }), [
    bookings,
    addBooking,
    deleteBooking,
    updateBooking,
    getAvailableSlots,
    checkSlotAvailable,
    getBookingsForDate,
    isDateClosed,
    filterSlotsBySchedule,
    isLoadingSlots,
    refreshBookings,
    businessHours,
    closures,
    reloadSettings
  ]);

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};