import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, Instagram, CheckCircle, Calendar } from 'lucide-react';
import BookingModal from './BookingModal';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface ContactProps {
  onNavigate: (page: string, service?: string) => void;
  preselectedService?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Contact: React.FC<ContactProps> = ({ onNavigate: _onNavigate, preselectedService }) => {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { elementRef: titleRef, isVisible: titleVisible } = useScrollAnimation();

  // Ouvrir le modal automatiquement si un service est présélectionné
  React.useEffect(() => {
    if (preselectedService) {
      setShowBookingModal(true);
    }
  }, [preselectedService]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ici vous pourriez intégrer votre logique d'envoi d'email
    console.log('Form data:', formData);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ nom: '', email: '', telephone: '', message: '' });
    }, 3000);
  };

  return (
    <section id="contact" className="relative py-20 bg-gradient-to-b from-white via-neutral-50 to-white">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-20">
          <h2 ref={titleRef} className={`font-display text-5xl md:text-6xl lg:text-7xl font-bold text-black mb-8 leading-tight transition-all duration-[1200ms] ease-out ${
            titleVisible
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-[120px]'
          }`}>
            Contact
          </h2>
          <p className={`text-xl md:text-2xl text-gray-900 max-w-3xl mx-auto font-medium leading-relaxed transition-all duration-[1200ms] ease-out delay-300 ${
            titleVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}>
            Prête à sublimer votre regard ? Prenez rendez-vous dès maintenant
          </p>
        </div>

        {/* Section Calendly */}
        <div className="mb-20">
          <div className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-[2rem] p-10 md:p-16 text-white text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden group">
            {/* Décorations d'arrière-plan */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>

            {/* Effet de lueur subtile */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-500">
                <Calendar size={32} />
              </div>
              <h3 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Réservez votre rendez-vous
              </h3>
              <p className="text-xl md:text-2xl mb-10 text-white/80 font-light max-w-2xl mx-auto leading-relaxed">
                Choisissez votre créneau directement dans notre agenda en ligne.
                Simple, rapide et disponible 24h/24 !
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="bg-white text-neutral-900 px-12 py-5 rounded-full font-semibold text-lg hover:bg-neutral-100 transition-all duration-300 hover:shadow-2xl hover:scale-105 shadow-lg inline-flex items-center gap-3"
                >
                  <Calendar size={20} />
                  Prendre rendez-vous
                </button>
                <div className="text-white/70 text-sm font-light">
                  <p>Réponse immédiate • Ajout facile à votre agenda</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Informations de contact */}
          <div className="space-y-6">
            <h3 className="font-display text-3xl font-bold text-neutral-900 mb-8">
              Autres moyens de contact
            </h3>

            <div className="space-y-4">
              <div className="group flex items-start gap-5 p-5 rounded-2xl hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 text-white rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Phone size={20} />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-neutral-900 rounded-full border-2 border-white"></div>
                </div>
                <div className="pt-1">
                  <h4 className="font-semibold text-neutral-900 mb-2 text-lg">Téléphone</h4>
                  <a
                    href="tel:0770166571"
                    className="text-neutral-700 hover:text-neutral-900 transition-colors font-medium"
                  >
                    07 70 16 65 71
                  </a>
                </div>
              </div>

              <div className="group flex items-start gap-5 p-5 rounded-2xl hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 text-white rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Mail size={20} />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-neutral-900 rounded-full border-2 border-white"></div>
                </div>
                <div className="pt-1">
                  <h4 className="font-semibold text-neutral-900 mb-2 text-lg">Email</h4>
                  <a
                    href="mailto:contact@harmoniecils.fr"
                    className="text-neutral-700 hover:text-neutral-900 transition-colors font-medium break-all"
                  >
                    contact@harmoniecils.fr
                  </a>
                </div>
              </div>

              <div className="group flex items-start gap-5 p-5 rounded-2xl hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 text-white rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <MapPin size={20} />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-neutral-900 rounded-full border-2 border-white"></div>
                </div>
                <div className="pt-1">
                  <h4 className="font-semibold text-neutral-900 mb-2 text-lg">Adresse</h4>
                  <p className="text-neutral-700 font-medium leading-relaxed">
                    1 Rue des Moissons<br />
                    45300 Sermaises
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-5 p-5 rounded-2xl hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 text-white rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Clock size={20} />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-neutral-900 rounded-full border-2 border-white"></div>
                </div>
                <div className="pt-1">
                  <h4 className="font-semibold text-neutral-900 mb-2 text-lg">Horaires</h4>
                  <div className="text-neutral-700 space-y-1 font-medium">
                    <p>Lun - Ven: 9h00 - 19h00</p>
                    <p>Samedi: 9h00 - 17h00</p>
                    <p>Dimanche: Fermé</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="pt-8 mt-8 border-t-2 border-neutral-200">
              <h4 className="font-semibold text-neutral-900 mb-4 text-lg">Suivez-nous</h4>
              <div className="flex gap-4">
                <a
                  href="https://instagram.com/harmoniecils"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 text-white rounded-xl hover:scale-110 hover:rotate-6 transition-all duration-300 shadow-lg"
                  aria-label="Ouvrir Instagram Harmonie Cils"
                  title="Instagram Harmonie Cils"
                >
                  <Instagram size={20} />
                </a>
              </div>
            </div>
          </div>

          {/* Formulaire de contact */}
          <div
            className="relative rounded-[2rem] p-8 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-neutral-200/60 overflow-hidden group bg-[url('/b0247cde-f948-4236-bab0-3128ea1eaf2e.jpg')] bg-cover bg-center"
          >
            {/* Overlay to mimic original white gradient */}
            <div className="absolute inset-0 bg-white/85"></div>
            {/* Décorations d'arrière-plan */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/20 rounded-full blur-3xl opacity-50"></div>
            <div className="relative z-10">
              <h3 className="font-display text-3xl font-bold text-neutral-900 mb-8">
                Demande d'information
              </h3>

              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                    <CheckCircle size={40} className="text-green-600" />
                  </div>
                  <h4 className="font-semibold text-neutral-900 mb-2 text-xl">Message envoyé !</h4>
                  <p className="text-neutral-700">
                    Nous vous recontacterons dans les plus brefs délais.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="nom" className="block text-sm font-semibold text-neutral-900 mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        id="nom"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all bg-white shadow-sm hover:border-neutral-300"
                        placeholder="Votre nom"
                      />
                    </div>
                    <div>
                      <label htmlFor="telephone" className="block text-sm font-semibold text-neutral-900 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        id="telephone"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all bg-white shadow-sm hover:border-neutral-300"
                        placeholder="Votre téléphone"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-neutral-900 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all bg-white shadow-sm hover:border-neutral-300"
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-neutral-900 mb-2">
                      Votre message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all resize-none bg-white shadow-sm hover:border-neutral-300"
                      placeholder="Posez-nous vos questions, demandez des informations sur nos prestations..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Send size={20} />
                    Envoyer le message
                  </button>

                  <p className="text-xs text-neutral-500 text-center font-medium">
                    * Champs obligatoires
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Note explicative */}
        <div className="mt-20 text-center">
          <div className="relative bg-white rounded-[2rem] p-8 md:p-10 max-w-4xl mx-auto shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-neutral-200/60 overflow-hidden">
            {/* Décoration d'arrière-plan */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-b from-neutral-100/50 to-transparent rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <h4 className="font-display text-2xl md:text-3xl font-bold text-neutral-900 mb-8">Comment ça marche ?</h4>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="group">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      1
                    </div>
                    <span className="text-neutral-700 font-medium text-base">Choisissez votre prestation</span>
                  </div>
                </div>
                <div className="group">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      2
                    </div>
                    <span className="text-neutral-700 font-medium text-base">Sélectionnez votre créneau</span>
                  </div>
                </div>
                <div className="group">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      3
                    </div>
                    <span className="text-neutral-700 font-medium text-base">Confirmez votre RDV</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de réservation */}
      {showBookingModal && (
        <BookingModal
          onClose={() => setShowBookingModal(false)}
          preselectedService={preselectedService || undefined}
        />
      )}
    </section>
  );
};

export default Contact;