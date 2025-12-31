import React from "react";
import { ShieldAlert, RefreshCcw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ErrorState = ({ error, onRetry }) => {
  const navigate = useNavigate();
  // On vérifie si c'est un 403 (Forbidden) ou un problème réseau (pas de status)
  const isForbidden = error?.status === 403 || error?.response?.status === 403;

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8 bg-white rounded-[2.5rem] border border-dashed border-slate-200 animate-in fade-in zoom-in-95 duration-500">
      {/* Section Icone avec effet Pulse */}
      <div className="relative">
        <div
          className={`absolute -inset-4 rounded-full blur-2xl opacity-20 animate-pulse ${
            isForbidden ? "bg-amber-500" : "bg-red-500"
          }`}
        ></div>

        <div
          className={`relative p-6 rounded-full border-2 shadow-inner transition-colors duration-500 ${
            isForbidden
              ? "bg-amber-50 text-amber-600 border-amber-100"
              : "bg-red-50 text-red-500 border-red-100"
          }`}
        >
          <ShieldAlert size={54} strokeWidth={1.2} />
        </div>
      </div>

      {/* Texte */}
      <div className="text-center mt-8 space-y-3">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
          {isForbidden ? "Accès Restreint" : "Connexion impossible"}
        </h3>
        <p className="text-[11px] text-slate-400 font-bold max-w-[320px] leading-relaxed uppercase tracking-wide">
          {isForbidden
            ? "Vous n'avez pas les autorisations nécessaires pour accéder à ces données."
            : "Le serveur est injoignable. Vérifiez votre connexion internet ou réessayez."}
        </p>
      </div>

      {/* Boutons d'action */}
      <div className="mt-10">
        {!isForbidden ? (
          <button
            onClick={onRetry}
            className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 transition-all active:scale-95 shadow-xl"
          >
            <RefreshCcw size={14} /> Réessayer la connexion
          </button>
        ) : (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 px-10 py-4 bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-700 transition-all active:scale-95 shadow-xl"
          >
            <ArrowLeft size={14} /> Retour
          </button>
        )}
      </div>

      {/* Badge de statut en bas */}
      <div className="mt-8 flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
        <span className="flex h-2 w-2 relative">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isForbidden ? "bg-amber-400" : "bg-red-400"
            }`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isForbidden ? "bg-amber-500" : "bg-red-500"
            }`}
          ></span>
        </span>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          {isForbidden
            ? "Status 403 : Restreint"
            : "Erreur : Serveur hors ligne"}
        </span>
      </div>
    </div>
  );
};

export default ErrorState;
