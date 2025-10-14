import React from 'react';
import { Crown, Settings, LogOut, Calendar, Gift } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';

interface AdminWelcomeProps {
  onDisableAdmin: () => void;
  onShowPlanning: () => void;
  onShowPromotions: () => void;
}

const AdminWelcome: React.FC<AdminWelcomeProps> = ({ onDisableAdmin, onShowPlanning, onShowPromotions }) => {
  const { logout } = useAdmin();

  const handleDisableAdmin = async () => {
    await logout();
    onDisableAdmin();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
  <div className="fixed top-14 md:top-20 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl shadow-lg border-b border-rose-200">
      {/* Subtle rose accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-rose-300 to-rose-400"></div>

      <div className="container mx-auto px-2 sm:px-4 py-1 sm:py-3 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Message de bienvenue */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="relative">
              <div className="p-1.5 sm:p-2.5 bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg shadow-sm border border-rose-200">
                <Crown size={16} className="text-rose-600 sm:hidden" />
                <Crown size={20} className="text-rose-600 hidden sm:block" />
              </div>
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-lg font-semibold text-slate-800">
                Bienvenue Océane
              </h3>
              <p className="text-slate-500 text-[10px] sm:text-xs font-light">
                Mode Administration
              </p>
            </div>
          </div>

          {/* Actions admin */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap justify-center">
            <button
              onClick={onShowPlanning}
              className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-lg px-3 py-1.5 sm:px-5 sm:py-2 transition-all duration-300 font-medium text-[13px] sm:text-sm shadow-sm hover:shadow-md hover:scale-105"
            >
              <Calendar size={13} className="sm:hidden" />
              <Calendar size={16} className="hidden sm:block" />
              <span className="">Planning</span>
            </button>

            <button
              onClick={onShowPromotions}
              className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-harmonie-600 to-harmonie-700 hover:from-harmonie-700 hover:to-harmonie-800 text-white rounded-lg px-3 py-1.5 sm:px-5 sm:py-2 transition-all duration-300 font-medium text-[13px] sm:text-sm shadow-sm hover:shadow-md hover:scale-105"
            >
              <Gift size={13} className="sm:hidden" />
              <Gift size={16} className="hidden sm:block" />
              <span>Promotions</span>
            </button>

            <div className="hidden lg:flex items-center gap-2 bg-emerald-50 rounded-lg px-3.5 py-1.5 border border-emerald-200">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <Settings size={14} className="text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">Actif</span>
            </div>

            <button
              onClick={handleDisableAdmin}
              className="flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-red-50 rounded-lg px-2.5 py-1.5 sm:px-4 sm:py-2 transition-all duration-300 font-medium text-[13px] sm:text-sm border border-slate-200 hover:border-red-300 text-slate-600 hover:text-red-600 hover:scale-105"
            >
              <LogOut size={13} className="sm:hidden" />
              <LogOut size={16} className="hidden sm:block" />
              <span className="hidden xs:inline sm:inline">Désactiver</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWelcome;