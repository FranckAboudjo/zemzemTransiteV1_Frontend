import React, { useState } from "react";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";

const EditRetraitClientForm = ({ retrait, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nouveauMontant: retrait.montant,
    modePaiement: retrait.modePaiement,
    description: retrait.description,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = API_PATHS.RETRAIT_CLIENT.UPDATE_RETRAIT_CLIENT.replace(
        ":id",
        retrait._id
      );
      await API.put(url, formData);
      toast.success("Retrait mis à jour");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Erreur lors de la modification"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400">
          Nouveau Montant
        </label>
        <input
          type="number"
          required
          value={formData.nouveauMontant}
          onChange={(e) =>
            setFormData({ ...formData, nouveauMontant: e.target.value })
          }
          className="w-full px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400">
          Mode de Paiement
        </label>
        <select
          value={formData.modePaiement}
          onChange={(e) =>
            setFormData({ ...formData, modePaiement: e.target.value })
          }
          className="w-full px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Espèces">Espèces</option>
          <option value="Virement">Virement</option>
          <option value="Chèque">Chèque</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase"
        >
          {loading ? "..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
};

export default EditRetraitClientForm;
