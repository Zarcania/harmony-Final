import React, { useMemo, useState } from 'react';
import { X, Calendar, Tag } from 'lucide-react';
import { Booking } from '../types/booking';
import { format } from 'date-fns';
import { useAdmin } from '../contexts/AdminContext';

interface BookingEditModalProps {
  booking?: Booking;
  selectedDate?: string;
  onClose: () => void;
  onSave: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
}

const BookingEditModal: React.FC<BookingEditModalProps> = ({ booking, selectedDate, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    date: booking?.date || selectedDate || format(new Date(), 'yyyy-MM-dd'),
    time: booking?.time || '09:00',
    service: booking?.service || '',
    clientFirstName: booking?.clientFirstName || '',
    clientName: booking?.clientName || '',
    clientPhone: booking?.clientPhone || '',
    clientEmail: booking?.clientEmail || '',
    status: (booking?.status || 'confirmed') as 'confirmed' | 'pending' | 'cancelled'
  });

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const { serviceSections } = useAdmin();
  type ServiceOption = { label: string; section: string };
  const serviceOptions: ServiceOption[] = useMemo(() => {
    const opts: ServiceOption[] = [];
    serviceSections.forEach(sec => {
      sec.items.forEach(it => opts.push({ label: it.label, section: sec.title }));
    });
    return opts;
  }, [serviceSections]);

  const grouped = useMemo(() => {
    const m = new Map<string, ServiceOption[]>();
    serviceOptions.forEach(o => {
      if (!m.has(o.section)) m.set(o.section, []);
      m.get(o.section)!.push(o);
    });
    return Array.from(m.entries());
  }, [serviceOptions]);

  const [showPicker, setShowPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.service || !formData.clientFirstName || !formData.clientName || !formData.clientPhone || !formData.clientEmail) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    onSave(formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectService = (label: string) => {
    setFormData(prev => ({ ...prev, service: label }));
    setShowPicker(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-harmonie-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-harmonie-600 text-white rounded-lg">
              <Calendar size={20} />
            </div>
            <h3 className="font-display text-xl font-bold text-harmonie-800">
              {booking ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer le modal"
            title="Fermer"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="booking-date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  id="booking-date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="booking-time" className="block text-sm font-medium text-gray-700 mb-2">
                  Heure *
                </label>
                <select
                  id="booking-time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                >
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline-block w-4 h-4 mr-1" />
                Prestation *
              </label>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                aria-label="Ouvrir la sélection de prestation"
              >
                {formData.service || 'Sélectionnez une prestation'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="client-first-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  id="client-first-name"
                  type="text"
                  name="clientFirstName"
                  value={formData.clientFirstName}
                  onChange={handleChange}
                  required
                  placeholder="Prénom du client"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="client-last-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  id="client-last-name"
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  required
                  placeholder="Nom du client"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="client-phone" className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <input
                id="client-phone"
                type="tel"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleChange}
                required
                placeholder="06 12 34 56 78"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="client-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                id="client-email"
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                required
                placeholder="client@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="booking-status" className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                id="booking-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
              >
                <option value="confirmed">Confirmé</option>
                <option value="pending">En attente</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-harmonie-600 text-white rounded-lg hover:bg-harmonie-700 transition-colors font-medium shadow-lg hover:shadow-xl"
            >
              {booking ? 'Enregistrer les modifications' : 'Créer le rendez-vous'}
            </button>
          </div>
        </form>
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-[80] bg-white sm:bg-white/95 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h4 className="font-semibold">Sélectionnez une prestation</h4>
            <button
              onClick={() => setShowPicker(false)}
              aria-label="Fermer la sélection"
              title="Fermer"
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {grouped.map(([section, options]) => (
              <div key={section} className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">{section}</div>
                <div className="grid gap-2">
                  {options.map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => selectService(opt.label)}
                      className={`p-3 rounded-xl border-2 text-left ${formData.service === opt.label ? 'border-harmonie-500 bg-harmonie-50' : 'border-harmonie-200 hover:border-harmonie-300'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingEditModal;
