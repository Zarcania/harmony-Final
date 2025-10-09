import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking, BookingFormData, TimeSlot } from '../types/booking';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

interface BookingContextType {
  bookings: Booking[];
  addBooking: (bookingData: BookingFormData) => void;
  deleteBooking: (id: string) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  getAvailableSlots: (date: string) => TimeSlot[];
  getBookingsForDate: (date: string) => Booking[];
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
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('preferred_date', { ascending: true })
        .order('preferred_time', { ascending: true });

      if (error) {
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
  };

  // Créneaux disponibles par défaut
  const defaultTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const addBooking = async (bookingData: BookingFormData) => {
    try {
      const { data, error } = await supabase
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
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

          const response = await fetch(`${supabaseUrl}/functions/v1/send-booking-confirmation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({ bookingId: data.id }),
          });

          if (!response.ok) {
            console.error('Failed to send confirmation email:', await response.text());
          }
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }
      }

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
      const updateData: any = {};

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

  const getAvailableSlots = (date: string): TimeSlot[] => {
    const dayBookings = bookings.filter(booking => 
      booking.date === date && booking.status !== 'cancelled'
    );
    
    return defaultTimeSlots.map(time => ({
      id: `${date}-${time}`,
      time,
      available: !dayBookings.some(booking => booking.time === time)
    }));
  };

  const getBookingsForDate = (date: string): Booking[] => {
    return bookings.filter(booking => booking.date === date);
  };

  return (
    <BookingContext.Provider value={{
      bookings,
      addBooking,
      deleteBooking,
      updateBooking,
      getAvailableSlots,
      getBookingsForDate
    }}>
      {children}
    </BookingContext.Provider>
  );
};