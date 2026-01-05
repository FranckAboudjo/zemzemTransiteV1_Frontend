import React, { useState } from "react";
import Select from "react-select";
import countries from "world-countries";
import { Package, Hash, Globe, User, FileText } from "lucide-react";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";

const CreateBlForm = ({ clients, onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    numBl: "",
    numDeConteneur: "",
    contenance: "",
    nbrDeConteneur: 1,
    paysDorigine: "",
    typeConteneur: "40",
    numDeclaration: "",
    id_client: "",
  });

  const countryOptions = countries.map((c) => ({
    value: c.name.common,
    label: (
      <div className="flex items-center gap-2">
        <span className="text-lg">{c.flag}</span>
        <span className="text-sm font-medium text-slate-600">
          {c.name.common}
        </span>
      </div>
    ),
  }));

  const clientOptions = clients.map((c) => ({
    value: c._id,
    label: c.nom || c.nomComplet || "Client sans nom",
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss();

    if (!formData.id_client) {
      return toast.error("Veuillez sélectionner un client propriétaire.");
    }

    try {
      setLoading(true);
      await API.post(API_PATHS.BLS.CREATE_BL, formData);
      toast.success("Bon de Lading créé avec succès");
      if (onSuccess) onSuccess();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Erreur lors de la création";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectStyle = {
    control: (base, state) => ({
      ...base,
      borderRadius: "12px",
      padding: "2px 6px",
      backgroundColor: "#f8fafc",
      border: state.isFocused ? "1px solid #EF233C" : "1px solid #f1f5f9",
      boxShadow: "none",
      fontSize: "14px",
      "&:hover": { border: "1px solid #cbd5e1" },
    }),
    placeholder: (base) => ({ ...base, color: "#94a3b8", fontWeight: "500" }),
    menu: (base) => ({
      ...base,
      borderRadius: "12px",
      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
      padding: "4px",
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#EF233C"
        : state.isFocused
        ? "#fff1f2"
        : "transparent",
      color: state.isSelected ? "white" : "#475569",
      borderRadius: "8px",
      margin: "2px 0",
      cursor: "pointer",
    }),
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* SECTION 1 : CLIENT & NUMERO BL (Encadré) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <User size={14} /> Client Propriétaire
            </label>
            <Select
              required
              styles={selectStyle}
              options={clientOptions}
              className="font-bold uppercase"
              onChange={(opt) =>
                setFormData({ ...formData, id_client: opt ? opt.value : "" })
              }
              placeholder="Sélectionner le client..."
              isSearchable
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Hash size={14} /> Numéro de BL
            </label>
            <input
              required
              className="w-full px-4 py-2.5 bg-white border uppercase border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all"
              placeholder="Ex: ATL-2024-001"
              value={formData.numBl}
              onChange={(e) =>
                setFormData({ ...formData, numBl: e.target.value })
              }
            />
          </div>
        </div>

        {/* SECTION 2 : LOGISTIQUE (Grille alignée) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Package size={14} /> N° Conteneur
            </label>
            <input
              required
              className="w-full px-4 py-2.5 bg-slate-50 border uppercase border-slate-100 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-red-500 outline-none transition-all"
              placeholder="MSKU..."
              value={formData.numDeConteneur}
              onChange={(e) =>
                setFormData({ ...formData, numDeConteneur: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              Nombre de Conteneurs
            </label>
            <input
              required
              type="number"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-red-500 outline-none transition-all"
              value={formData.nbrDeConteneur}
              onChange={(e) =>
                setFormData({ ...formData, nbrDeConteneur: e.target.value })
              }
              min="1"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              Format (Pieds)
            </label>
            <div className="relative">
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-red-500 appearance-none"
                value={formData.typeConteneur}
                onChange={(e) =>
                  setFormData({ ...formData, typeConteneur: e.target.value })
                }
              >
                <option value="20">20' (Standard)</option>
                <option value="40">40' (HC/Standard)</option>
                <option value="45">45'</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Hash size={12} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Globe size={14} /> Pays d'Origine
            </label>
            <Select
              styles={selectStyle}
              options={countryOptions}
              onChange={(opt) =>
                setFormData({ ...formData, paysDorigine: opt ? opt.value : "" })
              }
              placeholder="Choisir le pays..."
            />
          </div>
        </div>

        {/* SECTION 3 : DOUANE & CONTENU (Pleine largeur) */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <FileText size={14} /> N° Déclaration Douane
            </label>
            <input
              required
              className="w-full px-4 py-2.5 bg-slate-50 border uppercase border-slate-100 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-red-500 transition-all"
              placeholder="Ex: DEC-2024-X"
              value={formData.numDeclaration}
              onChange={(e) =>
                setFormData({ ...formData, numDeclaration: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              Contenance / Marchandises
            </label>
            <textarea
              rows="3"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-red-500 transition-all resize-none"
              placeholder="Description détaillée du contenu..."
              value={formData.contenance}
              onChange={(e) =>
                setFormData({ ...formData, contenance: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* FOOTER FIXE */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 p-6 border-t border-slate-100 bg-white rounded-b-3xl">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-8 py-2.5 bg-[#EF233C] text-white rounded-xl font-bold text-sm hover:bg-[#D90429] shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          {loading ? (
            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Enregistrer le Dossier"
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateBlForm;
