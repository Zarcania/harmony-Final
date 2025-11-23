import React from 'react';
import { ShieldCheck, Cookie, Server, UserRound, Mail, FileText } from 'lucide-react';
import SEO from '../components/SEO';

const LegalPage: React.FC = () => {
  const updatedAt = new Date().toLocaleDateString('fr-FR');
  return (
    <div className="min-h-[70vh]">
      <SEO
        title="Mentions légales et confidentialité"
        description="Mentions légales, politique de confidentialité et gestion des cookies d'Harmonie Cils."
        path="/mentions-legales"
      />
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/marble-texture.jpg')] opacity-10 pointer-events-none" />
        <div className="container mx-auto px-4 pt-12 pb-8">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-500">
              <ShieldCheck size={16} /> Conformité & Transparence
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-display font-bold text-neutral-900">
              Mentions légales • Confidentialité • Cookies
            </h1>
            <p className="mt-3 text-neutral-600 max-w-3xl">
              Vous trouverez ici les informations légales de l’éditeur, notre politique de confidentialité, et la gestion de vos préférences de cookies.
            </p>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-2 gap-6 max-w-5xl">
          {/* Mentions légales */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-neutral-700" size={18} />
              <h2 className="text-lg font-semibold">Mentions légales</h2>
            </div>
            <div className="space-y-2 text-neutral-700">
              <p><span className="font-medium">Éditeur du site</span>: Harmonie Cils</p>
              <p><span className="font-medium">Adresse</span>: 1 Rue des Moissons, 45300 Sermaises</p>
              <p className="flex items-center gap-2"><Mail size={16} className="text-neutral-500" />
                <a href="mailto:castro.oceane@laposte.net" className="hover:underline">castro.oceane@laposte.net</a>
              </p>
              <p><span className="font-medium">Directrice de la publication</span>: CASTRO Océane</p>
              <p className="flex items-center gap-2"><Server size={16} className="text-neutral-500" />
                <span>
                  Hébergement: o2switch (France)
                  {" "}
                  <a href="https://www.o2switch.fr" target="_blank" rel="noreferrer" className="text-neutral-700 hover:underline">www.o2switch.fr</a>
                </span>
              </p>
            </div>
          </div>

          {/* Confidentialité */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <UserRound className="text-neutral-700" size={18} />
              <h2 className="text-lg font-semibold">Politique de confidentialité</h2>
            </div>
            <div className="space-y-3 text-neutral-700">
              <p>
                Nous collectons uniquement les données nécessaires à la gestion des rendez-vous (nom, coordonnées, informations de réservation). Ces données servent à confirmer, modifier ou annuler vos rendez-vous, et à vous contacter en cas de besoin.
              </p>
              <p>
                Vous pouvez demander l'accès, la rectification ou la suppression de vos données à tout moment en nous écrivant à <a className="hover:underline" href="mailto:castro.oceane@laposte.net">castro.oceane@laposte.net</a>. Les données sont conservées pour la durée nécessaire à la prestation et conformément aux obligations légales.
              </p>
            </div>
          </div>

          {/* Cookies */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Cookie className="text-neutral-700" size={18} />
              <h2 className="text-lg font-semibold">Gestion des cookies</h2>
            </div>
            <div className="space-y-3 text-neutral-700">
              <p>
                Les cookies indispensables assurent le fonctionnement du site et ne peuvent pas être désactivés. Les cookies de mesure d'audience et marketing ne sont utilisés qu'avec votre consentement. Vous pouvez modifier vos choix à tout moment via le lien « Gérer mes cookies » en bas de page.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><span className="font-medium">Indispensables</span>: sécurité, navigation, préférences techniques.</li>
                <li><span className="font-medium">Mesure d'audience</span>: comprendre l'utilisation du site pour l'améliorer.</li>
                <li><span className="font-medium">Marketing</span>: proposer du contenu et des offres pertinentes.</li>
              </ul>
            </div>
          </div>

          {/* Droits RGPD */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="text-neutral-700" size={18} />
              <h2 className="text-lg font-semibold">Vos droits</h2>
            </div>
            <div className="space-y-3 text-neutral-700">
              <p>
                Conformément au RGPD, vous disposez des droits d'accès, rectification, effacement, limitation, opposition et portabilité. Pour exercer vos droits, contactez-nous à <a className="hover:underline" href="mailto:castro.oceane@laposte.net">castro.oceane@laposte.net</a>. Vous pouvez également introduire une réclamation auprès de la CNIL.
              </p>
              <p className="text-sm text-neutral-500">Dernière mise à jour: {updatedAt}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LegalPage;
