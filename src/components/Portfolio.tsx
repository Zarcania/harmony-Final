import React from 'react';
import { Camera, ExternalLink, CreditCard as Edit, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import AdminEditModal from './AdminEditModal';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface PortfolioProps {
  onNavigate: (page: string) => void;
}

const Portfolio: React.FC<PortfolioProps> = ({ onNavigate }) => {
  const { isAdmin, portfolioImages, updatePortfolioImage, addPortfolioImage, deletePortfolioImage } = useAdmin();
  const [editModal, setEditModal] = React.useState<{ type: string; data?: any } | null>(null);
  const { elementRef: titleRef, isVisible: titleVisible } = useScrollAnimation();

  const handleToggleHome = (id: string, currentStatus: boolean) => {
    const homeImages = portfolioImages.filter(img => img.showOnHome);
    
    if (!currentStatus && homeImages.length >= 6) {
      alert('Maximum 6 images peuvent être affichées sur la page d\'accueil');
      return;
    }
    
    updatePortfolioImage(id, { showOnHome: !currentStatus });
  };

  const handleSaveImage = (data: any) => {
    if (data.id) {
      updatePortfolioImage(data.id, data);
    } else {
      addPortfolioImage(data);
    }
  };

  return (
    <section id="portfolio" className="relative py-24 bg-gradient-to-b from-white via-harmonie-50/30 to-white overflow-hidden">
      {/* Éléments décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 -right-20 w-96 h-96 bg-harmonie-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 -left-20 w-96 h-96 bg-harmonie-300/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* En-tête moderne */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-harmonie-400 to-transparent"></div>
            <Camera className="w-5 h-5 text-harmonie-600" />
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-harmonie-400 to-transparent"></div>
          </div>

          <h2 ref={titleRef} className={`font-display text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 tracking-tight transition-all duration-[1200ms] ease-out ${
            titleVisible
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-[120px]'
          }`}>
            Portfolio
          </h2>
          <p className={`text-base md:text-lg text-gray-700 max-w-2xl mx-auto leading-snug transition-all duration-[1200ms] ease-out delay-300 ${
            titleVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}>
            Découvrez nos créations
          </p>

          {isAdmin && (
            <div className="mt-8">
              <button
                onClick={() => setEditModal({ type: 'portfolio' })}
                className="bg-harmonie-600 text-white px-6 py-3 rounded-full hover:bg-harmonie-700 transition-all duration-300 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Plus size={18} />
                Ajouter une image
              </button>
            </div>
          )}
        </div>

        {/* Galerie masonry moderne */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {portfolioImages.map((image, index) => (
            <div
              key={index}
              className={`group relative bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 ${
                isAdmin ? 'ring-2 ring-dashed ring-harmonie-300 hover:ring-harmonie-500' : ''
              }`}
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
              }}
            >
              <div className="aspect-[4/5] overflow-hidden relative">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />

                {/* Overlay élégant avec animation fluide */}
                {!isAdmin && (
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/95 via-neutral-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col justify-end p-8">
                    {/* Ligne décorative animée */}
                    <div className="w-0 h-0.5 bg-gradient-to-r from-harmonie-400 to-harmonie-600 mb-6 group-hover:w-16 transition-all duration-700 delay-200"></div>

                    <div className="transform translate-y-8 group-hover:translate-y-0 transition-transform duration-700 delay-100">
                      <h3 className="font-display text-2xl font-bold text-white mb-3 leading-tight">
                        {image.title}
                      </h3>
                      <p className="text-white/90 text-sm mb-4 leading-relaxed line-clamp-2">
                        {image.detailedDescription}
                      </p>

                      <div className="flex items-center gap-2 text-sm text-harmonie-300 font-medium">
                        <ExternalLink size={16} className="animate-pulse" />
                        <span>Découvrir</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Overlay admin */}
              {isAdmin && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditModal({ type: 'portfolio', data: image })}
                      className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleHome(image.id, image.showOnHome)}
                      className={`p-2 rounded-lg transition-colors ${
                        image.showOnHome 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                      title={image.showOnHome ? 'Retirer de l\'accueil' : 'Ajouter à l\'accueil'}
                    >
                      {image.showOnHome ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      onClick={() => deletePortfolioImage(image.id)}
                      className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Badge accueil */}
              {isAdmin && image.showOnHome && (
                <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                  Accueil
                </div>
              )}

              {/* Info card en bas - Design moderne */}
              <div className="p-3 md:p-4 bg-gradient-to-b from-white to-neutral-50/50">
                <h3 className="font-display text-sm md:text-base font-semibold text-neutral-900 mb-1 group-hover:text-harmonie-700 transition-colors duration-300 line-clamp-1">
                  {image.title}
                </h3>
                <p className="text-neutral-600 text-xs leading-snug line-clamp-2">
                  {image.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section moderne */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl md:rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl">
            {/* Pattern de fond */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '40px 40px'
              }}></div>
            </div>

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 mb-4">
                <Camera className="w-3 h-3 text-harmonie-300" />
                <span className="text-white/80 text-xs font-medium">Instagram</span>
              </div>

              <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
                Suivez nos créations
              </h3>
              <p className="text-white/70 text-sm md:text-base mb-6 max-w-xl mx-auto leading-snug">
                Retrouvez nos réalisations du jour sur Instagram
              </p>

              <a
                href="https://instagram.com/harmoniecils"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-neutral-900 px-6 py-3 rounded-full font-medium text-sm hover:bg-neutral-100 transition-all duration-300 hover:shadow-2xl hover:scale-105 shadow-lg"
              >
                <Camera size={18} />
                <span>Suivre sur Instagram</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      {editModal && (
        <AdminEditModal
          type={editModal.type as any}
          data={editModal.data}
          onSave={handleSaveImage}
          onClose={() => setEditModal(null)}
        />
      )}
    </section>
  );
};

export default Portfolio;