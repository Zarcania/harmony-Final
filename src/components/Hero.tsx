import React from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';

interface HeroProps {
  onNavigate: (page: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden animate-fade-in">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/b0247cde-f948-4236-bab0-3128ea1eaf2e.jpg)'
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/50 to-transparent"></div>
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-16 items-center max-w-7xl mx-auto py-8 md:py-0">
          {/* Contenu textuel */}
          <div className="text-center lg:text-left max-w-full">
            {/* Titre principal */}
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-black mb-6 md:mb-8 lg:mb-12 leading-[1.1] tracking-[-0.02em] animate-slide-up pb-2 md:pb-4 lg:pb-8">
              <span className="inline-block text-transparent bg-gradient-to-r from-gray-800 via-black to-gray-900 bg-clip-text animate-gradient bg-[length:200%_200%]">
                Harmonie'Cils
              </span>
            </h1>

            {/* Sous-titre */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-900 mb-6 md:mb-8 lg:mb-12 font-light max-w-3xl mx-auto lg:mx-0 leading-relaxed animate-slide-up px-2 sm:px-0">
              Extensions de cils, épilation au fil et soins haut de gamme pour révéler votre beauté naturelle
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center lg:justify-start items-center mb-8 md:mb-16 animate-scale-in px-2 sm:px-0">
              <button
                onClick={() => onNavigate('prestations')}
                className="bg-black text-white px-5 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-full font-accent font-semibold text-sm sm:text-base md:text-lg hover:bg-gray-900 transition-all duration-300 hover:shadow-2xl hover:scale-105 w-full sm:w-auto sm:min-w-[200px] md:min-w-[220px] shadow-lg"
              >
                Voir les prestations
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="border-2 border-black text-black px-5 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-full font-accent font-semibold text-sm sm:text-base md:text-lg hover:bg-black hover:text-white transition-all duration-300 hover:shadow-2xl hover:scale-105 w-full sm:w-auto sm:min-w-[200px] md:min-w-[220px] bg-white/10 backdrop-blur-sm"
              >
                Réserver maintenant
              </button>
            </div>
          </div>

        </div>

        {/* Scroll indicator - Hidden on mobile to avoid overlap */}
        <button
          onClick={() => onNavigate('prestations')}
          className="hidden md:block absolute bottom-10 left-1/2 transform -translate-x-1/2 text-black hover:text-gray-900 transition-all duration-300 animate-bounce hover:scale-110 bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30"
        >
          <ArrowDown size={32} />
        </button>
      </div>
    </section>
  );
};

export default Hero;