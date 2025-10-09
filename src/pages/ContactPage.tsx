import React from 'react';
import Contact from '../components/Contact';

interface ContactPageProps {
  onNavigate: (page: string, service?: string) => void;
  preselectedService?: string | null;
}

const ContactPage: React.FC<ContactPageProps> = ({ onNavigate, preselectedService }) => {
  return (
    <div className="min-h-screen">
      <Contact onNavigate={onNavigate} preselectedService={preselectedService} />
    </div>
  );
};

export default ContactPage;