import React from 'react';
import Hero from '../components/Hero';
import PromotionSection from '../components/PromotionSection';
import PortfolioPreview from '../components/PortfolioPreview';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen">
      <Hero onNavigate={onNavigate} />
      <PromotionSection onNavigate={onNavigate} />
      <PortfolioPreview onNavigate={onNavigate} />
    </div>
  );
};

export default HomePage;