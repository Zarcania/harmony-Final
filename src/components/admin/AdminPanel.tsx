import React, { useState } from 'react';
import { Settings, Gift, Briefcase, Camera, User, Star, X } from 'lucide-react';
import PromotionEditor from './PromotionEditor';
import ServiceEditor from './ServiceEditor';
import PortfolioEditor from './PortfolioEditor';
import AboutEditor from './AboutEditor';
import ReviewEditor from './ReviewEditor';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeEditor, setActiveEditor] = useState<string | null>(null);

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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Panneau d'Administration</h2>
                <p className="text-white/80 text-sm">Gérez le contenu de votre site</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid md:grid-cols-2 gap-6">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveEditor(section.id)}
                  className="group p-6 bg-white border-2 border-gray-200 hover:border-blue-400 rounded-xl hover:shadow-lg transition-all duration-300 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className={`${section.color} text-white p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                      {section.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
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

            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Conseil</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
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
