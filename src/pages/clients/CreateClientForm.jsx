import React, { useState } from "react";
import {
  Loader2,
  User,
  Phone,
  MapPin,
  Building2,
  UserCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const CreateClientForm = ({ onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    typeClient: "Particulier",
    nom: "",
    contact: "",
    adresse: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.nom.length < 3) {
      return toast.error("Le nom est trop court");
    }

    setIsSubmitting(true);
    try {
      // Appel à l'API
      await API.post(API_PATHS.CLIENTS.CREATE_CLIENT, formData);

      toast.success("Client créé avec succès");

      // C'est ici que la magie opère :
      if (onSuccess) onSuccess();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Erreur de création";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* SÉLECTEUR DE TYPE */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
          Type de Profil
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          {["Particulier", "Entreprise"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({ ...formData, typeClient: type })}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                formData.typeClient === type
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* NOM */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
          Nom / Raison Sociale
        </label>
        <div className="relative">
          <UserCircle
            className="absolute left-4 top-1/2  -translate-y-1/2 text-slate-300"
            size={18}
          />
          <input
            required
            className="w-full pl-12 pr-4 py-3 bg-white border font-black uppercase border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 transition-all"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            placeholder="Ex: Ahmed Salem"
          />
        </div>
      </div>

      {/* CONTACT ET ADRESSE */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
            Contact
          </label>
          <input
            required
            className="w-full px-4 py-3 font-black bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 transition-all"
            value={formData.contact}
            onChange={(e) =>
              setFormData({ ...formData, contact: e.target.value })
            }
            placeholder="Contact"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
            Adresse
          </label>
          <input
            required
            className="w-full px-4 py-3 font-black uppercase bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 transition-all"
            value={formData.adresse}
            onChange={(e) =>
              setFormData({ ...formData, adresse: e.target.value })
            }
            placeholder="Adresse"
          />
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-[2] py-3 bg-[#EF233C] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            "Enregistrer"
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateClientForm;
