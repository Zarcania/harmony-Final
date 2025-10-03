import React from 'react';
import { ArrowRight, Eye } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface PortfolioPreviewProps {
  onNavigate: (page: string) => void;
}

const PortfolioPreview: React.FC<PortfolioPreviewProps> = ({ onNavigate }) => {
  const { portfolioImages } = useAdmin();
  const { elementRef: titleRef, isVisible: titleVisible } = useScrollAnimation();

  // Filtrer pour n'afficher que les images marquées pour l'accueil (max 6)
  const homeImages = portfolioImages.filter(img => img.showOnHome).slice(0, 6);

  return (
    <section className="relative py-12 md:py-16 lg:py-20 bg-gradient-to-br from-white via-harmonie-50/30 to-harmonie-100/20 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-12 md:mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 bg-harmonie-100/60 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-harmonie-200/50">
            <Eye className="w-5 h-5 text-harmonie-600" />
            <span className="text-harmonie-700 font-accent font-medium">Nos réalisations</span>
          </div>
          
          <h2 ref={titleRef} className={`font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 md:mb-6 leading-tight transition-all duration-[1200ms] ease-out ${
            titleVisible
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-[120px]'
          }`}>
            Portfolio
            <span className={`block text-transparent bg-gradient-to-r from-harmonie-600 via-harmonie-700 to-harmonie-800 bg-clip-text transition-all duration-[1200ms] ease-out delay-200 ${
              titleVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-[120px]'
            }`}>
              de nos créations
            </span>
          </h2>
          <p className={`text-lg sm:text-xl md:text-2xl text-gray-900 max-w-3xl mx-auto font-medium leading-relaxed px-4 transition-all duration-[1200ms] ease-out delay-300 ${
            titleVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}>
            Découvrez quelques-unes de nos plus belles réalisations
          </p>
        </div>

        {/* Galerie en grille simple */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {homeImages.map((image, index) => (
            <div 
              key={index}
              className="group cursor-pointer transition-all duration-500 hover:scale-105"
            >
              <div className="relative bg-white rounded-3xl p-4 shadow-xl hover:shadow-2xl transition-all duration-500">
                <div className="aspect-[4/5] overflow-hidden rounded-2xl relative">
                  <img 
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Overlay avec informations */}
                  <div className="absolute inset-0 bg-gradient-to-t from-harmonie-900/90 via-harmonie-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl flex items-end p-6">
                    <div className="text-white">
                      <h3 className="font-display text-xl font-bold mb-2">
                        {image.title}
                      </h3>
                      <p className="text-harmonie-100 text-sm leading-relaxed mb-3">
                        {image.detailedDescription}
                      </p>
                      <span className="text-xs text-harmonie-200 bg-harmonie-800/50 px-2 py-1 rounded-full">
                        Voir détails
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Badge numéro */}
                <div className="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-harmonie-700 font-bold text-sm shadow-lg">
                  {index + 1}
                </div>
                
                {/* Badge flottant au hover */}
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-r from-harmonie-600 to-harmonie-700 rounded-full flex items-center justify-center text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110">
                  <Eye size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>


        {/* CTA pour voir plus */}
        <div className="text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-xl border border-harmonie-100/50 max-w-2xl mx-auto">
            <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-harmonie-800 mb-4">
              Envie d'en voir plus ?
            </h3>
            <p className="text-harmonie-600 text-base sm:text-lg mb-6 md:mb-8 leading-relaxed px-4">
              Découvrez l'intégralité de notre portfolio et laissez-vous inspirer par nos créations
            </p>
            <button 
              onClick={() => onNavigate('portfolio')}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-harmonie-600 to-harmonie-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-accent font-semibold text-base sm:text-lg hover:from-harmonie-700 hover:to-harmonie-800 transition-all duration-300 hover:shadow-2xl hover:scale-105 shadow-lg"
            >
              Voir tout le portfolio
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PortfolioPreview;