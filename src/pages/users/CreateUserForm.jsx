import React, { useState } from "react";
import {
  RefreshCw,
  Loader2,
  User,
  Phone,
  Shield,
  UserCircle,
  Key,
} from "lucide-react";

const CreateUserForm = ({ onSubmit, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState({
    nom: "",
    prenoms: "",
    username: "",
    contact: "",
    role: "agent",
    password: "",
  });

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setData({ ...data, password: result });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* SÉLECTEUR DE RÔLE (STYLE ONGLETS) */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">
          Niveau d'Accès
        </label>
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
          {["agent", "superviseur", "admin"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setData({ ...data, role })}
              className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                data.role === role
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* NOM ET PRÉNOMS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">
            Nom
          </label>
          <div className="relative">
            <User
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={16}
            />
            <input
              required
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-[#EF233C] transition-all"
              value={data.nom}
              onChange={(e) =>
                setData({ ...data, nom: e.target.value.toUpperCase() })
              }
              placeholder="NOM"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">
            Prénoms
          </label>
          <input
            required
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#EF233C] transition-all"
            value={data.prenoms}
            onChange={(e) => setData({ ...data, prenoms: e.target.value })}
            placeholder="Prénoms"
          />
        </div>
      </div>

      {/* USERNAME ET CONTACT */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">
            Nom d'utilisateur
          </label>
          <div className="relative">
            <UserCircle
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={16}
            />
            <input
              required
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#EF233C] transition-all"
              value={data.username}
              onChange={(e) => setData({ ...data, username: e.target.value })}
              placeholder="Ex: baya_admin"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">
            Contact
          </label>
          <div className="relative">
            <Phone
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={16}
            />
            <input
              required
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#EF233C] transition-all"
              value={data.contact}
              onChange={(e) => setData({ ...data, contact: e.target.value })}
              placeholder="Numéro"
            />
          </div>
        </div>
      </div>

      {/* MOT DE PASSE AVEC GÉNÉRATEUR */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">
          Sécurité du Compte
        </label>
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Key
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={16}
            />
            <input
              required
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-[#EF233C] transition-all"
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
              placeholder="MOT DE PASSE"
            />
          </div>
          <button
            type="button"
            onClick={generatePassword}
            className="px-4 bg-slate-900 text-white rounded-xl border border-slate-900 hover:bg-slate-800 flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95"
          >
            <RefreshCw
              size={14}
              className={isSubmitting ? "animate-spin" : ""}
            />
            Générer
          </button>
        </div>
      </div>

      {/* BOUTONS D'ACTION */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-[2] py-4 bg-[#EF233C] text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-200 hover:bg-[#D90429] transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            "Enregistrer le collaborateur"
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateUserForm;
