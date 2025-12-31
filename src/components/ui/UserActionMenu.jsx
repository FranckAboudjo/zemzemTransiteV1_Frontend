import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit2, Trash2, ShieldAlert } from "lucide-react";

const UserActionMenu = ({ onEdit, onDelete, onRestrict }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl py-2 z-50 shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in duration-200">
          <button
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Edit2 size={14} className="text-indigo-500" /> Modifier
          </button>
          <button
            onClick={() => {
              onRestrict();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ShieldAlert size={14} className="text-orange-500" /> Restreindre
          </button>
          <div className="h-px bg-slate-50 my-1 mx-2" />
          <button
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      )}
    </div>
  );
};

export default UserActionMenu;
