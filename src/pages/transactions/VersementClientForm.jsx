import React, { useState, useEffect } from "react";
import { Search, Wallet, MessageSquare, User, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const VersementClientForm = ({ onSuccess, onClose }) => {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    idClient: "",
    clientName: "",
    montant: "",
    description: "",
  });

  // Charger les clients pour le select
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await API.get(API_PATHS.CLIENTS.GET_ALL_CLIENTS);
        setClients(res.data?.data || []);
      } catch (err) {
        toast.error(err.message || "Erreur lors du chargement des clients");
      }
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter((c) =>
    c.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.idClient) return toast.error("Veuillez choisir un client");

    // Récupération de l'utilisateur connecté pour l'ID (req.params.idUser)
    const userData = JSON.parse(localStorage.getItem("_appTransit_user"));
    const idUser = userData?._id || userData?.id;

    if (!idUser)
      return toast.error("Session expirée. Veuillez vous reconnecter.");

    try {
      setIsLoading(true);

      // Adaptation à ton API PATH : "/versements-client/add/:idUser"
      // On remplace :idUser par l'ID réel
      const url = API_PATHS.VERSEMENTCLIENT.CREATE_VERSEMENT_CLIENT.replace(
        ":idUser",
        idUser
      );

      const payload = {
        idClient: formData.idClient,
        montant: Number(formData.montant),
        description:
          formData.description || `Versement du client ${formData.clientName}`,
      };

      await API.post(url, payload);

      toast.success("Versement enregistré avec succès");
      onSuccess(); // Rafraîchit l'historique de la caisse
      onClose(); // Ferme le modal
    } catch (err) {
      toast.error(err.message || "Erreur lors du versement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      {/* SELECTION CLIENT */}
      <div className="relative">
        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">
          Client
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={formData.clientName || searchTerm}
            onFocus={() => setIsDropdownOpen(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setFormData({ ...formData, clientName: "", idClient: "" });
              setIsDropdownOpen(true);
            }}
            className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-[1.2rem] text-xs font-bold outline-none focus:ring-2 focus:ring-red-500 transition-all"
          />

          {isDropdownOpen && filteredClients.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
              {filteredClients.map((client) => (
                <div
                  key={client._id}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      idClient: client._id,
                      clientName: client.nom,
                    });
                    setSearchTerm("");
                    setIsDropdownOpen(false);
                  }}
                  className="px-5 py-3 hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-600 border-b border-slate-50 last:border-none flex justify-between items-center"
                >
                  <span>{client.nom}</span>
                  <span className="text-[9px] bg-slate-100 px-2 py-1 rounded text-slate-400 font-black">
                    ID: {client._id.slice(-5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MONTANT */}
      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">
          Montant (MRU)
        </label>
        <div className="relative">
          <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="number"
            required
            min="1"
            placeholder="0.00"
            value={formData.montant}
            onChange={(e) =>
              setFormData({ ...formData, montant: e.target.value })
            }
            className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-[1.2rem] text-xs font-bold outline-none focus:ring-2 focus:ring-red-500 transition-all"
          />
        </div>
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">
          Description
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-4 top-4 size-4 text-slate-400" />
          <textarea
            placeholder="Note sur le versement..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-[1.2rem] text-xs font-bold outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none transition-all"
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
          className="flex-1 py-4 bg-[#EF233C] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#D90429] shadow-lg shadow-red-100 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="animate-spin size-4" />
          ) : (
            "Valider le Versement"
          )}
        </button>
      </div>
    </form>
  );
};

export default VersementClientForm;
