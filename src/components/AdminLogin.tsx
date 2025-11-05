import React, { useState } from 'react';
import { X, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabase';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface AdminLoginProps {
  onClose: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showReset, setShowReset] = useState(false);
  const { login } = useAdmin();
  // Verrouille le scroll en arrière-plan pendant l'affichage de la modale
  useLockBodyScroll(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  setIsLoading(true);
  setError('');
  setInfo('');

    const result = await login(email, password);

    if (result.ok) {
      onClose();
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      setError(result.message || 'Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.');
    }

    setIsLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      const targetEmail = resetEmail || email;
      if (!targetEmail) {
        setError("Veuillez renseigner un email.");
        return;
      }
      const redirectTo = (typeof window !== 'undefined' ? window.location.origin : '') + '/';
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, { redirectTo });
      if (error) {
        setError(error.message || 'Échec de l\'envoi de l\'email de réinitialisation');
      } else {
        setInfo('Si un compte existe pour cet email, un lien de réinitialisation vient d\'être envoyé.');
        setShowReset(false);
      }
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? 'Erreur inconnue';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative shadow-2xl">
        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          aria-label="Fermer la fenêtre de connexion"
          title="Fermer"
          className="absolute top-4 right-4 p-2 text-harmonie-400 hover:text-harmonie-600 hover:bg-harmonie-50 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-harmonie-600 to-harmonie-700 text-white rounded-full mb-4">
            <Lock size={32} />
          </div>
          <h3 className="font-display text-2xl font-bold text-harmonie-800 mb-2">
            Connexion Admin
          </h3>
          <p className="text-harmonie-600">
            Accédez à l'interface d'administration
          </p>
          {/* Lien vers gestion des comptes retiré */}
        </div>

        {/* Formulaire */}
  {!showReset && (
  <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              {info}
            </div>
          )}

          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-harmonie-700 mb-2">
              Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-harmonie-400" size={20} />
              <input
                type="email"
                id="admin-email"
                name="email"
                autoComplete="username email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 border border-harmonie-200 rounded-xl focus:ring-2 focus:ring-harmonie-500 focus:border-transparent transition-colors"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-harmonie-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-harmonie-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="admin-password"
                name="password"
                autoComplete="current-password"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3 border border-harmonie-200 rounded-xl focus:ring-2 focus:ring-harmonie-500 focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-harmonie-400 hover:text-harmonie-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-harmonie-600 to-harmonie-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-harmonie-700 hover:to-harmonie-800 transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => { setShowReset(true); setInfo(''); setError(''); setResetEmail(email); }}
              className="text-sm text-harmonie-600 hover:text-harmonie-700 underline"
            >
              Mot de passe oublié ?
            </button>
          </div>
        </form>
        )}

        {showReset && (
          <form onSubmit={handleReset} className="space-y-6" autoComplete="on">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            {info && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                {info}
              </div>
            )}

            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-harmonie-700 mb-2">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-harmonie-400" size={20} />
                <input
                  type="email"
                  id="reset-email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-harmonie-200 rounded-xl focus:ring-2 focus:ring-harmonie-500 focus:border-transparent transition-colors"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-harmonie-600 to-harmonie-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-harmonie-700 hover:to-harmonie-800 transition-all duration-300 hover:shadow-lg"
              >
                Envoyer le lien de réinitialisation
              </button>
              <button
                type="button"
                onClick={() => { setShowReset(false); setError(''); setInfo(''); }}
                className="px-4 py-3 rounded-xl border border-harmonie-200 text-harmonie-700 hover:bg-harmonie-50"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-harmonie-500">Accès réservé aux administrateurs autorisés</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;