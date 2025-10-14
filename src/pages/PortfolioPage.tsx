import React from 'react';
import Portfolio from '../components/Portfolio';

interface PortfolioPageProps {
  onNavigate: (page: string) => void;
}

const PortfolioPage: React.FC<PortfolioPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen">
      <Portfolio onNavigate={onNavigate} />
    </div>
  );
};

export default PortfolioPage;