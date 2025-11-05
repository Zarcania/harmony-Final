import React from 'react';
import Hero from '../components/Hero';
import SEO from '../components/SEO';
import PromotionSection from '../components/PromotionSection';
import PortfolioPreview from '../components/PortfolioPreview';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Accueil"
        description="Extensions de cils, épilation au fil et soins haut de gamme à Bordeaux. Réservation en ligne."
        path="/"
      />
      <Hero onNavigate={onNavigate} />
      <PromotionSection onNavigate={onNavigate} />
      <PortfolioPreview onNavigate={onNavigate} />
    </div>
  );
};

export default HomePage;