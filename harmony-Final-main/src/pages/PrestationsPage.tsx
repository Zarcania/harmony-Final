import React from 'react';
import Services from '../components/Services';

interface PrestationsPageProps {
  onNavigate: (page: string) => void;
}

const PrestationsPage: React.FC<PrestationsPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen">
      <Services onNavigate={onNavigate} />
    </div>
  );
};

export default PrestationsPage;