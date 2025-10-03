import React from 'react';
import { Star, Quote, Instagram, ExternalLink } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface Review {
  name: string;
  rating: number;
  comment: string;
  service: string;
  platform: 'google' | 'instagram';
}

interface ReviewsProps {
  onNavigate: (page: string) => void;
}

const Reviews: React.FC<ReviewsProps> = ({ onNavigate }) => {
  const { elementRef: titleLeftRef, isVisible: titleLeftVisible } = useScrollAnimation();
  const { elementRef: titleRightRef, isVisible: titleRightVisible } = useScrollAnimation();

  const reviews: Review[] = [
    {
      name: "Marie L.",
      rating: 5,
      comment: "Absolument parfait ! Les extensions de cils sont magnifiques et tiennent parfaitement. L'accueil est chaleureux et professionnel. Je recommande vivement !",
      service: "Extensions volume russe",
      platform: "google"
    },
    {
      name: "Sophie M.",
      rating: 5,
      comment: "Un travail d'une précision remarquable. Mes sourcils n'ont jamais été aussi bien dessinés. L'épilation au fil est vraiment un art chez Harmonie Cils !",
      service: "Épilation sourcils",
      platform: "google"
    },
    {
      name: "Camille D.",
      rating: 5,
      comment: "Je ne peux plus me passer de mes cils ! Le volume mixte est exactement ce que je voulais. Bravo pour ce travail exceptionnel ! ✨",
      service: "Volume mixte",
      platform: "instagram"
    },
    {
      name: "Émilie R.",
      rating: 5,
      comment: "Institut de qualité avec des produits haut de gamme. Le rehaussement de cils donne un effet naturel magnifique. Je reviendrai sans hésiter !",
      service: "Rehaussement cils",
      platform: "google"
    },
    {
      name: "Laura V.",
      rating: 5,
      comment: "Professionnalisme et douceur au rendez-vous. Mes cils paraissent tellement naturels qu'on me demande toujours si c'est ma vraie couleur ! 😍",
      service: "Teinture cils",
      platform: "instagram"
    },
    {
      name: "Julie K.",
      rating: 5,
      comment: "Un moment de détente absolue ! L'ambiance est apaisante et le résultat dépasse mes attentes. Mes cils sont parfaits depuis 3 semaines !",
      service: "Pose cil à cil",
      platform: "google"
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star 
        key={index} 
        size={16} 
        className={`${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <section id="avis" className="relative py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-20">
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-black mb-8 leading-tight">
            <span ref={titleLeftRef} className={`inline-block transition-all duration-[1200ms] ease-out ${
              titleLeftVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-[120px]'
            }`}>Ce que disent</span>
            <span> </span>
            <span ref={titleRightRef} className={`inline-block transition-all duration-[1200ms] ease-out ${
              titleRightVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-[120px]'
            }`}>nos clientes</span>
          </h2>
          <p className={`text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-12 font-light transition-all duration-[1200ms] ease-out delay-300 ${
            titleLeftVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}>
            Découvrez les témoignages de nos clientes satisfaites
          </p>

          {/* Statistiques */}
          <div className="flex justify-center items-center gap-12 mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-3">
                {renderStars(5)}
              </div>
              <p className="text-3xl font-light text-black mb-1">4.9/5</p>
              <p className="text-sm text-gray-600 font-light tracking-wide">Note moyenne</p>
            </div>
            <div className="w-px h-20 bg-gray-200"></div>
            <div className="text-center">
              <p className="text-3xl font-light text-black mb-1">150+</p>
              <p className="text-sm text-gray-600 font-light tracking-wide">Avis clients</p>
            </div>
          </div>
        </div>

        {/* Grille des avis */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-1 relative border border-gray-100"
            >
              <div className="absolute top-6 right-6">
                {review.platform === 'google' ? (
                  <div className="text-xs bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full font-light tracking-wide">
                    Google
                  </div>
                ) : (
                  <div className="text-xs bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full font-light flex items-center gap-1.5 tracking-wide">
                    <Instagram size={12} />
                    Instagram
                  </div>
                )}
              </div>

              <Quote className="w-10 h-10 text-gray-200 mb-6" />

              <div className="flex items-center gap-1 mb-4">
                {renderStars(review.rating)}
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed font-light text-base">
                "{review.comment}"
              </p>

              <div className="border-t border-gray-100 pt-5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-black text-sm">
                      {review.name}
                    </p>
                    <p className="text-sm text-gray-500 font-light mt-1">
                      {review.service}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA pour voir plus d'avis */}
        <div className="text-center space-y-6">
          <p className="text-gray-600 font-light tracking-wide">
            Retrouvez tous nos avis sur nos plateformes
          </p>
          <div className="flex justify-center gap-6">
            <a
              href="https://google.com/business/harmoniecils"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-light tracking-wide border border-black hover:bg-gray-900 transition-all duration-300 hover:shadow-lg"
            >
              <ExternalLink size={18} />
              Voir sur Google
            </a>
            <a
              href="https://instagram.com/harmoniecils"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-light tracking-wide border border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg"
            >
              <Instagram size={18} />
              Suivre sur Instagram
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;