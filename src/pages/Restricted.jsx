import React from "react";
import { ShieldAlert, LogOut, MessageCircle, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Restricted = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
        {/* Header avec Icone */}
        <div className="bg-red-500 p-10 flex justify-center relative">
          <div className="absolute top-4 right-6 opacity-20">
            <Lock size={80} className="text-white" />
          </div>
          <div className="bg-white/20 p-6 rounded-full backdrop-blur-sm border border-white/30">
            <ShieldAlert size={48} className="text-white animate-pulse" />
          </div>
        </div>

        {/* Corps du message */}
        <div className="p-8 md:p-10 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">
              Compte Restreint
            </h1>
            <div className="h-1.5 w-16 bg-red-500 mx-auto rounded-full" />
          </div>

          <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">
            Votre accès à la plateforme{" "}
            <span className="text-red-600 font-bold italic">
              ZemZem Transit
            </span>{" "}
            a été suspendu par l'administrateur.
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-4 text-left">
            <div className="bg-red-100 p-2 rounded-lg shrink-0">
              <MessageCircle size={18} className="text-red-600" />
            </div>
            <p className="text-[11px] md:text-xs text-slate-500 leading-tight">
              Si vous pensez qu'il s'agit d'une erreur ou pour régulariser votre
              situation, veuillez contacter directement votre superviseur ou le
              service informatique.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={handleLogout}
              className="group w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-200"
            >
              <LogOut
                size={18}
                className="group-hover:-translate-x-1 transition-transform"
              />
              Se déconnecter
            </button>

            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Identifiant Système:{" "}
              {JSON.parse(localStorage.getItem("_appTransit_user"))?.username ||
                "Session_Error"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 py-4 px-8 flex justify-between items-center">
          <span className="text-[9px] font-black text-slate-400 uppercase">
            Protection Sécurité V2.0
          </span>
          <div className="flex gap-1">
            <div className="size-1.5 rounded-full bg-red-400 opacity-50" />
            <div className="size-1.5 rounded-full bg-red-400 opacity-50" />
            <div className="size-1.5 rounded-full bg-red-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Restricted;
