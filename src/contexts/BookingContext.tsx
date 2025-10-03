import React, { createContext, useContext, useState } from 'react';
import { Booking, BookingFormData, TimeSlot } from '../types/booking';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '10:00',
      service: 'Extensions volume russe',
      clientName: 'Martin',
      clientFirstName: 'Sophie',
      clientPhone: '06 12 34 56 78',
      clientEmail: 'sophie.martin@email.com',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      time: '14:30',
      service: 'Épilation sourcils',
      clientName: 'Dubois',
      clientFirstName: 'Marie',
      clientPhone: '06 98 76 54 32',
      clientEmail: 'marie.dubois@email.com',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    }
  ]);

  // Créneaux disponibles par défaut
  const defaultTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const addBooking = (bookingData: BookingFormData) => {
    const newBooking: Booking = {
      id: Date.now().toString(),
      ...bookingData,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    setBookings(prev => [...prev, newBooking]);
  };

  const deleteBooking = (id: string) => {
    setBookings(prev => prev.filter(booking => booking.id !== id));
  };

  const updateBooking = (id: string, updates: Partial<Booking>) => {
    setBookings(prev => prev.map(booking => 
      booking.id === id ? { ...booking, ...updates } : booking
    ));
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