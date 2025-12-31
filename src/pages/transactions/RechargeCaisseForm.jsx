import React, { useState } from "react";
import { DollarSign, AlignLeft, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const RechargeCaisseForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    montant: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation locale simple
    if (!formData.montant || Number(formData.montant) <= 0) {
      return toast.error("Veuillez saisir un montant valide supérieur à 0");
    }

    try {
      setIsSubmitting(true);

      const payload = {
        montant: Number(formData.montant),
        description: formData.description,
      };

      await API.post(API_PATHS.RECHARGE.CREATE_RECHARGE, payload);

      toast.success("Caisse rechargée avec succès !");

      if (onSuccess) onSuccess(); // Rafraîchit les données du parent
      if (onClose) onClose(); // Ferme le modal
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Erreur lors de la recharge de la caisse"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Champ Montant */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
          <DollarSign size={12} className="text-emerald-500" />
          Montant de la recharge (MRU)
        </label>
        <input
          type="number"
          step="any"
          value={formData.montant}
          onChange={(e) =>
            setFormData({ ...formData, montant: e.target.value })
          }
          placeholder="Ex: 50000"
          className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-black outline-none focus:border-emerald-500/20 focus:bg-white transition-all"
          required
        />
      </div>

      {/* Champ Description */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
          <AlignLeft size={12} />
          Description / Motif
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Précisez l'origine des fonds..."
          className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:border-emerald-500/20 focus:bg-white transition-all h-32 resize-none"
          required
        />
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <CheckCircle size={16} /> Confirmer la recharge
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default RechargeCaisseForm;
