/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Booking, BookingFormData } from '../types/booking';
import { supabase } from '../lib/supabase';
import { useHttp } from './HttpContext';

interface BookingContextType {
  bookings: Booking[];
  addBooking: (bookingData: BookingFormData) => void;
  deleteBooking: (id: string) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  getAvailableSlots: (date: string, serviceId?: string) => Promise<string[]>;
  getBookingsForDate: (date: string) => Booking[];
  isDateClosed: (date: Date) => boolean;
  filterSlotsBySchedule: (date: Date, slots: string[]) => string[];
  isLoadingSlots: boolean;
}

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
  const { setHttpError } = useHttp();
  type BusinessHour = { day_of_week: number; open_time: string | null; close_time: string | null; closed: boolean };
  type Closure = { id: number; start_date: string; end_date: string; reason?: string };
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [closures, setClosures] = useState<Closure[]>([]);

  // fetchBookings est défini plus bas via useCallback

  // Charger horaires & fermetures
  useEffect(() => {
    const loadSettings = async () => {
      // business_hours
      const { data: bh, error: bhErr, status: bhStatus } = await supabase
        .from('business_hours')
        .select('day_of_week, open_time, close_time, is_closed, closed')
        .order('day_of_week', { ascending: true });
      if (typeof bhStatus === 'number') {
        if (bhErr) console.warn('[API]', bhStatus, 'table:business_hours', bhErr);
        else console.info('[API]', bhStatus, 'table:business_hours');
      }
      if (bhErr) {
        console.error('Erreur chargement business_hours:', bhErr);
      }

      // compat: certains schémas utilisent is_closed vs closed
      const normalizedBH: BusinessHour[] = (bh || []).map((row: { day_of_week: number; open_time: string | null; close_time: string | null; is_closed?: boolean; closed?: boolean }) => ({
        day_of_week: row.day_of_week,
        open_time: row.open_time ? String(row.open_time).slice(0,5) : null,
        close_time: row.close_time ? String(row.close_time).slice(0,5) : null,
        closed: row.closed ?? row.is_closed ?? false,
      }));

      // closures
      const { data: cl, error: clErr, status: clStatus } = await supabase
        .from('closures')
        .select('id, start_date, end_date, reason')
        .order('start_date', { ascending: true });
      if (typeof clStatus === 'number') {
        if (clErr) console.warn('[API]', clStatus, 'table:closures', clErr);
        else console.info('[API]', clStatus, 'table:closures');
      }
      if (clErr) {
        console.error('Erreur chargement closures:', clErr);
      }

      setBusinessHours(normalizedBH);
      setClosures((cl as Closure[]) || []);
    };
    loadSettings();
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
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
        const formattedBookings: Booking[] = data.map(booking => ({
          id: booking.id,
          date: booking.preferred_date,
          time: booking.preferred_time,
          service: booking.service_name,
          clientName: booking.client_name,
          clientFirstName: booking.client_first_name || '',
          clientPhone: booking.client_phone,
          clientEmail: booking.client_email,
          status: booking.status as 'confirmed' | 'pending' | 'cancelled',
          createdAt: booking.created_at
        }));
        console.log('Formatted bookings:', formattedBookings);
        setBookings(formattedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }, [setHttpError]);

  useEffect(() => {
    fetchBookings();

    const channel = supabase
      .channel('bookings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookings]);

  // Créneaux disponibles par défaut
  const defaultTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const addBooking = async (bookingData: BookingFormData) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .insert([{
          client_name: bookingData.clientName,
          client_first_name: bookingData.clientFirstName,
          client_email: bookingData.clientEmail,
          client_phone: bookingData.clientPhone,
          service_name: bookingData.service,
          preferred_date: bookingData.date,
          preferred_time: bookingData.time,
          status: 'confirmed'
        }]);

      if (error) throw error;

      // Email sending disabled as requested; no confirmation email is sent.

      fetchBookings();
    } catch (error) {
      console.error('Error adding booking:', error);
      alert('Erreur lors de l\'ajout du rendez-vous');
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Erreur lors de la suppression du rendez-vous');
    }
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    try {
  const updateData: Record<string, string | undefined> = {};

      if (updates.clientName !== undefined) updateData.client_name = updates.clientName;
      if (updates.clientFirstName !== undefined) updateData.client_first_name = updates.clientFirstName;
      if (updates.clientEmail !== undefined) updateData.client_email = updates.clientEmail;
      if (updates.clientPhone !== undefined) updateData.client_phone = updates.clientPhone;
      if (updates.service !== undefined) updateData.service_name = updates.service;
      if (updates.date !== undefined) updateData.preferred_date = updates.date;
      if (updates.time !== undefined) updateData.preferred_time = updates.time;
      if (updates.status !== undefined) updateData.status = updates.status;

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Erreur lors de la mise à jour du rendez-vous');
    }
  };

  const logFetch = (url: string, status: number, body?: unknown) => {
    const prefix = '[API]';
    if (status >= 200 && status < 300) {
      console.info(prefix, status, url);
    } else {
      console.warn(prefix, status, url, body);
    }
  };

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

  // Appelle la vue/RPC côté Supabase si disponible, sinon fallback local sur les bookings existants
  const getAvailableSlots = async (date: string, serviceId?: string): Promise<string[]> => {
    try {
      setIsLoadingSlots(true);
  // Europe/Paris: ne proposer que le futur
  const nowStr = getParisNowHHmm();

      // Tentative RPC: public.get_available_slots(date text, service_id uuid?)
      // Cette RPC peut ne pas exister; on catche l'erreur pour fallback
      const rpcName = 'get_available_slots';
      const payload: Record<string, unknown> = { p_date: date };
      if (serviceId) payload.p_service_id = serviceId;

      // On utilise la table virtuelle RPC si dispo
      let slots: string[] | null = null;
      try {
        const { data, error, status } = await supabase.rpc(rpcName, payload as Record<string, unknown>);
        logFetch(`rpc:${rpcName}`,(status as number) ?? (error ? 500 : 200), error || data);
        if (error) throw error;
        if (Array.isArray(data)) {
          // data peut être une liste de { time: 'HH:mm' } ou directement ['HH:mm']
          const extracted = (data as unknown[]).map((d) => (typeof d === 'string' ? d : (d as { time?: string })?.time)).filter(Boolean) as string[];
          slots = extracted as string[];
        }
      } catch {
        // RPC indispo: fallback local avec bookings + business hours
        console.info('[Availability] RPC indisponible, fallback local');
      }

      if (!slots) {
        const availableBySchedule = filterSlotsBySchedule(new Date(date), defaultTimeSlots);
        // Retire les réservés
        const dayBookings = bookings.filter(b => b.date === date && b.status !== 'cancelled');
        slots = availableBySchedule.filter(t => !dayBookings.some(b => b.time === t));
      }

      // Filtrer le passé pour le jour courant (Europe/Paris)
      const onlyFuture = slots.filter(t => {
        if (date !== new Date().toISOString().slice(0,10)) return true;
        return t > nowStr;
      });

      // Trier
      return [...onlyFuture].sort((a,b) => (a < b ? -1 : a > b ? 1 : 0));
    } catch (err: unknown) {
      console.error('Erreur getAvailableSlots', err);
      const e = err as { status?: number; message?: string };
      if (e?.status && [401,403,404].includes(e.status)) {
        setHttpError({ status: e.status, message: e.message || 'Erreur de chargement des créneaux' });
      }
      return [];
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const getBookingsForDate = (date: string): Booking[] => {
    return bookings.filter(booking => booking.date === date);
  };

  const isDateClosed = (d: Date): boolean => {
    const iso = d.toISOString().slice(0, 10);
    if (closures.some(c => iso >= c.start_date && iso <= c.end_date)) return true;
    const bh = businessHours.find(b => b.day_of_week === d.getDay());
    return !bh || bh.closed;
  };

  const filterSlotsBySchedule = (d: Date, slots: string[]): string[] => {
    const bh = businessHours.find(b => b.day_of_week === d.getDay());
    if (!bh || bh.closed) return [];
    const { open_time, close_time } = bh;
    if (!open_time || !close_time) return [];
    return slots.filter(t => t >= open_time && t < close_time);
  };

  return (
    <BookingContext.Provider value={{
      bookings,
      addBooking,
      deleteBooking,
      updateBooking,
      getAvailableSlots,
      getBookingsForDate,
      isDateClosed,
      filterSlotsBySchedule,
      isLoadingSlots
    }}>
      {children}
    </BookingContext.Provider>
  );
};