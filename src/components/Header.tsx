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
            className="lg:hidden relative w-12 h-12 flex flex-col items-center justify-center group z-20 bg-black/10 backdrop-blur-sm rounded-lg hover:bg-black/20 transition-all duration-500"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className={`absolute block w-6 h-0.5 bg-black transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isMobileMenuOpen ? 'rotate-45' : '-translate-y-2'
            }`}></span>
            <span className={`absolute block w-6 h-0.5 bg-black transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isMobileMenuOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
            }`}></span>
            <span className={`absolute block w-6 h-0.5 bg-black transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isMobileMenuOpen ? '-rotate-45' : 'translate-y-2'
            }`}></span>
          </button>
        </div>

        {/* Navigation Mobile */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isMobileMenuOpen 
            ? 'max-h-screen opacity-100 pb-6' 
            : 'max-h-0 opacity-0 pb-0'
        }`}>
          <div className="bg-white/95 backdrop-blur-md rounded-2xl mt-4 p-6 shadow-2xl border border-harmonie-100/50">
            <nav className="flex flex-col space-y-1">
              <button 
                onClick={() => handleNavigation('accueil')}
                className={`font-accent font-medium text-left py-3 px-4 rounded-xl transition-all duration-300 ${
                  isActivePage('accueil')
                    ? 'bg-harmonie-100 text-black font-bold'
                    : 'text-gray-900 hover:text-gray-700 hover:bg-harmonie-50'
                }`}
              >
                Accueil
              </button>
              <button 
                onClick={() => handleNavigation('prestations')}
                className={`font-accent font-medium text-left py-3 px-4 rounded-xl transition-all duration-300 ${
                  isActivePage('prestations')
                    ? 'bg-harmonie-100 text-black font-bold'
                    : 'text-gray-900 hover:text-gray-700 hover:bg-harmonie-50'
                }`}
              >
                Prestations
              </button>
              <button 
                onClick={() => handleNavigation('portfolio')}
                className={`font-accent font-medium text-left py-3 px-4 rounded-xl transition-all duration-300 ${
                  isActivePage('portfolio')
                    ? 'bg-harmonie-100 text-black font-bold'
                    : 'text-gray-900 hover:text-gray-700 hover:bg-harmonie-50'
                }`}
              >
                Portfolio
              </button>
              <button 
                onClick={() => handleNavigation('about')}
                className={`font-accent font-medium text-left py-3 px-4 rounded-xl transition-all duration-300 ${
                  isActivePage('about')
                    ? 'bg-harmonie-100 text-black font-bold'
                    : 'text-gray-900 hover:text-gray-700 hover:bg-harmonie-50'
                }`}
              >
                À propos
              </button>
              <button 
                onClick={() => handleNavigation('contact')}
                className={`font-accent font-medium text-left py-3 px-4 rounded-xl transition-all duration-300 ${
                  isActivePage('contact')
                    ? 'bg-harmonie-100 text-black font-bold'
                    : 'text-gray-900 hover:text-gray-700 hover:bg-harmonie-50'
                }`}
              >
                Contact
              </button>
              
              {/* Séparateur */}
              <div className="border-t border-harmonie-200 my-4"></div>
              
              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <a 
                    href="https://instagram.com/harmoniecils" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 text-harmonie-600 hover:text-harmonie-800 hover:bg-harmonie-100 rounded-full transition-all duration-300"
                  >
                    <Instagram size={20} />
                  </a>
                  <a 
                    href="tel:0600000000"
                    className="p-3 text-harmonie-600 hover:text-harmonie-800 hover:bg-harmonie-100 rounded-full transition-all duration-300"
                  >
                    <Phone size={20} />
                  </a>
                </div>
                <button 
                  onClick={() => handleNavigation('contact')}
                  className="bg-gradient-to-r from-harmonie-600 to-harmonie-700 text-white px-6 py-3 rounded-full hover:from-harmonie-700 hover:to-harmonie-800 transition-all duration-300 font-accent font-semibold shadow-lg hover:shadow-xl"
                >
                  Réserver
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;