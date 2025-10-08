import React from 'react';
import { Star, Quote, Instagram, ExternalLink, Heart, Sparkles } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface Review {
  name: string;
  rating: number;
  comment: string;
  service: string;
  platform: 'google' | 'instagram';
  image?: string;
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
      platform: "google",
      image: "https://images.pexels.com/photos/3373746/pexels-photo-3373746.jpeg"
    },
    {
      name: "Sophie M.",
      rating: 5,
      comment: "Un travail d'une précision remarquable. Mes sourcils n'ont jamais été aussi bien dessinés. L'épilation au fil est vraiment un art chez Harmonie Cils !",
      service: "Épilation sourcils",
      platform: "google",
      image: "https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg"
    },
    {
      name: "Camille D.",
      rating: 5,
      comment: "Je ne peux plus me passer de mes cils ! Le volume mixte est exactement ce que je voulais. Bravo pour ce travail exceptionnel ! ✨",
      service: "Volume mixte",
      platform: "instagram",
      image: "https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg"
    },
    {
      name: "Émilie R.",
      rating: 5,
      comment: "Institut de qualité avec des produits haut de gamme. Le rehaussement de cils donne un effet naturel magnifique. Je reviendrai sans hésiter !",
      service: "Rehaussement cils",
      platform: "google",
      image: "https://images.pexels.com/photos/3373745/pexels-photo-3373745.jpeg"
    },
    {
      name: "Laura V.",
      rating: 5,
      comment: "Professionnalisme et douceur au rendez-vous. Mes cils paraissent tellement naturels qu'on me demande toujours si c'est ma vraie couleur ! 😍",
      service: "Teinture cils",
      platform: "instagram",
      image: "https://images.pexels.com/photos/3373743/pexels-photo-3373743.jpeg"
    },
    {
      name: "Julie K.",
      rating: 5,
      comment: "Un moment de détente absolue ! L'ambiance est apaisante et le résultat dépasse mes attentes. Mes cils sont parfaits depuis 3 semaines !",
      service: "Pose cil à cil",
      platform: "google",
      image: "https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg"
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
    <section id="avis" className="relative py-24 overflow-hidden">
      {/* Background avec gradient neutre */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* En-tête */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full mb-8 shadow-sm">
            <Heart className="w-5 h-5 text-black" />
            <span className="text-sm font-medium text-gray-700">Témoignages authentiques</span>
            <Sparkles className="w-5 h-5 text-black" />
          </div>

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
            Découvrez les témoignages de nos clientes satisfaites et rejoignez notre communauté
          </p>

        </div>

        {/* Grille des avis redesignée */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="group bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative border border-white/50"
            >
              {/* Contenu de l'avis */}
              <div className="p-8">
                {/* Badge plateforme et étoiles en haut */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                  {review.platform === 'google' ? (
                    <div className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full font-medium text-xs">
                      Google
                    </div>
                  ) : (
                    <div className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 text-xs">
                      <Instagram size={12} />
                      Instagram
                    </div>
                  )}
                </div>

                <Quote className="w-8 h-8 text-gray-200 mb-4" />

                <p className="text-gray-700 mb-6 leading-relaxed font-light text-base">
                  "{review.comment}"
                </p>

                <div className="border-t border-gray-100 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-semibold text-sm">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {review.name}
                      </p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {review.service}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA pour voir plus d'avis - Redesigné */}
        <div className="text-center space-y-8 mt-20">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl max-w-4xl mx-auto border border-white/50">
            <Heart className="w-12 h-12 text-black mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Rejoignez nos clientes satisfaites
            </h3>
            <p className="text-gray-600 font-light tracking-wide mb-8 text-lg">
              Découvrez plus de témoignages et suivez-nous pour voir nos dernières réalisations
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://google.com/business/harmoniecils"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-full font-medium tracking-wide hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1"
              >
                <ExternalLink size={20} className="group-hover:rotate-12 transition-transform duration-300" />
                Voir nos avis Google
                <div className="bg-white/20 px-2 py-1 rounded-full text-xs">150+</div>
              </a>
              <a
                href="https://instagram.com/harmoniecils"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-medium tracking-wide border border-gray-200 hover:border-black transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1"
              >
                <Instagram size={20} className="group-hover:scale-110 transition-transform duration-300" />
                Suivre sur Instagram
                <Sparkles size={16} className="group-hover:rotate-180 transition-transform duration-500" />
              </a>
            </div>
          </div>

          {/* Section d'images avant/après */}
          <div className="mt-16">
            <p className="text-gray-500 text-sm font-medium mb-6">Nos dernières réalisations</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {[
                "https://images.pexels.com/photos/3373746/pexels-photo-3373746.jpeg",
                "https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg",
                "https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg",
                "https://images.pexels.com/photos/3373745/pexels-photo-3373745.jpeg"
              ].map((img, idx) => (
                <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                  <img
                    src={img}
                    alt={`Réalisation ${idx + 1}`}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <Instagram className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;