import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Composant Modal de base
 * Gère l'overlay, l'animation et le blocage du défilement
 */
const Modal = ({ isOpen, onClose, title, children }) => {
  // Bloque le scroll de la page principale à l'ouverture
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Conteneur de la Modal */}
      <div
        className="bg-white w-full max-w-lg rounded-[32px] border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête de la Modal */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps de la Modal */}
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
