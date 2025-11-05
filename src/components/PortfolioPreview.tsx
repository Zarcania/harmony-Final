import React from 'react';
import { ArrowRight, Eye } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { getPortfolioItems } from '../services/contentService';

interface PortfolioPreviewProps {
  onNavigate: (page: string) => void;
}

const PortfolioPreview: React.FC<PortfolioPreviewProps> = ({ onNavigate }) => {
  const { elementRef: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const [homeImages, setHomeImages] = React.useState<Array<{ id: string; url: string; alt: string; title: string }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const items = await getPortfolioItems();
        // Déja ordonnés par order_index via la requête; filtre Accueil et limite 6
        const home = (items || [])
          .filter((it) => !!it.show_on_home)
          .slice(0, 6)
          .map((it) => ({ id: it.id, url: it.url, alt: it.alt, title: it.title }));
        if (active) setHomeImages(home);
      } catch (e) {
        console.error('PortfolioPreview load error', e);
        if (active) setError('Impossible de charger le portfolio pour l\'accueil');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <section className="relative py-12 md:py-16 lg:py-20 bg-gradient-to-br from-neutral-50 to-white overflow-hidden">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-10 md:mb-12">

          <h2 ref={titleRef} className={`font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-black mb-4 md:mb-5 leading-tight transition-all duration-[1200ms] ease-out ${
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
          <p className={`text-base sm:text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-snug px-4 transition-all duration-[1200ms] ease-out delay-300 ${
            titleVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}>
            Découvrez nos réalisations
          </p>
        </div>

        {/* Galerie en grille simple */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-2 shadow animate-pulse">
                <div className="aspect-[3/4] rounded-xl bg-harmonie-100/60" />
              </div>
            ))}
          </div>
        )}

        {!loading && homeImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-12">
          {homeImages.map((image) => (
            <div
              key={image.id}
              className="group cursor-pointer transition-all duration-300 hover:scale-105"
            >
              <div className="relative bg-white rounded-xl sm:rounded-2xl p-2 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="aspect-[3/4] overflow-hidden rounded-lg sm:rounded-xl relative">
                  <img
                    src={image.url}
                    alt={image.alt}
                    loading="lazy"
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
        )}

        {!loading && homeImages.length === 0 && !error && (
          <div className="mb-12 text-center text-sm text-harmonie-600">Aucune image sélectionnée pour l'accueil.</div>
        )}
        {error && (
          <div className="mb-12 text-center text-sm text-red-600">{error}</div>
        )}


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