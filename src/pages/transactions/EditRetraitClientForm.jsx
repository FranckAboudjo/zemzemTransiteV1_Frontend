import React, { useState } from "react";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { User, Loader2 } from "lucide-react"; // Imports ajoutés

const EditRetraitClientForm = ({ retrait, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nouveauMontant: retrait.montant,
    modePaiement: retrait.modePaiement,
    description: retrait.description,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Récupérer l'ID de l'utilisateur connecté pour l'historique
    const userData = JSON.parse(localStorage.getItem("_appTransit_user"));
    const idUser = userData?._id || userData?.id;

    if (!idUser) {
      return toast.error("Session expirée, veuillez vous reconnecter");
    }

    setLoading(true);
    try {
      const url = API_PATHS.RETRAIT_CLIENT.UPDATE_RETRAIT_CLIENT.replace(
        ":id",
        retrait._id
      );

      // 2. Envoyer les données attendues par votre contrôleur (nouveauMontant et idUser)
      await API.patch(url, {
        nouveauMontant: Number(formData.nouveauMontant),
        modePaiement: formData.modePaiement,
        description: formData.description,
        idUser: idUser, // Crucial pour la création de l'historique côté backend
      });

      toast.success("Retrait mis à jour avec succès");
      onSuccess();
      onClose();
    } catch (err) {
      // Afficher l'erreur spécifique du serveur (ex: "Solde insuffisant")
      const errorMsg =
        err.response?.data?.message || "Erreur lors de la modification";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      {/* En-tête informatif */}
      <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100">
        <div className="bg-white p-2 rounded-lg shadow-sm">
          <User size={16} className="text-red-500" />
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Modification Retrait
          </p>
          <p className="text-xs font-bold text-slate-700">
            {retrait?.idClient?.nom || "Client"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
            Nouveau Montant
          </label>
          <input
            type="number"
            required
            min="1"
            value={formData.nouveauMontant}
            onChange={(e) =>
              setFormData({ ...formData, nouveauMontant: e.target.value })
            }
            className="w-full px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
            Mode
          </label>
          <select
            value={formData.modePaiement}
            onChange={(e) =>
              setFormData({ ...formData, modePaiement: e.target.value })
            }
            className="w-full px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500 transition-all"
          >
            <option value="Espèces">Espèces</option>
            <option value="Virement">Virement</option>
            <option value="Chèque">Chèque</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
          Description / Motif de modification
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Pourquoi modifiez-vous ce retrait ?"
          className="w-full px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none transition-all"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin size-4" />
          ) : (
            "Enregistrer les modifications"
          )}
        </button>
      </div>
    </form>
  );
};

export default EditRetraitClientForm;
