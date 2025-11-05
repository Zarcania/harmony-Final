import React, { useState } from 'react';
import { Settings, Gift, Briefcase, Camera, User, Star, X } from 'lucide-react';
import PromotionEditor from './PromotionEditor';
import ServiceEditor from './ServiceEditor';
import PortfolioEditor from './PortfolioEditor';
import AboutEditor from './AboutEditor';
import ReviewEditor from './ReviewEditor';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeEditor, setActiveEditor] = useState<string | null>(null);
  // Empêcher le scroll de l'arrière-plan pendant que le panneau est ouvert
  useLockBodyScroll(true);

  const sections = [
    {
      id: 'promotions',
      title: 'Offres Exclusives',
      description: 'Gérer les promotions de la page d\'accueil',
      icon: <Gift className="w-6 h-6" />,
      color: 'bg-purple-500',
    },
    {
      id: 'services',
      title: 'Prestations',
      description: 'Gérer les services et leurs tarifs',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'bg-blue-500',
    },
    {
      id: 'portfolio',
      title: 'Portfolio',
      description: 'Gérer les images du portfolio',
      icon: <Camera className="w-6 h-6" />,
      color: 'bg-green-500',
    },
    {
      id: 'about',
      title: 'À propos',
      description: 'Gérer la section à propos',
      icon: <User className="w-6 h-6" />,
      color: 'bg-orange-500',
    },
    {
      id: 'reviews',
      title: 'Avis Clients',
      description: 'Gérer les avis et témoignages',
      icon: <Star className="w-6 h-6" />,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 pt-[env(safe-area-inset-top)]">
        <div className="bg-white w-full sm:max-w-4xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
          <div className="sticky top-0 z-10 px-4 sm:px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8" />
              <div>
                <h2 className="text-lg sm:text-2xl font-bold">Panneau d'Administration</h2>
                <p className="text-white/80 text-xs sm:text-sm">Gérez le contenu de votre site</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(92vh-120px)] sm:max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveEditor(section.id)}
                  className="group p-4 sm:p-6 bg-white border-2 border-gray-200 hover:border-blue-400 rounded-xl hover:shadow-lg transition-all duration-300 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className={`${section.color} text-white p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                      {section.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base sm:text-xl text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-2 transition-transform">
                    Gérer <span className="ml-1">→</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-2">Conseil</h3>
              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                Toutes les modifications sont sauvegardées en base de données et s'affichent immédiatement sur votre site.
                Assurez-vous de bien vérifier vos modifications avant de fermer les éditeurs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {activeEditor === 'promotions' && <PromotionEditor onClose={() => setActiveEditor(null)} />}
      {activeEditor === 'services' && <ServiceEditor onClose={() => setActiveEditor(null)} />}
      {activeEditor === 'portfolio' && <PortfolioEditor onClose={() => setActiveEditor(null)} />}
      {activeEditor === 'about' && <AboutEditor onClose={() => setActiveEditor(null)} />}
      {activeEditor === 'reviews' && <ReviewEditor onClose={() => setActiveEditor(null)} />}
    </>
  );
};

export default AdminPanel;
