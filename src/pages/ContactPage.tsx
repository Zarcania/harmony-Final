import React from 'react';
import Contact from '../components/Contact';
import SEO from '../components/SEO';

interface ContactPageProps {
  onNavigate: (page: string, service?: string) => void;
  preselectedService?: string | null;
}

const ContactPage: React.FC<ContactPageProps> = ({ onNavigate, preselectedService }) => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Contact"
        description="Questions, devis ou rendez-vous: contactez Harmonie Cils."
        path="/contact"
      />
      <Contact onNavigate={onNavigate} preselectedService={preselectedService} />
    </div>
  );
};

export default ContactPage;