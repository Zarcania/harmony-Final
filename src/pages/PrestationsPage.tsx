import React from 'react';
import Services from '../components/Services';
import SEO from '../components/SEO';

interface PrestationsPageProps {
  onNavigate: (page: string) => void;
}

const PrestationsPage: React.FC<PrestationsPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Prestations"
        description="Découvrez nos prestations: extensions de cils, épilation au fil et soins premium."
        path="/prestations"
      />
      <Services onNavigate={onNavigate} />
    </div>
  );
};

export default PrestationsPage;