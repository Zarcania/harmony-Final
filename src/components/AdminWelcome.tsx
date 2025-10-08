import React from 'react';
import { Crown, Settings, CreditCard as Edit3, LogOut, Calendar, Sparkles } from 'lucide-react';

interface AdminWelcomeProps {
  onDisableAdmin: () => void;
  onShowPlanning: () => void;
  onShowAdminPanel: () => void;
}

const AdminWelcome: React.FC<AdminWelcomeProps> = ({ onDisableAdmin, onShowPlanning, onShowAdminPanel }) => {
  const handleDisableAdmin = () => {
    onDisableAdmin();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed top-20 md:top-28 left-0 right-0 z-40 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl border-b-2 border-yellow-500/50">
      {/* Effet de brillance animé */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse pointer-events-none"></div>

      <div className="container mx-auto px-4 py-3 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Message de bienvenue */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/30 blur-xl rounded-full animate-pulse"></div>
              <div className="relative p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-lg">
                <Crown size={24} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles size={16} className="text-yellow-300 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                Bienvenue Océane ! 👋
              </h3>
              <p className="text-white/70 text-sm font-light">
                Mode Administration • Édition complète activée
              </p>
            </div>
          </div>

          {/* Actions admin */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={onShowAdminPanel}
              className="group relative flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-900 rounded-xl px-5 py-2.5 transition-all duration-300 font-bold text-sm shadow-lg hover:shadow-yellow-500/50 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 opacity-0 group-hover:opacity-100 rounded-xl blur transition-opacity"></div>
              <Edit3 size={18} className="relative z-10" />
              <span className="relative z-10">Gérer le Contenu</span>
            </button>

            <button
              onClick={onShowPlanning}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 transition-all duration-300 font-medium text-sm border border-white/20 hover:border-white/40 hover:scale-105"
            >
              <Calendar size={16} />
              <span className="hidden sm:inline">Planning</span>
            </button>

            <div className="hidden lg:flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-emerald-500/30">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
              <Settings size={16} className="text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Actif</span>
            </div>

            <button
              onClick={handleDisableAdmin}
              className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm rounded-xl px-4 py-2.5 transition-all duration-300 font-medium text-sm border border-red-500/30 hover:border-red-500/50 hover:scale-105 text-red-400 hover:text-red-300"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Désactiver</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barre de progression animée en bas */}
      <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]"></div>
    </div>
  );
};

export default AdminWelcome;