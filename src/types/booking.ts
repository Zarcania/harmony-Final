export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface Booking {
  id: string;
  date: string;
  time: string;
  service: string;
  clientName: string;
  clientFirstName: string;
  clientPhone: string;
  clientEmail: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
}

export interface BookingFormData {
  service: string;
  date: string;
  time: string;
  clientName: string;
  clientFirstName: string;
  clientPhone: string;
  clientEmail: string;
}