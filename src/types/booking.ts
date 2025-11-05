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