import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Calendar, Clock } from 'lucide-react';
// Edge Function approach: call Supabase function endpoint directly

type CancelledBookingInfo = {
  service?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
};

interface CancelBookingPageProps {
  onNavigate: (page: string) => void;
}

const CancelBookingPage: React.FC<CancelBookingPageProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [bookingDetails, setBookingDetails] = useState<CancelledBookingInfo | null>(null);

  useEffect(() => {
    const cancelBooking = async () => {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token') || window.location.hash.replace('#', '');

      if (!token) {
        setStatus('error');
        setMessage('Lien d\'annulation invalide');
        return;
      }

      try {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-booking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ token }),
        });

        const data = await res.json().catch(() => (null));

        if (!res.ok) {
          console.error({ status: res.status, body: data });
          const bodyMsg = (data && (data.error || data.message)) || 'Erreur inconnue';
          setStatus('error');
          setMessage(`${res.status} - ${bodyMsg}`);
          return;
        }

        // Support multiple shapes from the edge function
        const already = Boolean(data?.alreadyCanceled || data?.already_cancelled || data?.already_canceled);
        const success = already || Boolean(data?.ok || data?.success || data?.status === 'ok');

        if (!success) {
          setStatus('error');
          setMessage(data?.message || 'Erreur lors de l\'annulation');
          return;
        }

        setStatus('success');
        setMessage(already ? 'Ce rendez-vous est déjà annulé.' : 'Votre rendez-vous a bien été annulé.');
        setBookingDetails(data?.booking || null);
      } catch (error: unknown) {
        setStatus('error');
        const errMsg = (error as { message?: string })?.message ?? 'Une erreur est survenue';
        setMessage(errMsg);
      }
    };

    cancelBooking();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-harmonie-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {status === 'loading' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-harmonie-600 mx-auto mb-4"></div>
            <h2 className="font-display text-2xl font-bold text-harmonie-800 mb-2">
              Annulation en cours...
            </h2>
            <p className="text-harmonie-600">
              Veuillez patienter pendant que nous traitons votre demande
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-center">
              <CheckCircle size={64} className="text-white mx-auto mb-4" />
              <h2 className="font-display text-3xl font-bold text-white mb-2">
                Annulation confirmée
              </h2>
              <p className="text-white text-lg">
                {message}
              </p>
            </div>

            <div className="p-8">
              {bookingDetails && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-red-900 mb-4 text-lg">
                    Rendez-vous annulé
                  </h3>
                  <div className="space-y-3 text-red-800">
                    <div className="flex items-center gap-3">
                      <Calendar size={20} className="text-red-600" />
                      <div>
                        <span className="font-medium">Service : </span>
                        {bookingDetails.service}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock size={20} className="text-red-600" />
                      <div>
                        <span className="font-medium">Date : </span>
                        {formatDate(bookingDetails.date || '')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock size={20} className="text-red-600" />
                      <div>
                        <span className="font-medium">Heure : </span>
                        {bookingDetails.time || ''}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-green-900 mb-2 text-lg">
                  Envie de reprendre rendez-vous ?
                </h3>
                <p className="text-green-800 mb-4">
                  N'hésitez pas à réserver un nouveau créneau sur notre site web. Nous serons ravis de vous accueillir !
                </p>
                <button
                  onClick={() => onNavigate('contact')}
                  className="w-full bg-harmonie-600 text-white py-3 px-6 rounded-lg hover:bg-harmonie-700 transition-colors font-medium"
                >
                  Prendre un nouveau rendez-vous
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => onNavigate('accueil')}
                  className="text-harmonie-600 hover:text-harmonie-700 transition-colors font-medium"
                >
                  Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-center">
              <AlertCircle size={64} className="text-white mx-auto mb-4" />
              <h2 className="font-display text-3xl font-bold text-white mb-2">
                Erreur d'annulation
              </h2>
            </div>

            <div className="p-8">
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6">
                <p className="text-red-800 text-lg">
                  {message}
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-harmonie-700 text-center">
                  Raisons possibles :
                </p>
                <ul className="text-harmonie-600 space-y-2 text-sm">
                  <li>• Le lien d'annulation a expiré</li>
                  <li>• Le rendez-vous a déjà été annulé</li>
                  <li>• Le lien d'annulation est invalide</li>
                </ul>
              </div>

              <div className="mt-8 text-center space-y-4">
                <p className="text-harmonie-700">
                  Si vous avez besoin d'aide, n'hésitez pas à nous contacter directement.
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => onNavigate('contact')}
                    className="bg-harmonie-600 text-white py-3 px-6 rounded-lg hover:bg-harmonie-700 transition-colors font-medium"
                  >
                    Nous contacter
                  </button>
                  <button
                    onClick={() => onNavigate('accueil')}
                    className="border border-harmonie-300 text-harmonie-700 py-3 px-6 rounded-lg hover:bg-harmonie-50 transition-colors font-medium"
                  >
                    Retour à l'accueil
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CancelBookingPage;
