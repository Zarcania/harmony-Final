import React from 'react';
import { Gift, Sparkles, Clock, Star, Heart, Crown, Calendar } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface PromotionSectionProps {
  onNavigate: (page: string) => void;
}

const PromotionSection: React.FC<PromotionSectionProps> = ({ onNavigate }) => {
  const { elementRef: titleLeftRef, isVisible: titleLeftVisible } = useScrollAnimation();
  const { elementRef: titleRightRef, isVisible: titleRightVisible } = useScrollAnimation();
  
  const promotions = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Première visite",
      description: "Volume russe + Rehaussement",
      price: "80€",
      originalPrice: "115€",
      badge: "Nouveau"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Pack Beauté", 
      description: "Sourcils + Extensions",
      price: "65€",
      originalPrice: "90€",
      badge: "Populaire"
    },
    {
      icon: <Crown className="w-6 h-6" />,
      title: "Premium",
      description: "Volume russe + Soins",
      price: "95€",
      originalPrice: "120€", 
      badge: "Premium"
    },
    {
      icon: <Gift className="w-6 h-6" />,
      title: "Duo Complice",
      description: "Pour vous et votre amie",
      price: "99€",
      originalPrice: "140€",
      badge: "Limité"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-neutral-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-black mb-8 leading-tight">
            <span ref={titleLeftRef} className={`inline-block transition-all duration-[1200ms] ease-out ${
              titleLeftVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-[120px]'
            }`}>Promo</span>
            <span> </span>
            <span ref={titleRightRef} className={`inline-block transition-all duration-[1200ms] ease-out ${
              titleRightVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-[120px]'
            }`}>Exclusives</span>
          </h2>
          <p className={`text-xl md:text-2xl text-neutral-700 font-light max-w-3xl mx-auto leading-relaxed transition-all duration-[1200ms] ease-out delay-300 ${
            titleLeftVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}>
            Des tarifs privilégiés pour sublimer votre regard
          </p>
        </div>

        {/* Mobile: Grid 2x2 */}
        <div className="block md:hidden mb-12">
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            {promotions.map((promo, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group border border-neutral-200"
                onClick={() => onNavigate('contact')}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 bg-harmonie-100 rounded-lg flex items-center justify-center text-harmonie-700">
                      {React.cloneElement(promo.icon, { className: 'w-4 h-4' })}
                    </div>
                    <span className="text-xs bg-harmonie-100 text-harmonie-700 px-2 py-1 rounded-full font-medium">
                      {promo.badge}
                    </span>
                  </div>
                  
                  <h3 className="font-display text-sm font-bold text-neutral-900 mb-2 leading-tight">
                    {promo.title}
                  </h3>
                  
                  <p className="text-xs text-neutral-600 mb-4 flex-grow">
                    {promo.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500 line-through">
                        {promo.originalPrice}
                      </span>
                      <span className="text-lg font-bold text-harmonie-700">
                        {promo.price}
                      </span>
                    </div>
                    
                    <button className="w-full bg-harmonie-100 text-harmonie-700 py-2 rounded-lg text-xs font-medium hover:bg-harmonie-600 hover:text-white transition-colors flex items-center justify-center gap-1">
                      <Calendar size={12} />
                      Réserver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Horizontal scroll */}
        <div className="hidden md:block mb-16">
          <div className="flex justify-center">
            <div className="flex gap-6 max-w-6xl overflow-x-auto pb-4 px-4 mx-auto">
              {promotions.map((promo, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-80 bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group border border-neutral-200"
                onClick={() => onNavigate('contact')}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-harmonie-100 rounded-xl flex items-center justify-center text-harmonie-700 group-hover:scale-110 transition-transform">
                    {promo.icon}
                  </div>
                  <span className="text-sm bg-harmonie-100 text-harmonie-700 px-3 py-1 rounded-full font-medium">
                    {promo.badge}
                  </span>
                </div>
                
                <h3 className="font-display text-2xl font-bold text-neutral-900 mb-3">
                  {promo.title}
                </h3>
                
                <p className="text-neutral-600 mb-8">
                  {promo.description}
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg text-neutral-500 line-through">
                      {promo.originalPrice}
                    </span>
                    <span className="text-4xl font-light text-harmonie-700">
                      {promo.price}
                    </span>
                  </div>
                  
                  <button className="w-full bg-harmonie-100 text-harmonie-700 py-3 rounded-xl font-medium hover:bg-harmonie-600 hover:text-white transition-colors flex items-center justify-center gap-2">
                    <Calendar size={16} />
                    Réserver maintenant
                  </button>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-black rounded-3xl p-8 md:p-16">
            <h3 className="font-display text-3xl md:text-5xl font-bold text-white mb-6">
              Prête pour une transformation ?
            </h3>
            <p className="text-white/80 text-lg mb-8">
              Réservez votre créneau et bénéficiez de nos offres privilégiées
            </p>
            <button
              onClick={() => onNavigate('contact')}
              className="bg-white text-neutral-900 px-8 py-4 rounded-full font-medium hover:bg-neutral-100 transition-colors inline-flex items-center gap-3"
            >
              <span>Prendre rendez-vous</span>
              <Star size={20} className="text-harmonie-600" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromotionSection;