import React, { useState } from 'react';
import { Phone, Instagram } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigation = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);

    if (page === 'prestations') {
      setTimeout(() => {
        const servicesTitle = document.getElementById('services-title');
        if (servicesTitle) {
          const offset = 120;
          const elementPosition = servicesTitle.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementPosition - offset,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isActivePage = (page: string) => currentPage === page;

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{
      backgroundImage: 'url(/h-co-tqu0IOMaiU8-unsplash.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'scroll'
    }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 md:h-28">
          {/* Logo */}
          <div
            className="cursor-pointer hover:opacity-80 transition-opacity duration-300 z-20"
            onClick={() => handleNavigation('accueil')}
          >
            <img
              src="/49ab398c-dcda-40f2-9ce7-bb89453e6e8d.png"
              alt="Harmonie Cils"
              className="h-16 md:h-16 lg:h-24 w-auto object-contain"
            />
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center space-x-8">
            <button
              onClick={() => handleNavigation('accueil')}
              className={`font-accent font-medium transition-all duration-300 text-lg relative group ${
                isActivePage('accueil')
                  ? 'text-black font-bold'
                  : 'text-gray-900'
              }`}
            >
              <span className="relative z-10 group-hover:text-black transition-colors duration-300">Accueil</span>
              <span className="absolute -inset-2 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 opacity-0 group-hover:opacity-50 rounded-lg blur-md transition-all duration-300"></span>
            </button>
            <button
              onClick={() => handleNavigation('prestations')}
              className={`font-accent font-medium transition-all duration-300 text-lg relative group ${
                isActivePage('prestations')
                  ? 'text-black font-bold'
                  : 'text-gray-900'
              }`}
            >
              <span className="relative z-10 group-hover:text-black transition-colors duration-300">Prestations</span>
              <span className="absolute -inset-2 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 opacity-0 group-hover:opacity-50 rounded-lg blur-md transition-all duration-300"></span>
            </button>
            <button
              onClick={() => handleNavigation('portfolio')}
              className={`font-accent font-medium transition-all duration-300 text-lg relative group ${
                isActivePage('portfolio')
                  ? 'text-black font-bold'
                  : 'text-gray-900'
              }`}
            >
              <span className="relative z-10 group-hover:text-black transition-colors duration-300">Portfolio</span>
              <span className="absolute -inset-2 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 opacity-0 group-hover:opacity-50 rounded-lg blur-md transition-all duration-300"></span>
            </button>
            <button
              onClick={() => handleNavigation('about')}
              className={`font-accent font-medium transition-all duration-300 text-lg relative group ${
                isActivePage('about')
                  ? 'text-black font-bold'
                  : 'text-gray-900'
              }`}
            >
              <span className="relative z-10 group-hover:text-black transition-colors duration-300">À propos</span>
              <span className="absolute -inset-2 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 opacity-0 group-hover:opacity-50 rounded-lg blur-md transition-all duration-300"></span>
            </button>
            <button
              onClick={() => handleNavigation('contact')}
              className={`font-accent font-medium transition-all duration-300 text-lg relative group ${
                isActivePage('contact')
                  ? 'text-black font-bold'
                  : 'text-gray-900'
              }`}
            >
              <span className="relative z-10 group-hover:text-black transition-colors duration-300">Contact</span>
              <span className="absolute -inset-2 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 opacity-0 group-hover:opacity-50 rounded-lg blur-md transition-all duration-300"></span>
            </button>
          </nav>

          {/* Bouton CTA Desktop */}
          <button
            onClick={() => handleNavigation('contact')}
            className="hidden lg:block relative bg-black text-white px-6 py-3 rounded-full font-accent font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105"
          >
            Réserver
          </button>

          {/* Menu Burger Mobile */}
          <button
            className="lg:hidden relative w-12 h-12 flex flex-col items-center justify-center space-y-1 group z-20 bg-black/10 backdrop-blur-sm rounded-lg hover:bg-black/20 transition-all duration-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className={`block w-6 h-0.5 bg-black transition-all duration-300 ease-in-out ${
              isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
            }`}></span>
            <span className={`block w-6 h-0.5 bg-black transition-all duration-300 ease-in-out ${
              isMobileMenuOpen ? 'opacity-0' : ''
            }`}></span>
            <span className={`block w-6 h-0.5 bg-black transition-all duration-300 ease-in-out ${
              isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
            }`}></span>
          </button>
        </div>

        {/* Overlay */}
        <div
          className={`lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300 z-30 ${
            isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Navigation Mobile */}
        <div className={`lg:hidden fixed top-20 left-0 right-0 transition-all duration-300 ease-out z-40 ${
          isMobileMenuOpen
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0'
        }`}>
          <div className="mx-4 bg-white rounded-2xl shadow-2xl border border-gray-100">
            <nav className="flex flex-col space-y-1 p-4">
              <button
                onClick={() => handleNavigation('accueil')}
                className={`font-accent font-semibold text-left py-4 px-5 rounded-xl transition-all duration-200 text-base ${
                  isActivePage('accueil')
                    ? 'bg-black text-white'
                    : 'text-gray-900 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                Accueil
              </button>
              <button
                onClick={() => handleNavigation('prestations')}
                className={`font-accent font-semibold text-left py-4 px-5 rounded-xl transition-all duration-200 text-base ${
                  isActivePage('prestations')
                    ? 'bg-black text-white'
                    : 'text-gray-900 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                Prestations
              </button>
              <button
                onClick={() => handleNavigation('portfolio')}
                className={`font-accent font-semibold text-left py-4 px-5 rounded-xl transition-all duration-200 text-base ${
                  isActivePage('portfolio')
                    ? 'bg-black text-white'
                    : 'text-gray-900 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => handleNavigation('about')}
                className={`font-accent font-semibold text-left py-4 px-5 rounded-xl transition-all duration-200 text-base ${
                  isActivePage('about')
                    ? 'bg-black text-white'
                    : 'text-gray-900 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                À propos
              </button>
              <button
                onClick={() => handleNavigation('contact')}
                className={`font-accent font-semibold text-left py-4 px-5 rounded-xl transition-all duration-200 text-base ${
                  isActivePage('contact')
                    ? 'bg-black text-white'
                    : 'text-gray-900 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                Contact
              </button>
              
              {/* Séparateur */}
              <div className="border-t border-gray-200 my-4"></div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => handleNavigation('contact')}
                  className="w-full bg-black text-white py-4 rounded-xl font-accent font-semibold text-base shadow-lg hover:bg-gray-900 active:bg-gray-800 transition-all duration-200"
                >
                  Réserver maintenant
                </button>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <a
                    href="https://instagram.com/harmoniecils"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors duration-200"
                  >
                    <Instagram size={22} />
                    <span className="text-sm font-medium">Instagram</span>
                  </a>
                  <div className="w-px h-5 bg-gray-300"></div>
                  <a
                    href="tel:0600000000"
                    className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors duration-200"
                  >
                    <Phone size={22} />
                    <span className="text-sm font-medium">Appeler</span>
                  </a>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;