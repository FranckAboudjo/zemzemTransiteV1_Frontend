import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: {
      bg: "bg-white",
      border: "border-emerald-100",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      bar: "bg-emerald-500",
      label: "Succès",
    },
    error: {
      bg: "bg-white",
      border: "border-red-100",
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      bar: "bg-red-500",
      label: "Erreur",
    },
    info: {
      bg: "bg-white",
      border: "border-blue-100",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      bar: "bg-blue-500",
      label: "Information",
    },
  };

  const config = styles[type];

  return (
    <div
      className={`fixed top-6 right-6 z-[10000] flex items-center gap-4 p-4 ${config.bg} border ${config.border} rounded-3xl shadow-2xl shadow-slate-200/50 min-w-[320px] animate-in slide-in-from-right-10 duration-300`}
    >
      {/* Barre de progression visuelle */}
      <div
        className={`absolute bottom-0 left-6 right-6 h-1 ${config.bar}  rounded-full`}
      ></div>

      <div className={`p-2.5 ${config.iconBg} ${config.iconColor} rounded-2xl`}>
        {type === "success" ? (
          <CheckCircle2 size={20} />
        ) : (
          <AlertCircle size={20} />
        )}
      </div>

      <div className="flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
          {config.label}
        </p>
        <p className="text-sm font-bold text-slate-700">{message}</p>
      </div>

      <button
        onClick={onClose}
        className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
