import React from 'react';
import { Gift, Sparkles, Clock, Star, Heart, Crown, ChevronLeft, ChevronRight, Calendar, Users } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface PromotionSectionProps {
  onNavigate: (page: string) => void;
}

const PromotionSection: React.FC<PromotionSectionProps> = ({ onNavigate }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const { elementRef: titleLeftRef, isVisible: titleLeftVisible } = useScrollAnimation();
  const { elementRef: titleRightRef, isVisible: titleRightVisible } = useScrollAnimation();

  const promotions = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Première visite",
      description: "Volume russe + Rehaussement pour les nouvelles clientes",
      originalPrice: "115€",
      promoPrice: "80€",
      savings: "35€ d'économie",
      badge: "Nouveau",
      urgent: true
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Pack Beauté",
      description: "Sourcils + Lèvre + Extensions + Teinture",
      originalPrice: "90€",
      promoPrice: "65€",
      savings: "25€ d'économie",
      badge: "Populaire",
      urgent: false
    },
    {
      icon: <Crown className="w-6 h-6" />,
      title: "Expérience Premium",
      description: "Volume russe intense + Soins + Retouche offerte",
      originalPrice: "120€",
      promoPrice: "95€",
      savings: "25€ d'économie",
      badge: "Premium",
      urgent: false
    },
    {
      icon: <Gift className="w-6 h-6" />,
      title: "Duo Complice",
      description: "2 prestations au choix pour vous et votre amie",
      originalPrice: "140€",
      promoPrice: "99€",
      savings: "41€ d'économie",
      badge: "Limité",
      urgent: true
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Parrainage",
      description: "Amenez une amie et recevez 15€ de réduction chacune",
      originalPrice: "",
      promoPrice: "15€ offerts",
      savings: "Pour chacune",
      badge: "Fidélité",
      urgent: false
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Happy Hour",
      description: "Lundi au mercredi 14h-16h : 20% sur toutes les prestations",
      originalPrice: "",
      promoPrice: "20% de réduction",
      savings: "Sur tout",
      badge: "Horaire",
      urgent: false
    }
  ];

  const nextPromo = () => {
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const prevPromo = () => {
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  React.useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, promotions.length]);

  React.useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = 320 + 24;
      const centerOffset = (container.offsetWidth - cardWidth) / 2;
      const scrollPosition = (currentIndex * cardWidth) - centerOffset + 48;

      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  return (
    <section className="relative py-20 bg-gradient-to-b from-neutral-50 to-white overflow-hidden">
      {/* Élément décoratif de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-96 h-96 bg-harmonie-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-harmonie-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* En-tête minimaliste */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-harmonie-500 to-transparent"></div>
            <Gift className="w-5 h-5 text-harmonie-600" />
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-harmonie-500 to-transparent"></div>
          </div>

          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-900 mb-6 tracking-tight">
            <span ref={titleLeftRef} className={`inline-block transition-all duration-[1200ms] ease-out ${
              titleLeftVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-[120px]'
            }`}>Offres</span>
            <span ref={titleRightRef} className={`block text-harmonie-700 mt-2 transition-all duration-[1200ms] ease-out delay-200 ${
              titleRightVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-[120px]'
            }`}>Exclusives</span>
          </h2>
          <p className={`text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed font-light transition-all duration-[1200ms] ease-out delay-400 ${
            titleLeftVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}>
            Des tarifs privilégiés pour sublimer votre regard
          </p>
        </div>

        {/* Conteneur de défilement moderne */}
        <div className="relative mb-16">
          {/* Flèches minimalistes */}
          <button
            onClick={prevPromo}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center text-neutral-700 hover:text-harmonie-700 border border-neutral-200/50 hover:border-harmonie-300"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={nextPromo}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center text-neutral-700 hover:text-harmonie-700 border border-neutral-200/50 hover:border-harmonie-300"
          >
            <ChevronRight size={18} />
          </button>

          {/* Grille de promotions */}
          <div className="overflow-hidden px-12">
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto scrollbar-hide gap-6"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              {promotions.map((promo, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-80 group cursor-pointer"
                  onClick={() => onNavigate('contact')}
                >
                  <div className="rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-neutral-200/60 hover:border-harmonie-300 h-full relative overflow-hidden group-hover:-translate-y-1 bg-gradient-to-br from-white to-neutral-50 will-change-transform">

                    {/* Effet marbre en arrière-plan */}
                    <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
                      backgroundImage: 'url(/h-co-tqu0IOMaiU8-unsplash.jpg)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}></div>

                    {/* Badge minimaliste */}
                    {promo.urgent && (
                      <div className="absolute top-6 right-6 flex items-center gap-1.5 z-10">
                        <div className="w-1.5 h-1.5 bg-harmonie-600 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-harmonie-700 uppercase tracking-wider">Limité</span>
                      </div>
                    )}

                    {/* Icône élégante */}
                    <div className="mb-6 relative z-10">
                      <div className="inline-flex items-center justify-center w-14 h-14 bg-harmonie-100 text-harmonie-700 rounded-xl group-hover:scale-110 transition-all duration-300">
                        {promo.icon}
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-white border border-neutral-200 text-neutral-700 px-2 py-0.5 rounded-md text-xs font-medium shadow-sm">
                        {promo.badge}
                      </span>
                    </div>

                    {/* Contenu épuré */}
                    <h3 className="font-display text-2xl font-bold text-neutral-900 mb-3 group-hover:text-harmonie-800 transition-colors relative z-10">
                      {promo.title}
                    </h3>
                    <p className="text-neutral-700 leading-relaxed mb-8 text-sm font-light relative z-10">
                      {promo.description}
                    </p>

                    {/* Prix moderne */}
                    <div className="mb-8 relative z-10">
                      {promo.originalPrice && (
                        <div className="flex items-baseline gap-3 mb-1">
                          <span className="text-neutral-500 line-through text-base">{promo.originalPrice}</span>
                          <span className="text-harmonie-700 font-medium text-xs uppercase tracking-wide">
                            {promo.savings}
                          </span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-light text-neutral-900">{promo.promoPrice}</span>
                        {!promo.originalPrice && (
                          <span className="text-harmonie-700 font-medium text-xs">{promo.savings}</span>
                        )}
                      </div>
                    </div>

                    {/* CTA épuré */}
                    <button className="w-full py-3 rounded-xl font-medium text-harmonie-700 bg-harmonie-100 group-hover:bg-harmonie-600 group-hover:text-white transition-all duration-300 flex items-center justify-center gap-2 relative z-10 shadow-sm">
                      <Calendar size={16} />
                      <span>Réserver</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indicateurs minimalistes */}
          <div className="flex justify-center mt-10 gap-1.5">
            {promotions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-harmonie-600 w-8'
                    : 'bg-neutral-300 w-1 hover:bg-neutral-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* CTA final épuré */}
        <div className="text-center max-w-5xl mx-auto">
          <div className="rounded-3xl p-12 md:p-20 shadow-2xl relative overflow-hidden group min-h-[400px] flex items-center justify-center">
            {/* Image de fond haute qualité */}
            <div className="absolute inset-0">
              <img
                src="/téléchargement.jpeg"
                alt="Texture background"
                className="w-full h-full object-cover object-center"
                style={{
                  imageRendering: 'crisp-edges'
                }}
              />
            </div>

            {/* Overlay dégradé pour meilleure lisibilité */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-neutral-900/80 to-black/85 group-hover:from-black/90 group-hover:via-neutral-900/85 group-hover:to-black/90 transition-all duration-500"></div>

            {/* Effet brillant au survol */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            {/* Vignette pour améliorer la profondeur */}
            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] group-hover:shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] transition-all duration-500"></div>

            {/* Lueur noire au survol */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[0_0_80px_40px_rgba(0,0,0,0.9)_inset]"></div>

            <div className="relative z-10">
              <h3 className="font-display text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Prête pour une transformation ?
              </h3>
              <p className="text-white/90 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                Réservez votre créneau et bénéficiez de nos offres privilégiées pour sublimer votre regard
              </p>
              <button
                onClick={() => onNavigate('contact')}
                className="bg-white text-neutral-900 px-14 py-5 rounded-full font-medium text-lg hover:bg-neutral-100 transition-all duration-300 hover:shadow-2xl hover:scale-105 inline-flex items-center gap-3 shadow-lg"
              >
                <span>Prendre rendez-vous</span>
                <Star size={20} className="text-harmonie-600" />
              </button>
              <p className="text-white/70 text-sm mt-8 tracking-wider uppercase font-light">
                Valable jusqu'au 31 décembre
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromotionSection;