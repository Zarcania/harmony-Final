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
        <div className="text-center mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-harmonie-100/60 backdrop-blur-sm rounded-full px-4 py-2 mb-4 border border-harmonie-200/50">
            <Eye className="w-4 h-4 text-harmonie-600" />
            <span className="text-harmonie-700 font-accent font-medium text-sm">Nos réalisations</span>
          </div>

          <h2 ref={titleRef} className={`font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-3 md:mb-4 leading-tight transition-all duration-[1200ms] ease-out ${
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
          <p className={`text-sm sm:text-base md:text-lg text-gray-700 max-w-2xl mx-auto leading-snug px-4 transition-all duration-[1200ms] ease-out delay-300 ${
            titleVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}>
            Découvrez nos réalisations
          </p>
        </div>

        {/* Galerie en grille simple */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-12">
          {homeImages.map((image, index) => (
            <div
              key={index}
              className="group cursor-pointer transition-all duration-300 hover:scale-105"
            >
              <div className="relative bg-white rounded-xl sm:rounded-2xl p-2 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="aspect-[3/4] overflow-hidden rounded-lg sm:rounded-xl relative">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Overlay simplifié au hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-harmonie-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg sm:rounded-xl flex items-end p-3">
                    <div className="text-white w-full">
                      <h3 className="font-display text-xs sm:text-sm font-bold truncate">
                        {image.title}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Badge flottant au hover */}
                <div className="absolute -top-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-harmonie-600 to-harmonie-700 rounded-full flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                  <Eye size={14} className="sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>


        {/* CTA pour voir plus */}
        <div className="text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg border border-harmonie-100/50 max-w-xl mx-auto">
            <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-harmonie-800 mb-3">
              Envie d'en voir plus ?
            </h3>
            <p className="text-harmonie-600 text-sm sm:text-base mb-5 md:mb-6 leading-snug px-2">
              Découvrez l'intégralité de notre portfolio
            </p>
            <button
              onClick={() => onNavigate('portfolio')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-harmonie-600 to-harmonie-700 text-white px-6 py-3 rounded-full font-accent font-semibold text-sm sm:text-base hover:from-harmonie-700 hover:to-harmonie-800 transition-all duration-300 hover:shadow-xl hover:scale-105 shadow-md"
            >
              Voir tout le portfolio
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PortfolioPreview;