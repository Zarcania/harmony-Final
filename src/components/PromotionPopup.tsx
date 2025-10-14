import React, { useEffect, useState } from 'react';
import { X, Gift, Sparkles } from 'lucide-react';

interface PromotionPopupProps {
  onClose: () => void;
  onNavigate: (page: string) => void;
}

const PromotionPopup: React.FC<PromotionPopupProps> = ({ onClose, onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleReservation = () => {
    onNavigate('contact');
    handleClose();
  };

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`bg-white rounded-3xl max-w-md w-full p-10 relative transform transition-all duration-300 shadow-2xl ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Effet d'accent subtil */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-harmonie-200/30 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-harmonie-200/30 to-transparent rounded-full blur-3xl"></div>
        </div>

        {/* Bouton de fermeture */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-all z-10"
        >
          <X size={20} />
        </button>

        {/* Contenu */}
        <div className="text-center relative z-10">
          {/* Icône */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black text-white rounded-full mb-6 shadow-lg">
            <Gift size={32} />
          </div>

          {/* Titre avec effet sparkles */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-harmonie-500" />
            <h3 className="font-display text-4xl font-bold text-black">
              Offre
            </h3>
            <Sparkles className="w-5 h-5 text-harmonie-500" />
          </div>

          {/* Description */}
          <div className="mb-8 leading-relaxed">
            <p className="font-accent font-bold text-2xl text-black mb-2">
              -20% sur votre première pose
            </p>
            <p className="text-gray-800 text-lg mb-4">
              d'extensions de cils volume russe !
            </p>
            <p className="text-sm text-gray-600 font-accent">
              Offre valable jusqu'à la fin du mois
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <button
              onClick={handleReservation}
              className="w-full bg-black text-white py-4 px-6 rounded-full font-accent font-semibold text-lg hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Réserver maintenant
            </button>
            <button
              onClick={handleClose}
              className="w-full text-gray-600 hover:text-black font-accent font-medium transition-colors text-sm"
            >
              Plus tard
            </button>
          </div>

          {/* Badge de validité */}
          <div className="mt-6 inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-accent">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Offre limitée dans le temps</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionPopup;