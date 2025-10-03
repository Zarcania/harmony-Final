import React from 'react';
import { Heart, Award, Users, Clock } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface AboutProps {
  onNavigate: (page: string) => void;
}

const About: React.FC<AboutProps> = ({ onNavigate }) => {
  const { elementRef: titleLeftRef, isVisible: titleLeftVisible } = useScrollAnimation();
  const { elementRef: titleRightRef, isVisible: titleRightVisible } = useScrollAnimation();
  const { elementRef: subtitle1Ref, isVisible: subtitle1Visible } = useScrollAnimation();

  const features = [
    {
      icon: <Award className="w-6 h-6" />,
      title: "Qualité",
      description: "Des techniques précises et un matériel haut de gamme pour un résultat impeccable et durable"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Bien-être",
      description: "Un cadre apaisant et une écoute bienveillante pour transformer chaque rendez-vous en parenthèse agréable"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Confiance",
      description: "Un accompagnement personnalisé et des conseils adaptés pour entretenir vos cils et prolonger leur éclat"
    }
  ];

  return (
    <section id="about" className="relative py-20 bg-white/70 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-20">
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-black mb-8 leading-tight">
            <span ref={titleLeftRef} className={`inline-block transition-all duration-[1200ms] ease-out ${
              titleLeftVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-[120px]'
            }`}>À propos</span>
            <span> </span>
            <span ref={titleRightRef} className={`inline-block transition-all duration-[1200ms] ease-out ${
              titleRightVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-[120px]'
            }`}>d'Harmonie Cils</span>
          </h2>
          <p className={`text-xl md:text-2xl text-gray-900 max-w-3xl mx-auto font-medium leading-relaxed transition-all duration-[1200ms] ease-out delay-300 ${
            titleLeftVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}>
            Votre institut de beauté dédié à la sublimation de votre regard
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-20 items-center mb-20">
          {/* Contenu textuel */}
          <div>
            <h3 ref={subtitle1Ref} className={`font-display text-4xl md:text-5xl font-bold text-black mb-8 leading-tight transition-all duration-[1200ms] ease-out ${
              subtitle1Visible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-[120px]'
            }`}>
              Bienvenue
            </h3>
            <div className="space-y-6 text-gray-900 leading-relaxed text-lg">
              <p className="font-light">
                Je m'appelle Océane, technicienne de cils passionnée et spécialisée dans la mise en beauté du regard, ainsi que dans le maquillage semi-permanent des sourcils et des lèvres.
              </p>
              <p className="font-light">
                Depuis mes débuts, j'ai toujours eu à cœur d'offrir bien plus qu'une simple prestation : un moment de détente, de confiance et de valorisation de soi.
              </p>
              <p className="font-light">
                Longtemps restée discrète sur mes réseaux professionnels, je choisis aujourd'hui de me dévoiler davantage pour que vous puissiez découvrir la personne derrière les pinces et les extensions de cils.
              </p>
              <p className="font-medium text-neutral-900">
                Mon travail repose sur trois valeurs essentielles :
              </p>
              <ul className="space-y-3 ml-4">
                <li className="font-light flex items-start gap-2">
                  <span className="text-2xl leading-none">💎</span>
                  <span><strong className="font-semibold">Qualité</strong> – Des techniques précises et un matériel haut de gamme pour un résultat impeccable et durable.</span>
                </li>
                <li className="font-light flex items-start gap-2">
                  <span className="text-2xl leading-none">🌿</span>
                  <span><strong className="font-semibold">Bien-être</strong> – Un cadre apaisant et une écoute bienveillante pour transformer chaque rendez-vous en parenthèse agréable.</span>
                </li>
                <li className="font-light flex items-start gap-2">
                  <span className="text-2xl leading-none">🤝</span>
                  <span><strong className="font-semibold">Confiance</strong> – Un accompagnement personnalisé et des conseils adaptés pour entretenir vos cils et prolonger leur éclat.</span>
                </li>
              </ul>
              <p className="font-light">
                Votre satisfaction et votre confiance sont ma plus belle récompense.
              </p>
              <p className="font-light">
                Merci à toutes celles qui m'accompagnent déjà, et bienvenue à celles qui souhaitent vivre l'expérience pour la première fois.
              </p>
              <p className="font-medium text-neutral-900">
                Hâte de sublimer votre regard
              </p>
            </div>
          </div>

          {/* Photo professionnelle */}
          <div className="relative">
            <img
              src="/files_3416049-1759335889816-files_3416049-1759265627661-unnamed - Modifié.png"
              alt="Professionnelle Harmonie Cils"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Caractéristiques */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center bg-gradient-to-br from-white via-neutral-50 to-white rounded-[2rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_20px_48px_rgba(0,0,0,0.18)] transition-all duration-500 hover:-translate-y-2 group border border-neutral-200/60 relative overflow-hidden"
            >
              {/* Décorations d'arrière-plan */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neutral-100/40 to-transparent rounded-full blur-3xl opacity-60"></div>

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 text-white rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="font-display text-2xl font-bold text-neutral-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-neutral-700 leading-relaxed font-medium text-base">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;