import React from 'react';
import Contact from '../components/Contact';

interface ContactPageProps {
  onNavigate: (page: string) => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen">
      <Contact onNavigate={onNavigate} />
    </div>
  );
};

export default ContactPage;