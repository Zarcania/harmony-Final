import React from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';

interface HeroProps {
  onNavigate: (page: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {

  return (
    <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden animate-fade-in">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/b0247cde-f948-4236-bab0-3128ea1eaf2e.jpg)'
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/50 to-transparent"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          {/* Contenu textuel */}
          <div className="text-center lg:text-left">
            {/* Titre principal */}
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-bold text-black mb-12 leading-[1.1] tracking-[-0.02em] animate-slide-up pb-8">
              Révélez
              <span className="block text-transparent bg-gradient-to-r from-gray-800 via-black to-gray-900 bg-clip-text animate-gradient bg-[length:200%_200%]">
                votre éclat
              </span>
            </h1>

            {/* Sous-titre */}
            <p className="text-xl md:text-2xl lg:text-3xl text-gray-900 mb-12 font-light max-w-3xl mx-auto lg:mx-0 leading-relaxed animate-slide-up">
              Extensions de cils, épilation au fil et soins haut de gamme pour révéler votre beauté naturelle
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start items-center mb-16 animate-scale-in">
              <button
                onClick={() => onNavigate('prestations')}
                className="bg-black text-white px-10 py-5 rounded-full font-accent font-semibold text-lg hover:bg-gray-900 transition-all duration-300 hover:shadow-2xl hover:scale-105 min-w-[220px] shadow-lg"
              >
                Voir les prestations
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="border-2 border-black text-black px-10 py-5 rounded-full font-accent font-semibold text-lg hover:bg-black hover:text-white transition-all duration-300 hover:shadow-2xl hover:scale-105 min-w-[220px] bg-white/10 backdrop-blur-sm"
              >
                Réserver maintenant
              </button>
            </div>
          </div>

        </div>

        {/* Scroll indicator */}
        <button
          onClick={() => onNavigate('prestations')}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-black hover:text-gray-900 transition-all duration-300 animate-bounce hover:scale-110 bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30"
        >
          <ArrowDown size={32} />
        </button>
      </div>
    </section>
  );
};

export default Hero;