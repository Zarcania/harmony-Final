import React from 'react';
import About from '../components/About';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen">
      <About onNavigate={onNavigate} />
    </div>
  );
};

export default AboutPage;