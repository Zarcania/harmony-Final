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
  duration_minutes: number; // Durée de la prestation en minutes
}

export interface BookingFormData {
  // Nom affiché du service (item)
  service: string;
  // Multi-sélection: identifiants des services (items) choisis
  serviceIds?: string[];
  // Compatibilité: ancien champ simple (sera ignoré si serviceIds est fourni)
  serviceId?: string;
  date: string;
  time: string;
  clientName: string;
  clientFirstName: string;
  clientPhone: string;
  clientEmail: string;
  status?: 'confirmed' | 'pending' | 'cancelled';
}

export interface BusinessBreak {
  id: string;
  start_date: string; // Format ISO: "2026-01-20"
  end_date: string;   // Format ISO: "2026-01-20"
  start_time?: string; // Format HH:MM: "12:00" ou undefined si journée complète
  end_time?: string;   // Format HH:MM: "14:00" ou undefined si journée complète
  reason?: string;
  created_at: string;
  created_by?: string;
}

export interface BreakFormData {
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
}