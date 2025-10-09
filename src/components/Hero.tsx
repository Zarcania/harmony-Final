import React from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';

interface HeroProps {
  onNavigate: (page: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {

  return (
    <section id="hero" className="relative min-h-[100svh] flex items-center justify-center overflow-hidden animate-fade-in pt-20 md:pt-0">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/b0247cde-f948-4236-bab0-3128ea1eaf2e.jpg)'
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-white/30 md:from-white/85 md:via-white/50 md:to-transparent"></div>
      <div className="container mx-auto px-5 sm:px-6 md:px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-16 items-center max-w-7xl mx-auto py-12 md:py-0">
          {/* Contenu textuel */}
          <div className="text-center lg:text-left max-w-full">
            {/* Titre principal */}
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-black mb-5 md:mb-6 lg:mb-8 leading-[1.05] tracking-[-0.02em] animate-slide-up">
              <span className="inline-block text-transparent bg-gradient-to-r from-gray-800 via-black to-gray-900 bg-clip-text animate-gradient bg-[length:200%_200%]">
                Harmonie'Cils
              </span>
            </h1>

            {/* Sous-titre */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-800 mb-8 md:mb-10 lg:mb-12 font-light max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-slide-up">
              Extensions de cils, épilation au fil et soins haut de gamme
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 justify-center lg:justify-start items-stretch animate-scale-in max-w-md mx-auto lg:mx-0">
              <button
                onClick={() => onNavigate('prestations')}
                className="bg-black text-white px-8 py-5 rounded-xl font-accent font-bold text-base hover:bg-gray-900 transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-95 w-full"
              >
                Voir les prestations
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="border-2 border-black text-black px-8 py-5 rounded-xl font-accent font-bold text-base hover:bg-black hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 w-full bg-white/80 backdrop-blur-sm"
              >
                Réserver maintenant
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
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