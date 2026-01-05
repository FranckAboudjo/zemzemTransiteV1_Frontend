import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
// import { logout } from "../context/AuthContext";

const ProfileDropdown = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
      >
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
          {user?.nom?.charAt(0) || "U"}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-slate-700 leading-none">
            {user?.nom}
          </p>
          <p className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">
            {user?.role}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-[100] animate-in fade-in zoom-in duration-200">
          <div className="px-4 py-2 border-b border-slate-50 mb-1">
            <p className="text-xs text-slate-400">Connecté en tant que</p>
            <p className="text-sm font-bold text-slate-900 truncate">
              {user?.role || "Utilisateur"}
            </p>
          </div>

          <button
            onClick={() => {
              navigate("/profile");
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          >
            <User size={18} /> Mon Profil
          </button>

          <button
            onClick={() => {
              navigate("/settings");
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          >
            <Settings size={18} /> Paramètres
          </button>

          <div className="h-px bg-slate-100 my-1 mx-2"></div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
