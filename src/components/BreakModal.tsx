import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Clock, Coffee, AlertTriangle } from 'lucide-react';
import { BreakFormData } from '../types/booking';
import { format, parse, isAfter, isBefore, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BreakFormData) => Promise<void>;
  existingBookings?: Array<{ date: string; time: string; duration_minutes: number }>;
}

const BreakModal: React.FC<BreakModalProps> = ({ isOpen, onClose, onSave, existingBookings = [] }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableStartSlots, setAvailableStartSlots] = useState<string[]>([]);
  const [availableEndSlots, setAvailableEndSlots] = useState<string[]>([]);

  // Réinitialiser le formulaire à la fermeture
  useEffect(() => {
    if (!isOpen) {
      setStartDate('');
      setEndDate('');
      setStartTime('');
      setEndTime('');
      setReason('');
      setErrors({});
      setAvailableStartSlots([]);
      setAvailableEndSlots([]);
    }
  }, [isOpen]);

  // Génère tous les créneaux de 30min entre deux heures
  const generateTimeSlots = useCallback((startHour: string, endHour: string, step: number = 30): string[] => {
    const slots: string[] = [];
    const start = parse(startHour, 'HH:mm', new Date());
    const end = parse(endHour, 'HH:mm', new Date());
    
    let current = start;
    while (isBefore(current, end) || isSameDay(current, end)) {
      slots.push(format(current, 'HH:mm'));
      current = new Date(current.getTime() + step * 60000);
      
      // Protection contre boucle infinie
      if (isAfter(current, end)) break;
    }
    
    return slots;
  }, []);

  // Convertit HH:MM en minutes depuis minuit
  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  // Vérifie si un créneau chevauche un rendez-vous
  const isSlotOccupied = useCallback((date: string, time: string, duration: number = 30): boolean => {
    const slotStart = timeToMinutes(time);
    const slotEnd = slotStart + duration;

    return existingBookings.some(booking => {
      if (booking.date !== date) return false;
      
      const bookingStart = timeToMinutes(booking.time);
      const bookingEnd = bookingStart + (booking.duration_minutes || 60);
      
      // Vérifie le chevauchement
      return !(slotEnd <= bookingStart || slotStart >= bookingEnd);
    });
  }, [existingBookings]);

  // Charge les créneaux disponibles quand la date change
  useEffect(() => {
    if (!startDate) {
      setAvailableStartSlots([]);
      return;
    }

    // Générer tous les créneaux de 08:00 à 20:00 par pas de 30min
    const allSlots = generateTimeSlots('08:00', '20:00', 30);
    
    // Filtrer les créneaux occupés par des RDV
    const available = allSlots.filter(slot => !isSlotOccupied(startDate, slot, 30));
    
    setAvailableStartSlots(available);
  }, [startDate, generateTimeSlots, isSlotOccupied]);

  // Met à jour les créneaux de fin quand l'horaire de début change
  useEffect(() => {
    if (!startTime || availableStartSlots.length === 0) {
      setAvailableEndSlots([]);
      return;
    }

    const startMinutes = timeToMinutes(startTime);
    
    // Créneaux de fin = après horaire début + 30min minimum
    const filtered = availableStartSlots.filter(slot => {
      const slotMinutes = timeToMinutes(slot);
      return slotMinutes > startMinutes;
    });
    
    setAvailableEndSlots(filtered);
    
    // Réinitialiser l'horaire de fin si invalide
    if (endTime && timeToMinutes(endTime) <= startMinutes) {
      setEndTime('');
    }
  }, [startTime, availableStartSlots, endTime]);

  // Validation du formulaire
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!startDate) {
      newErrors.startDate = 'Date de début obligatoire';
    }

    if (!endDate) {
      newErrors.endDate = 'Date de fin obligatoire';
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isAfter(start, end)) {
        newErrors.endDate = 'La date de fin doit être >= à la date de début';
      }
    }

    if ((startTime && !endTime) || (!startTime && endTime)) {
      newErrors.time = 'Veuillez remplir les deux horaires ou aucun';
    }

    if (startTime && endTime && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      newErrors.endTime = 'L\'horaire de fin doit être après l\'horaire de début';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await onSave({
        start_date: startDate,
        end_date: endDate,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        reason: reason.trim() || undefined
      });
      onClose();
    } catch (error) {
      console.error('Error saving break:', error);
      // L'erreur est déjà gérée dans le contexte
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coffee className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Ajouter une pause</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date de début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date de début *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  // Auto-remplir la date de fin si vide
                  if (!endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                min={today}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            {/* Date de fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date de fin *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Info sur blocage journée complète */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Blocage de journée complète</p>
              <p>
                Si vous ne renseignez pas d'horaires, la journée sera bloquée entièrement{' '}
                <strong>uniquement s'il n'y a aucun rendez-vous client</strong>.
              </p>
            </div>
          </div>

          {/* Horaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Horaire de début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Horaire de début (optionnel)
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={!startDate || availableStartSlots.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Choisir un horaire --</option>
                {availableStartSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              {startDate && availableStartSlots.length === 0 && (
                <p className="mt-1 text-sm text-gray-500">Aucun créneau disponible (tous occupés)</p>
              )}
            </div>

            {/* Horaire de fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Horaire de fin (optionnel)
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!startTime || availableEndSlots.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Choisir un horaire --</option>
                {availableEndSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
              )}
            </div>
          </div>

          {errors.time && (
            <p className="text-sm text-red-600">{errors.time}</p>
          )}

          {/* Raison */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison (optionnel)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Pause déjeuner, Congés, Rendez-vous personnel..."
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              {reason.length}/100 caractères
            </p>
          </div>

          {/* Résumé */}
          {startDate && endDate && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Résumé de la pause</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>
                  📅 Du <strong>{format(new Date(startDate), 'dd MMMM yyyy', { locale: fr })}</strong>
                  {' '}au <strong>{format(new Date(endDate), 'dd MMMM yyyy', { locale: fr })}</strong>
                </li>
                <li>
                  ⏰ {startTime && endTime 
                    ? `De ${startTime} à ${endTime}`
                    : 'Journée(s) complète(s) (si aucun RDV client)'}
                </li>
                {reason && <li>📝 {reason}</li>}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !startDate || !endDate}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreakModal;
