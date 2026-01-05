import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ChevronRight } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 font-sans">
      {/* Section Icône avec effet Glow */}
      <div className="relative mb-10">
        <div className="absolute -inset-6 bg-red-500/50 rounded-full blur-2xl animate-pulse"></div>
        <div className="relative bg-white border border-red-100 p-6 rounded-full shadow-inner">
          <ShieldAlert size={48} className="text-red-500 stroke-[1.5]" />
        </div>
      </div>

      {/* Texte principal */}
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Oups ! Page introuvable
        </h1>
        <p className="text-slate-400 text-sm font-medium leading-relaxed px-4">
          Nous n'arrivons pas à trouver la page que vous cherchez. Il se peut
          qu'elle ait été supprimée, déplacée ou que l'adresse soit incorrecte.
        </p>
      </div>

      {/* Bouton d'action stylisé */}
      <button
        onClick={() => navigate("/")}
        className="mt-12 group relative flex items-center gap-6 bg-[#0f172a] hover:bg-slate-800 text-white pl-8 pr-2 py-2 rounded-full transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95"
      >
        <span className="text-[11px] font-black uppercase tracking-[0.2em]">
          Retourner à l'accueil
        </span>
        <div className="bg-white rounded-full p-2 text-slate-900 transition-transform duration-300 group-hover:translate-x-1">
          <ChevronRight size={18} strokeWidth={3} />
        </div>
      </button>

      {/* Badge de statut en bas */}
      <div className="mt-16 flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-full border border-slate-100 shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
          Erreur 404 : Page non trouvée
        </span>
      </div>
    </div>
  );
};

export default NotFound;
