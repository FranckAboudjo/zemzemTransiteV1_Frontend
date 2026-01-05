import React, { useState, useEffect } from "react";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { User, Wallet, FileText } from "lucide-react";

const RetraitClientForm = ({ onClose, onSuccess }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    idClient: "",
    montant: "",
    modePaiement: "Espèces",
    description: "",
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await API.get(API_PATHS.CLIENT.GET_ALL_CLIENT);
        setClients(res.data?.data || []);
      } catch (err) {
        toast.error("Erreur lors de la récupération des clients");
      }
    };
    fetchClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(formData.montant) <= 0) return toast.error("Montant invalide");

    setLoading(true);
    try {
      const url = API_PATHS.RETRAIT_CLIENT.CREATE_RETRAIT_CLIENT.replace(
        ":id",
        formData.idClient
      );
      await API.post(url, formData);
      toast.success("Retrait effectué avec succès");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors du retrait");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
          Sélectionner le Client
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <select
            required
            value={formData.idClient}
            onChange={(e) =>
              setFormData({ ...formData, idClient: e.target.value })
            }
            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500 appearance-none"
          >
            <option value="">Choisir un client...</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.nom} (Solde: {c.solde?.toLocaleString()} MRU)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
            Montant (MRU)
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
              placeholder="0.00"
              className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
            Mode de Paiement
          </label>
          <select
            value={formData.modePaiement}
            onChange={(e) =>
              setFormData({ ...formData, modePaiement: e.target.value })
            }
            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="Espèces">Espèces</option>
            <option value="Virement">Virement</option>
            <option value="Chèque">Chèque</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
          Description / Motif
        </label>
        <div className="relative">
          <FileText className="absolute left-4 top-4 size-4 text-slate-400" />
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Ex: Retrait pour frais personnels..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
      >
        {loading ? "Traitement..." : "Confirmer le retrait"}
      </button>
    </form>
  );
};

export default RetraitClientForm;
