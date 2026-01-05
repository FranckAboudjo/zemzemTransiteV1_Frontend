import React from "react";
import { LogOut, AlertCircle, X } from "lucide-react";

const LogoutModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay - Flou d'arrière-plan */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={32} />
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-2">Déconnexion</h3>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Êtes-vous sûr de vouloir quitter votre session ? Vous devrez vous
            reconnecter pour accéder à Atlantic Transit Manager.
          </p>

          {/* Actions */}
          <div className="flex w-full gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition-all"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogOut size={18} />
                  Quitter
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
