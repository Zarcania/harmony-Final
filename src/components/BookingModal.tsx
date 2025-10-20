import React, { useState } from 'react';
import { X, Calendar, User, Phone, Mail, CheckCircle } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { BookingFormData } from '../types/booking';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAdmin } from '../contexts/AdminContext';
import { useToast } from '../contexts/ToastContext';

interface BookingModalProps {
  onClose: () => void;
  preselectedService?: string | null;
}

const BookingModal: React.FC<BookingModalProps> = ({ onClose, preselectedService }) => {
  const { addBooking, getAvailableSlots, isLoadingSlots } = useBooking();
  const { showToast } = useToast();
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

  // Prestations dynamiques depuis AdminContext (sections + items)
  const { serviceSections } = useAdmin();
  // UI: on affiche directement serviceSections groupées

  // Générer les 14 prochains jours (sauf dimanche)
  const getAvailableDates = () => {
    const dates = [];
  const currentDate = new Date();
    
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

  const handleSubmit = async () => {
    // Réservation sans connexion: insert anonyme autorisé par RLS
    try {
      await addBooking(formData);
      showToast('Rendez-vous enregistré.', 'success');
      setIsSubmitted(true);
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? 'Erreur lors de la réservation';
      showToast(msg, 'error');
    }
  };

  const [slots, setSlots] = useState<string[]>([]);
  React.useEffect(() => {
    let canceled = false;
    const run = async () => {
      if (!formData.date) { setSlots([]); return; }
      const out = await getAvailableSlots(formData.date, formData.serviceId);
      if (!canceled) setSlots(out);
    };
    run();
    return () => { canceled = true; };
  }, [formData.date, formData.serviceId, getAvailableSlots]);

  if (isSubmitted) {
    // Build calendar helpers
    const startDate = formData.date && formData.time ? new Date(`${formData.date}T${formData.time}:00`) : null;
    const endDate = startDate ? new Date(startDate.getTime() + 60 * 60 * 1000) : null; // default 1h duration
    const pad = (n: number) => n.toString().padStart(2, '0');
    const toGoogleDate = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const title = encodeURIComponent(`Rendez-vous - ${formData.service}`);
    const details = encodeURIComponent('Rendez-vous pris via Harmonie Cils');
    const location = encodeURIComponent('Harmonie Cils');
    const googleUrl = startDate && endDate
      ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${toGoogleDate(startDate)}/${toGoogleDate(endDate)}&details=${details}&location=${location}`
      : '';

    const icsContent = startDate && endDate ? [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Harmonie Cils//Booking//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${toGoogleDate(startDate).replace(/Z$/, '')}Z`,
      `DTEND:${toGoogleDate(endDate).replace(/Z$/, '')}Z`,
      `SUMMARY:Rendez-vous - ${formData.service}`,
      'DESCRIPTION:Rendez-vous pris via Harmonie Cils',
      'LOCATION:Harmonie Cils',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n') : '';

    const downloadIcs = () => {
      if (!icsContent) return;
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rendez-vous-harmonie-cils.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
        <div className="relative bg-white rounded-2xl max-w-md w-full p-6 md:p-8 text-center shadow-2xl my-auto">
          <button
            onClick={onClose}
            aria-label="Fermer"
            title="Fermer"
            className="absolute top-3 right-3 p-2 text-harmonie-400 hover:text-harmonie-600 hover:bg-harmonie-50 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
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
          {startDate && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {googleUrl && (
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 transition-colors"
                >
                  Ajouter à Google Agenda
                </a>
              )}
              <button
                onClick={downloadIcs}
                className="inline-flex items-center justify-center gap-2 border border-harmonie-200 text-harmonie-700 rounded-lg px-4 py-2 hover:bg-harmonie-50 transition-colors"
              >
                Télécharger fichier .ics
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="mt-5 w-full bg-harmonie-600 text-white rounded-lg px-4 py-2 hover:bg-harmonie-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl md:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-harmonie-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-harmonie-100 text-harmonie-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <h3 className="font-display text-lg md:text-xl font-bold text-harmonie-800">
              Prendre rendez-vous
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer le modal"
            title="Fermer"
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

        <div className="p-4 md:p-6">
          {/* Étape 1: Service */}
          {step === 1 && (
            <div>
              <h4 className="font-semibold text-harmonie-800 mb-4 text-base md:text-lg">
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
                {serviceSections.map((section) => (
                  <div key={section.id} className="border border-harmonie-200 rounded-xl overflow-hidden">
                    <div className="px-3 py-2 text-sm font-semibold text-harmonie-700 bg-harmonie-50">{section.title}</div>
                    <div className="p-2 grid gap-2">
                      {section.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setFormData({ ...formData, service: item.label, serviceId: item.id })}
                          className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${
                            formData.serviceId === item.id ? 'border-harmonie-500 bg-harmonie-50' : 'border-harmonie-200 hover:border-harmonie-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium text-harmonie-900">{item.label}</div>
                              <div className="text-xs text-harmonie-600">{item.duration || '—'}</div>
                              <div className="text-xs text-harmonie-600 mt-1">{item.description || '—'}</div>
                            </div>
                            <div className="font-semibold text-harmonie-900 whitespace-nowrap">{item.price}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.service}
                  className="bg-harmonie-600 text-white px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base rounded-lg hover:bg-harmonie-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Étape 2: Date et heure */}
          {step === 2 && (
            <div>
              <h4 className="font-semibold text-harmonie-800 mb-4 text-base md:text-lg">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {getAvailableDates().map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => setFormData({ ...formData, date: format(date, 'yyyy-MM-dd'), time: '' })}
                      className={`p-2 md:p-3 rounded-lg border text-xs md:text-sm transition-all ${
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
                  {isLoadingSlots ? (
                    <div className="text-sm text-harmonie-600">Chargement des créneaux…</div>
                  ) : slots.length === 0 ? (
                    <div className="text-sm text-harmonie-600">Aucun créneau</div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slots.map((t) => (
                        <button
                          key={t}
                          onClick={() => setFormData({ ...formData, time: t })}
                          className={`p-2 md:p-3 rounded-lg border text-xs md:text-sm transition-all ${
                            formData.time === t ? 'border-harmonie-500 bg-harmonie-50' : 'border-harmonie-200 hover:border-harmonie-300'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="border border-harmonie-200 text-harmonie-600 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base rounded-lg hover:bg-harmonie-50 transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.date || !formData.time}
                  className="bg-harmonie-600 text-white px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base rounded-lg hover:bg-harmonie-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Étape 3: Informations client */}
          {step === 3 && (
            <div>
              <h4 className="font-semibold text-harmonie-800 mb-4 text-base md:text-lg">
                Vos coordonnées
              </h4>
              
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
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
                      className="w-full pl-10 pr-4 py-2.5 md:py-3 text-sm md:text-base border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
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
                      className="w-full pl-10 pr-4 py-2.5 md:py-3 text-sm md:text-base border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
                      placeholder="Votre prénom"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
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
                      className="w-full pl-10 pr-4 py-2.5 md:py-3 text-sm md:text-base border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
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
                      className="w-full pl-10 pr-4 py-2.5 md:py-3 text-sm md:text-base border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
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
                  className="border border-harmonie-200 text-harmonie-600 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base rounded-lg hover:bg-harmonie-50 transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.clientName || !formData.clientFirstName || !formData.clientPhone || !formData.clientEmail}
                  className="bg-harmonie-600 text-white px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base rounded-lg hover:bg-harmonie-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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