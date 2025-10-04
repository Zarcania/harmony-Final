import React, { useState, useEffect } from 'react';
import { AdminProvider } from './contexts/AdminContext';
import { BookingProvider } from './contexts/BookingContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import PrestationsPage from './pages/PrestationsPage';
import PortfolioPage from './pages/PortfolioPage';
import AboutPage from './pages/AboutPage';
import AvisPage from './pages/AvisPage';
import ContactPage from './pages/ContactPage';
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

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'accueil':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'prestations':
        return <PrestationsPage onNavigate={setCurrentPage} />;
      case 'portfolio':
        return <PortfolioPage onNavigate={setCurrentPage} />;
      case 'about':
        return <AboutPage onNavigate={setCurrentPage} />;
      case 'avis':
        return <AvisPage onNavigate={setCurrentPage} />;
      case 'contact':
        return <ContactPage onNavigate={setCurrentPage} />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="relative min-h-screen font-body" style={{ paddingTop: isAdmin ? '80px' : '0' }}>
      {isAdmin && <AdminWelcome onDisableAdmin={() => setIsAdmin(false)} onShowPlanning={() => setShowPlanning(true)} onShowAdminPanel={() => setShowAdminPanel(true)} />}
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="relative z-10 pt-20">
        {renderCurrentPage()}
      </main>
      <Footer onNavigate={setCurrentPage} onAdminToggle={handleAdminToggle} />
      {showPopup && (
        <PromotionPopup onClose={() => setShowPopup(false)} onNavigate={setCurrentPage} />
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