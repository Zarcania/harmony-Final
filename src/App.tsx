import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AdminProvider } from './contexts/AdminContext';
import { BookingProvider } from './contexts/BookingContext';
import Header from './components/Header';
const HomePage = lazy(() => import('./pages/HomePage'));
const PrestationsPage = lazy(() => import('./pages/PrestationsPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const CancelBookingPage = lazy(() => import('./pages/CancelBookingPage'));
// PromotionPopup retiré sur demande
import Footer from './components/Footer';
import AdminWelcome from './components/AdminWelcome';
const AdminPlanning = lazy(() => import('./components/AdminPlanning'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
// Ancien éditeur de promotions retiré au profit de l'UI consolidée dans le Planning
const AdminLogin = lazy(() => import('./components/AdminLogin'));
import { useAdmin } from './contexts/AdminContext';
import { HttpProvider, ErrorBanner } from './contexts/HttpContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConsentProvider, useConsentContext } from './contexts/ConsentContext';
import CookieBanner from './components/CookieBanner';
import CookiePreferencesModal from './components/CookiePreferencesModal';
import LegalPage from './pages/LegalPage';
import { useSupabaseSession } from './hooks/useSupabaseSession';
import { HelmetProvider } from 'react-helmet-async';

const AppContent: React.FC = () => {
  const { isAdmin, setIsAdmin } = useAdmin();
  const { session } = useSupabaseSession();
  const { openPreferences } = useConsentContext();
  // Plus d'overlay/onglet de promotion à l'entrée
  const [currentPage, setCurrentPage] = useState('accueil');
  const [preselectedService, setPreselectedService] = useState<string | null>(null);
  const [showPlanning, setShowPlanning] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  // Ancien éditeur de promotions retiré
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Suppression de l'ouverture automatique du popup promotionnel

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
      case 'legal':
        return '/mentions-legales';
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
    if (path.startsWith('/mentions-legales')) return 'legal';
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
    // Protection simple: si page admin implicite via isAdmin mais plus de session -> forcer écran de login
    if (!session && isAdmin) {
      return <AdminLogin onClose={() => setShowAdminLogin(false)} />
    }
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
      case 'legal':
        return <LegalPage />;
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
        />
      )}
  <Header currentPage={currentPage} onNavigate={handleNavigate} onAdminOpen={() => setShowAdminLogin(true)} />
      <main className="relative z-10 pt-14 md:pt-20">
        <Suspense fallback={<div className="p-6 text-center text-neutral-600">Chargement…</div>}>
          {renderCurrentPage()}
        </Suspense>
      </main>
  <Footer onNavigate={handleNavigate} onAdminToggle={handleAdminToggle} onOpenCookies={openPreferences} />
      {/* Overlay promotion supprimé */}
      <Suspense fallback={null}>
        {showPlanning && (
          <AdminPlanning onClose={() => setShowPlanning(false)} />
        )}
        {showAdminPanel && (
          <AdminPanel onClose={() => setShowAdminPanel(false)} />
        )}
      </Suspense>
      {/* Ancien éditeur de promotions supprimé */}
      <Suspense fallback={null}>
        {showAdminLogin && (
          <AdminLogin onClose={() => setShowAdminLogin(false)} />
        )}
      </Suspense>
    </div>
  );
};

function App() {
  return (
    <HelmetProvider>
      <HttpProvider>
        <ToastProvider>
          <ConsentProvider>
          <ErrorBanner />
          <BookingProvider>
            <AdminProvider>
              <AppContent />
            </AdminProvider>
          </BookingProvider>
          {/* CNIL cookies */}
          <CookieBanner />
          <CookiePreferencesModal />
          </ConsentProvider>
        </ToastProvider>
      </HttpProvider>
    </HelmetProvider>
  );
}

export default App;