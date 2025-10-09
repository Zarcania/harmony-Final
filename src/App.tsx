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
import AdminLogin from './components/AdminLogin';
import { useAdmin } from './contexts/AdminContext';

const AppContent: React.FC = () => {
  const { isAdmin, setIsAdmin } = useAdmin();
  const [showPopup, setShowPopup] = useState(false);
  const [currentPage, setCurrentPage] = useState('accueil');
  const [preselectedService, setPreselectedService] = useState<string | null>(null);
  const [showPlanning, setShowPlanning] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
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

  const handleNavigate = (page: string, service?: string) => {
    setCurrentPage(page);
    if (service) {
      setPreselectedService(service);
    } else {
      setPreselectedService(null);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token')) {
      setCurrentPage('cancel-booking');
    }
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
        return <AboutPage onNavigate={handleNavigate} />;
      case 'contact':
        return <ContactPage onNavigate={handleNavigate} preselectedService={preselectedService} />;
      case 'cancel-booking':
        return <CancelBookingPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="relative min-h-screen font-body" style={{ paddingTop: isAdmin ? '80px' : '0' }}>
      {isAdmin && <AdminWelcome onDisableAdmin={() => setIsAdmin(false)} onShowPlanning={() => setShowPlanning(true)} onShowAdminPanel={() => setShowAdminPanel(true)} />}
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="relative z-10 pt-20">
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
      {showAdminLogin && (
        <AdminLogin onClose={() => setShowAdminLogin(false)} />
      )}
    </div>
  );
};

function App() {
  return (
    <BookingProvider>
      <AdminProvider>
        <AppContent />
      </AdminProvider>
    </BookingProvider>
  );
}

export default App;