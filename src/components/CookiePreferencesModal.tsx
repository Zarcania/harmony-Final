import React, { useEffect, useState } from 'react';
import { useConsentContext } from '../contexts/ConsentContext';

const CookiePreferencesModal: React.FC = () => {
  const { consent, showPreferences, closePreferences, savePreferences } = useConsentContext();
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (showPreferences) {
      setAnalytics(!!consent?.analytics);
      setMarketing(!!consent?.marketing);
    }
  }, [showPreferences, consent]);

  if (!showPreferences) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-neutral-200">
        <div className="p-5 border-b border-neutral-200">
          <h3 className="text-lg font-semibold">Préférences de cookies</h3>
          <p className="mt-1 text-sm text-neutral-600">Vous pouvez modifier vos choix à tout moment. Les cookies indispensables au fonctionnement du site sont toujours actifs.</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <input id="necessary" type="checkbox" checked readOnly className="mt-1" />
            <div>
              <label htmlFor="necessary" className="font-medium">Indispensables</label>
              <p className="text-sm text-neutral-600">Requis pour le fonctionnement du site (sécurité, langue, panier, etc.).</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input id="analytics" type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} className="mt-1" />
            <div>
              <label htmlFor="analytics" className="font-medium">Mesure d'audience</label>
              <p className="text-sm text-neutral-600">Aide à comprendre l'utilisation du site pour l'améliorer. Déposés uniquement avec votre accord.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input id="marketing" type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} className="mt-1" />
            <div>
              <label htmlFor="marketing" className="font-medium">Marketing</label>
              <p className="text-sm text-neutral-600">Permet d'afficher des contenus personnalisés ou des publicités pertinentes.</p>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-neutral-200 flex justify-end gap-3">
          <button onClick={closePreferences} className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-sm">Annuler</button>
          <button onClick={() => savePreferences({ analytics, marketing })} className="px-4 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-sm">Enregistrer</button>
        </div>
      </div>
    </div>
  );
};

export default CookiePreferencesModal;
