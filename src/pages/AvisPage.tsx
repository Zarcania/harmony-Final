import React from 'react';
import Reviews from '../components/Reviews';

interface AvisPageProps {
  onNavigate: (page: string) => void;
}

const AvisPage: React.FC<AvisPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen">
      <Reviews onNavigate={onNavigate} />
    </div>
  );
};

export default AvisPage;