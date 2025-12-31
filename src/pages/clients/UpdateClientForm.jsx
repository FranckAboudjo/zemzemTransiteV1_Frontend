import React, { useState, useEffect } from "react";
import { Save, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const UpdateClientForm = ({ client, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    typeClient: "Particulier",
    nom: "",
    contact: "",
    adresse: "",
  });

  // Synchronisation des données quand le client change
  useEffect(() => {
    if (client) {
      setFormData({
        typeClient: client.typeClient || "Particulier",
        nom: client.nom || "",
        contact: client.contact || "",
        adresse: client.adresse || "",
      });
    }
  }, [client]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!client?._id) return;

    setLoading(true);
    try {
      const url = API_PATHS.CLIENTS.UPDATE_CLIENT.replace(":id", client._id);
      await API.patch(url, formData);

      toast.success("Informations mises à jour", { icon: "📝" });
      onSuccess(); // Ferme le modal et rafraîchit la liste
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Erreur lors de la modification"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SECTION TYPE DE CLIENT */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase text-slate-400 ml-1 tracking-wider">
          Type de Partenaire
        </label>
        <div className="grid grid-cols-2 gap-3">
          {["Particulier", "Entreprise"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({ ...formData, typeClient: type })}
              className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                formData.typeClient === type
                  ? "bg-slate-900 border-slate-900 text-white shadow-md"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION NOM */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase text-slate-400 ml-1 tracking-wider">
          Nom Complet / Raison Sociale
        </label>
        <input
          required
          type="text"
          placeholder="Ex: Ahmed Selem"
          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-red-500/5 focus:border-[#EF233C] transition-all"
          value={formData.nom}
          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
        />
      </div>

      {/* SECTION CONTACT ET ADRESSE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase text-slate-400 ml-1 tracking-wider">
            Téléphone / Contact
          </label>
          <input
            required
            type="text"
            placeholder="00 00 00 00"
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-red-500/5 focus:border-[#EF233C] transition-all"
            value={formData.contact}
            onChange={(e) =>
              setFormData({ ...formData, contact: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase text-slate-400 ml-1 tracking-wider">
            Localisation / Adresse
          </label>
          <input
            required
            type="text"
            placeholder="Nouakchott, TVZ..."
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-red-500/5 focus:border-[#EF233C] transition-all"
            value={formData.adresse}
            onChange={(e) =>
              setFormData({ ...formData, adresse: e.target.value })
            }
          />
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          <X size={16} /> Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-[2] px-6 py-4 bg-[#EF233C] hover:bg-[#D90429] text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Save size={18} /> Enregistrer
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default UpdateClientForm;
