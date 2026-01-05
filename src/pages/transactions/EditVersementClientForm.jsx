import React, { useState, useEffect } from "react";
import { Wallet, MessageSquare, User, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const EditVersementClientForm = ({ versement, onSuccess, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    montant: versement?.montant || "",
    description: versement?.description || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const url = API_PATHS.VERSEMENTCLIENT.UPDATE_VERSEMENT_CLIENT.replace(
        ":id",
        versement._id
      );

      await API.patch(url, {
        montant: Number(formData.montant),
        description: formData.description,
      });

      toast.success("Versement mis à jour");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Erreur lors de la modification"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100">
        <div className="bg-white p-2 rounded-lg shadow-sm">
          <User size={16} className="text-slate-400" />
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">
            Client
          </p>
          <p className="text-xs font-bold text-slate-700">
            {versement?.idClient?.nom}
          </p>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">
          Nouveau Montant (MRU)
        </label>
        <div className="relative">
          <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="number"
            required
            value={formData.montant}
            onChange={(e) =>
              setFormData({ ...formData, montant: e.target.value })
            }
            className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-[1.2rem] text-xs font-bold outline-none focus:ring-2 focus:ring-[#EF233C] transition-all"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">
          Description
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-4 top-4 size-4 text-slate-400" />
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-[1.2rem] text-xs font-bold outline-none focus:ring-2 focus:ring-[#EF233C] h-24 resize-none transition-all"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2 transition-all"
        >
          {isLoading ? (
            <Loader2 className="animate-spin size-4" />
          ) : (
            <>
              <Save size={14} /> Enregistrer
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default EditVersementClientForm;
