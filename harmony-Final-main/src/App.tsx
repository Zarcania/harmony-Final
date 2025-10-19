import React, { useState, useEffect } from 'react';
import { AdminProvider } from './contexts/AdminContext';
import { BookingProvider } from './contexts/BookingContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import PrestationsPage from './pages/PrestationsPage';
import PortfolioPage from './pages/PortfolioPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CancelBookingPage from './pages/CancelBookingPage';
import PromotionPopup from './components/PromotionPopup';
import Footer from './components/Footer';
import AdminWelcome from './components/AdminWelcome';
import AdminPlanning from './components/AdminPlanning';
import AdminPanel from './components/admin/AdminPanel';
import PromotionEditor from './components/admin/PromotionEditor';
import AdminLogin from './components/AdminLogin';
import { useAdmin } from './contexts/AdminContext';
import { HttpProvider, ErrorBanner } from './contexts/HttpContext';

const AppContent: React.FC = () => {
  const { isAdmin, setIsAdmin } = useAdmin();
  const [showPopup, setShowPopup] = useState(false);
  const [currentPage, setCurrentPage] = useState('accueil');
  const [preselectedService, setPreselectedService] = useState<string | null>(null);
  const [showPlanning, setShowPlanning] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showPromotionEditor, setShowPromotionEditor] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setShowAdminLogin(true);
    }
  };

  const pageToPath = (page: string) => {
    switch (page) {
      case 'accueil':
        return '/';
      case 'prestations':
        return '/prestations';
      case 'portfolio':
        return '/portfolio';
      case 'about':
        return '/about';
      case 'contact':
        return '/contact';
      case 'cancel-booking':
        return '/cancel-booking';
      default:
        return '/';
    }
  };

  const pathToPage = (path: string): string => {
    if (path === '/' || path === '') return 'accueil';
    if (path.startsWith('/prestations')) return 'prestations';
    if (path.startsWith('/portfolio')) return 'portfolio';
    if (path.startsWith('/about') || path.startsWith('/a-propos')) return 'about';
    if (path.startsWith('/contact')) return 'contact';
    if (path.startsWith('/cancel-booking')) return 'cancel-booking';
    return 'accueil';
  };

  const handleNavigate = (page: string, service?: string) => {
    setCurrentPage(page);
    if (service) {
      setPreselectedService(service);
    } else {
      setPreselectedService(null);
    }

    const newPath = pageToPath(page);
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
    // Optionnel: effacer le hash lors des navigations hors prestations
    if (page !== 'prestations' && window.location.hash) {
      window.history.replaceState(null, '', newPath);
    }
  };

  useEffect(() => {
    // Initial: route par pathname
    const initialPage = pathToPage(window.location.pathname);
    setCurrentPage(initialPage);

    // Cas spécial: token d'annulation => forcer la page cancel-booking
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token')) {
      setCurrentPage('cancel-booking');
    }

    // Gérer back/forward
    const onPopState = () => {
      const page = pathToPage(window.location.pathname);
      setCurrentPage(page);
      // Ne pas changer preselectedService ici
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'accueil':
        return <HomePage onNavigate={handleNavigate} />;
      case 'prestations':
        return <PrestationsPage onNavigate={handleNavigate} />;
      case 'portfolio':
        return <PortfolioPage onNavigate={handleNavigate} />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage onNavigate={handleNavigate} preselectedService={preselectedService} />;
      case 'cancel-booking':
        return <CancelBookingPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className={`relative min-h-screen font-body ${isAdmin ? 'pt-14' : ''}`}>
      {isAdmin && (
        <AdminWelcome
          onDisableAdmin={() => setIsAdmin(false)}
          onShowPlanning={() => setShowPlanning(true)}
          onShowPromotions={() => setShowPromotionEditor(true)}
        />
      )}
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="relative z-10 pt-14 md:pt-20">
        {renderCurrentPage()}
      </main>
      <Footer onNavigate={handleNavigate} onAdminToggle={handleAdminToggle} />
      {showPopup && (
        <PromotionPopup onClose={() => setShowPopup(false)} onNavigate={handleNavigate} />
      )}
      {showPlanning && (
        <AdminPlanning onClose={() => setShowPlanning(false)} />
      )}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}
      {showPromotionEditor && (
        <PromotionEditor onClose={() => setShowPromotionEditor(false)} />
      )}
      {showAdminLogin && (
        <AdminLogin onClose={() => setShowAdminLogin(false)} />
      )}
    </div>
  );
};

function App() {
  return (
    <HttpProvider>
      <ErrorBanner />
      <BookingProvider>
        <AdminProvider>
          <AppContent />
        </AdminProvider>
      </BookingProvider>
    </HttpProvider>
  );
}

export default App;