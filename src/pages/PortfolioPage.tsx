import React from 'react';
import Portfolio from '../components/Portfolio';
import SEO from '../components/SEO';

interface PortfolioPageProps {
  onNavigate: (page: string) => void;
}

const PortfolioPage: React.FC<PortfolioPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Portfolio"
        description="Nos réalisations: extensions de cils, rehaussement et soins esthétiques."
        path="/portfolio"
      />
      <Portfolio onNavigate={onNavigate} />
    </div>
  );
};

export default PortfolioPage;