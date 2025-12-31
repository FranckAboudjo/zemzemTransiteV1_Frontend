import React from "react";
import { useNavigate } from "react-router-dom";
import { Construction, ChevronRight, Laptop } from "lucide-react";

const UnderConstruction = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full bg-transparent flex flex-col items-center justify-center p-6 font-sans">
      {/* Section Icône avec effet Glow Indigo */}
      <div className="relative mb-10">
        <div className="absolute -inset-6 bg-indigo-500/50 rounded-full blur-2xl animate-pulse"></div>
        <div className="relative bg-white border border-indigo-100 p-6 rounded-full shadow-inner text-indigo-600">
          <Construction size={48} className="stroke-[1.5]" />
        </div>
      </div>

      {/* Texte principal */}
      <div className="text-center space-y-4 max-w-md ">
        <div className="flex justify-center mb-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-100">
            Work in progress
          </span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Espace en développement
        </h1>
        <p className="text-slate-400 text-sm font-medium leading-relaxed px-4">
          Nous préparons quelque chose d'exceptionnel pour vous. Cette
          fonctionnalité est actuellement en cours de construction par notre
          équipe technique.
        </p>
      </div>

      {/* Bouton d'action style "Pill" */}
      <button
        onClick={() => navigate(-1)}
        className="mt-12 group relative flex items-center gap-6 bg-[#0f172a] hover:bg-slate-800 text-white pl-8 pr-2 py-2 rounded-full transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95"
      >
        <span className="text-[11px] font-black uppercase tracking-[0.2em]">
          Retourner en arrière
        </span>
        <div className="bg-white rounded-full p-2 text-slate-900 transition-transform duration-300 group-hover:-translate-x-1">
          <ChevronRight size={18} strokeWidth={3} className="rotate-180" />
        </div>
      </button>

      {/* Badge de statut technique en bas */}
      <div className="mt-16 flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-full border border-slate-100 shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
          <Laptop size={12} /> Version Beta 1.0 — Déploiement imminent
        </span>
      </div>
    </div>
  );
};

export default UnderConstruction;
