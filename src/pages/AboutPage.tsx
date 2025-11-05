import React from 'react';
import About from '../components/About';
import SEO from '../components/SEO';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="À propos"
        description="Harmonie Cils: expertise en extensions de cils et épilation au fil. Notre approche et nos valeurs."
        path="/about"
      />
      <About />
    </div>
  );
};

export default AboutPage;