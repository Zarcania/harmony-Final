import React from 'react';
import { Instagram, Phone, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: string) => void;
  onAdminToggle?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate, onAdminToggle }) => {
  const currentYear = new Date().getFullYear();

  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900 text-white overflow-hidden">
      {/* Décorations d'arrière-plan */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-30"></div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo et description */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-white via-neutral-100 to-neutral-200 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="font-display text-2xl font-bold bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 bg-clip-text text-transparent">HC</span>
              </div>
              <h3 className="font-display text-3xl font-bold text-white">
                Harmonie Cils
              </h3>
            </div>
            <p className="text-white/70 leading-relaxed mb-6 max-w-md font-light">
              Institut de beauté spécialisé dans la mise en beauté du regard, les extensions de cils et le maquillage semi-permanent. Sublimez votre regard avec passion et expertise.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com/harmoniecils"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-6"
              >
                <Instagram size={20} />
              </a>
              <a
                href="tel:0770166571"
                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-6"
              >
                <Phone size={20} />
              </a>
              <a
                href="mailto:harmoniecilsstudio@gmail.com"
                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-6"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-white mb-6 text-lg">Navigation</h4>
            <nav className="space-y-3">
              <button
                onClick={() => handleNavigation('accueil')}
                className="block text-white/70 hover:text-white transition-colors font-light hover:translate-x-1 duration-300"
              >
                Accueil
              </button>
              <button
                onClick={() => handleNavigation('prestations')}
                className="block text-white/70 hover:text-white transition-colors font-light hover:translate-x-1 duration-300"
              >
                Prestations
              </button>
              <button
                onClick={() => handleNavigation('portfolio')}
                className="block text-white/70 hover:text-white transition-colors font-light hover:translate-x-1 duration-300"
              >
                Portfolio
              </button>
              <button
                onClick={() => handleNavigation('about')}
                className="block text-white/70 hover:text-white transition-colors font-light hover:translate-x-1 duration-300"
              >
                À propos
              </button>
              <button
                onClick={() => handleNavigation('avis')}
                className="block text-white/70 hover:text-white transition-colors font-light hover:translate-x-1 duration-300"
              >
                Avis
              </button>
              <button
                onClick={() => handleNavigation('contact')}
                className="block text-white/70 hover:text-white transition-colors font-light hover:translate-x-1 duration-300"
              >
                Contact
              </button>
            </nav>
          </div>

          {/* Contact rapide */}
          <div>
            <h4 className="font-semibold text-white mb-6 text-lg">Contact</h4>
            <div className="space-y-4 text-white/70 font-light">
              <div className="flex items-start gap-3 group">
                <Phone size={18} className="mt-1 text-white/50 group-hover:text-white transition-colors" />
                <div>
                  <a href="tel:0770166571" className="hover:text-white transition-colors block">
                    07 70 16 65 71
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <Mail size={18} className="mt-1 text-white/50 group-hover:text-white transition-colors" />
                <div>
                  <a href="mailto:harmoniecilsstudio@gmail.com" className="hover:text-white transition-colors break-all">
                    harmoniecilsstudio@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <MapPin size={18} className="mt-1 text-white/50 group-hover:text-white transition-colors flex-shrink-0" />
                <div>
                  <p className="hover:text-white transition-colors">
                    1 Rue des Moissons<br />
                    45300 Sermaises
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-white/50 text-center md:text-left font-light">
              © {currentYear} Harmonie Cils. Tous droits réservés.
            </p>
            <p className="text-white/30 text-xs font-light">
              Site web créé par{' '}
              <a
                href="https://zarcania.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#a78181] hover:text-[#b89191] transition-colors font-medium"
              >
                Zarcania.com
              </a>
            </p>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={onAdminToggle}
              className="text-white/30 hover:text-white/60 text-xs font-light transition-colors"
            >
              Admin
            </button>
            <p className="text-white/30 text-xs font-light">
              Fait avec passion pour sublimer votre regard
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;