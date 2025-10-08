import React, { useState } from 'react';
import { X, Calendar, Clock, User, Phone, Mail, CheckCircle } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { BookingFormData } from '../types/booking';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BookingModalProps {
  onClose: () => void;
  preselectedService?: string | null;
}

const BookingModal: React.FC<BookingModalProps> = ({ onClose, preselectedService }) => {
  const { addBooking, getAvailableSlots } = useBooking();
  const [step, setStep] = useState(preselectedService ? 2 : 1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState<BookingFormData>({
    service: preselectedService || '',
    date: '',
    time: '',
    clientName: '',
    clientFirstName: '',
    clientPhone: '',
    clientEmail: ''
  });

  const services = [
    'Extensions volume russe',
    'Extensions cil à cil',
    'Extensions volume mixte',
    'Rehaussement de cils',
    'Épilation sourcils',
    'Épilation lèvre',
    'Teinture de cils'
  ];

  // Générer les 14 prochains jours (sauf dimanche)
  const getAvailableDates = () => {
    const dates = [];
    let currentDate = new Date();
    
    for (let i = 0; i < 20; i++) {
      const date = addDays(currentDate, i);
      // Exclure les dimanches (0 = dimanche)
      if (date.getDay() !== 0 && !isBefore(date, startOfDay(new Date()))) {
        dates.push(date);
      }
      if (dates.length >= 14) break;
    }
    
    return dates;
  };

  const handleSubmit = () => {
    addBooking(formData);
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const availableSlots = formData.date ? getAvailableSlots(formData.date) : [];

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h3 className="font-display text-2xl font-bold text-harmonie-800 mb-2">
            Réservation confirmée !
          </h3>
          <p className="text-harmonie-600 mb-4">
            Votre rendez-vous a été enregistré avec succès.
          </p>
          <div className="bg-harmonie-50 rounded-xl p-4 text-left">
            <p className="text-sm text-harmonie-700">
              <strong>Service :</strong> {formData.service}<br />
              <strong>Date :</strong> {format(new Date(formData.date), 'EEEE d MMMM yyyy', { locale: fr })}<br />
              <strong>Heure :</strong> {formData.time}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-harmonie-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-harmonie-100 text-harmonie-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <h3 className="font-display text-xl font-bold text-harmonie-800">
              Prendre rendez-vous
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-harmonie-400 hover:text-harmonie-600 hover:bg-harmonie-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-center p-4 bg-harmonie-50">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= stepNumber 
                  ? 'bg-harmonie-600 text-white' 
                  : 'bg-harmonie-200 text-harmonie-600'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div className={`w-12 h-1 mx-2 ${
                  step > stepNumber ? 'bg-harmonie-600' : 'bg-harmonie-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="p-6">
          {/* Étape 1: Service */}
          {step === 1 && (
            <div>
              <h4 className="font-semibold text-harmonie-800 mb-4 text-lg">
                Choisissez votre prestation
              </h4>
              {preselectedService && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Prestation sélectionnée :</strong> {preselectedService}
                  </p>
                </div>
              )}
              <div className="grid gap-3">
                {services.map((service) => (
                  <button
                    key={service}
                    onClick={() => setFormData({ ...formData, service })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.service === service
                        ? 'border-harmonie-500 bg-harmonie-50'
                        : 'border-harmonie-200 hover:border-harmonie-300'
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.service}
                  className="bg-harmonie-600 text-white px-6 py-3 rounded-lg hover:bg-harmonie-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Étape 2: Date et heure */}
          {step === 2 && (
            <div>
              <h4 className="font-semibold text-harmonie-800 mb-4 text-lg">
                Choisissez votre créneau
              </h4>
              {preselectedService && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Prestation :</strong> {formData.service}
                  </p>
                </div>
              )}
              
              {/* Sélection de date */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-harmonie-700 mb-3">
                  Date
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {getAvailableDates().map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => setFormData({ ...formData, date: format(date, 'yyyy-MM-dd'), time: '' })}
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        formData.date === format(date, 'yyyy-MM-dd')
                          ? 'border-harmonie-500 bg-harmonie-50'
                          : 'border-harmonie-200 hover:border-harmonie-300'
                      }`}
                    >
                      <div className="font-medium">
                        {format(date, 'EEE d', { locale: fr })}
                      </div>
                      <div className="text-xs text-harmonie-600">
                        {format(date, 'MMM', { locale: fr })}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sélection d'heure */}
              {formData.date && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-harmonie-700 mb-3">
                    Heure
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setFormData({ ...formData, time: slot.time })}
                        disabled={!slot.available}
                        className={`p-3 rounded-lg border text-sm transition-all ${
                          !slot.available
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : formData.time === slot.time
                            ? 'border-harmonie-500 bg-harmonie-50'
                            : 'border-harmonie-200 hover:border-harmonie-300'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="border border-harmonie-200 text-harmonie-600 px-6 py-3 rounded-lg hover:bg-harmonie-50 transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.date || !formData.time}
                  className="bg-harmonie-600 text-white px-6 py-3 rounded-lg hover:bg-harmonie-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Étape 3: Informations client */}
          {step === 3 && (
            <div>
              <h4 className="font-semibold text-harmonie-800 mb-4 text-lg">
                Vos coordonnées
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-harmonie-700 mb-2">
                    Nom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-harmonie-400" size={16} />
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-harmonie-700 mb-2">
                    Prénom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-harmonie-400" size={16} />
                    <input
                      type="text"
                      value={formData.clientFirstName}
                      onChange={(e) => setFormData({ ...formData, clientFirstName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                      placeholder="Votre prénom"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-harmonie-700 mb-2">
                    Téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-harmonie-400" size={16} />
                    <input
                      type="tel"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-harmonie-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-harmonie-400" size={16} />
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Récapitulatif */}
              <div className="bg-harmonie-50 rounded-xl p-4 mb-6">
                <h5 className="font-medium text-harmonie-800 mb-2">Récapitulatif</h5>
                <div className="text-sm text-harmonie-700 space-y-1">
                  <p><strong>Service :</strong> {formData.service}</p>
                  <p><strong>Date :</strong> {format(new Date(formData.date), 'EEEE d MMMM yyyy', { locale: fr })}</p>
                  <p><strong>Heure :</strong> {formData.time}</p>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="border border-harmonie-200 text-harmonie-600 px-6 py-3 rounded-lg hover:bg-harmonie-50 transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.clientName || !formData.clientFirstName || !formData.clientPhone || !formData.clientEmail}
                  className="bg-harmonie-600 text-white px-6 py-3 rounded-lg hover:bg-harmonie-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmer le rendez-vous
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;