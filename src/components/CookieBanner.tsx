import React from 'react';
import { useConsentContext } from '../contexts/ConsentContext';

const CookieBanner: React.FC = () => {
  const { consent, acceptAll, refuseAll, openPreferences } = useConsentContext();

  if (consent !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-5xl m-4 rounded-2xl shadow-2xl border border-neutral-200/40 bg-white/95 backdrop-blur p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="text-sm text-neutral-700">
            <p className="font-medium text-neutral-900">Gestion des cookies</p>
            <p className="mt-1 leading-relaxed">
              Nous utilisons des cookies pour assurer le bon fonctionnement du site (indispensables), et, avec votre accord, pour mesurer l'audience et améliorer votre expérience. Vous pouvez accepter, refuser, ou personnaliser vos choix à tout moment.
            </p>
          </div>
          <div className="flex-1" />
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button onClick={refuseAll} className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-sm">Tout refuser</button>
            <button onClick={openPreferences} className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-sm">Personnaliser</button>
            <button onClick={acceptAll} className="px-4 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-sm">Tout accepter</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
