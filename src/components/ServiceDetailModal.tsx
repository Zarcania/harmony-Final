import React from 'react';
import { X, Clock, Euro, Sparkles } from 'lucide-react';

interface ServiceItem {
  id: string;
  label: string;
  price: string;
  description?: string;
  duration?: string;
  benefits?: string[];
}

interface ServiceSection {
  id: string;
  title: string;
  icon: string;
}

interface ServiceDetailModalProps {
  service: ServiceItem;
  section: ServiceSection;
  onClose: () => void;
}

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ service, section, onClose }) => {
  const defaultDescriptions: { [key: string]: string } = {
    'Sourcils': 'Épilation précise au fil pour des sourcils parfaitement dessinés et harmonieux avec votre visage.',
    'Lèvre': 'Épilation douce et efficace de la lèvre supérieure pour une peau lisse et nette.',
    'Menton': 'Épilation délicate du menton pour une peau parfaitement lisse.',
    'Sourcils & Lèvre': 'Formule complète combinant épilation des sourcils et de la lèvre pour un résultat harmonieux.',
    'Sourcils, Lèvre & Menton': 'Formule complète pour un visage parfaitement épilé et soigné.',
    'Pose cil à cil': 'Technique classique pour un effet naturel. Une extension est posée sur chaque cil naturel pour un regard sublimé en douceur.',
    'Pose volume mixte': 'Combinaison de techniques cil à cil et volume pour un résultat équilibré entre naturel et intensité.',
    'Pose volume russe': 'Technique de pointe créant un effet volume spectaculaire. Plusieurs extensions ultra-fines sont posées en éventail sur chaque cil.',
    'Pose volume russe intense': 'La technique la plus spectaculaire pour un volume maximal et un regard dramatique et glamour.',
    'Remplissage cil à cil': 'Entretien de votre pose cil à cil pour maintenir un résultat parfait.',
    'Remplissage mixte': 'Entretien de votre pose volume mixte pour conserver l\'équilibre parfait.',
    'Remplissage russe': 'Entretien de votre volume russe pour préserver l\'intensité de votre regard.',
    'Dépose': 'Retrait professionnel et en douceur de vos extensions de cils.',
    'Rehaussement de cils': 'Technique de courbure naturelle qui sublime vos cils naturels pour un regard ouvert.',
    'Rehaussement & teinture': 'Courbure et coloration de vos cils naturels pour un effet mascara permanent.',
    'Teinture de cils': 'Coloration de vos cils naturels pour intensifier votre regard sans maquillage.'
  };

  const defaultDurations: { [key: string]: string } = {
    'Sourcils': '15 min',
    'Lèvre': '10 min',
    'Menton': '10 min',
    'Sourcils & Lèvre': '20 min',
    'Sourcils, Lèvre & Menton': '30 min',
    'Pose cil à cil': '1h30',
    'Pose volume mixte': '2h',
    'Pose volume russe': '2h30',
    'Pose volume russe intense': '3h',
    'Remplissage cil à cil': '45 min',
    'Remplissage mixte': '1h',
    'Remplissage russe': '1h15',
    'Dépose': '30 min',
    'Rehaussement de cils': '1h',
    'Rehaussement & teinture': '1h15',
    'Teinture de cils': '30 min'
  };

  const defaultBenefits: { [key: string]: string[] } = {
    'Sourcils': ['Résultat précis et net', 'Technique douce', 'Tenue jusqu\'à 3 semaines'],
    'Lèvre': ['Épilation en douceur', 'Peau lisse', 'Résultat durable'],
    'Menton': ['Technique délicate', 'Sans irritation', 'Peau parfaitement lisse'],
    'Sourcils & Lèvre': ['Formule économique', 'Résultat harmonieux', 'Gain de temps'],
    'Sourcils, Lèvre & Menton': ['Formule complète avantageuse', 'Visage parfaitement soigné', 'Service complet'],
    'Pose cil à cil': ['Effet naturel', 'Tenue 4-6 semaines', 'Respecte vos cils naturels'],
    'Pose volume mixte': ['Équilibre parfait', 'Volume modulable', 'Tenue 4-6 semaines'],
    'Pose volume russe': ['Volume spectaculaire', 'Extensions ultra-légères', 'Effet glamour garanti'],
    'Pose volume russe intense': ['Volume maximal', 'Regard dramatique', 'Effet red carpet'],
    'Remplissage cil à cil': ['Maintien du résultat', 'Remplacement des extensions tombées', 'Économique'],
    'Remplissage mixte': ['Conservation du volume', 'Résultat optimal', 'Entretien régulier recommandé'],
    'Remplissage russe': ['Préserve l\'intensité', 'Volume maintenu', 'Regard toujours parfait'],
    'Dépose': ['Retrait sans dommage', 'Soin des cils naturels', 'Procédure professionnelle'],
    'Rehaussement de cils': ['Effet naturel longue durée', 'Tenue 6-8 semaines', 'Regard ouvert'],
    'Rehaussement & teinture': ['Double effet', 'Regard intense', 'Plus besoin de mascara'],
    'Teinture de cils': ['Effet mascara permanent', 'Tenue 4-6 semaines', 'Idéal pour les vacances']
  };

  const description = service.description || defaultDescriptions[service.label] || 'Description détaillée de la prestation.';
  const duration = service.duration || defaultDurations[service.label] || 'Variable';
  const benefits = service.benefits || defaultBenefits[service.label] || ['Résultat professionnel', 'Technique experte', 'Satisfaction garantie'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white p-8 rounded-t-3xl">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-neutral-300 text-sm mb-2 font-medium">{section.title}</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 leading-tight">
                {service.label}
              </h2>
              <div className="flex items-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-lg">{duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Euro className="w-5 h-5" />
                  <span className="text-2xl font-bold text-white">{service.price}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h3 className="font-display text-2xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-neutral-700" />
              Description
            </h3>
            <p className="text-lg text-neutral-700 leading-relaxed">
              {description}
            </p>
          </div>

          <div>
            <h3 className="font-display text-2xl font-bold text-neutral-900 mb-4">
              Avantages
            </h3>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3 text-neutral-700">
                  <div className="w-2 h-2 rounded-full bg-neutral-900 mt-2 flex-shrink-0"></div>
                  <span className="text-lg leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-8 border-t border-neutral-200">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailModal;
