import React, { useState, useEffect } from "react";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import {
  User,
  Wallet,
  FileText,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";

const RetraitClientForm = ({ onClose, onSuccess }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    idClient: "",
    clientName: "",
    clientSolde: 0,
    montant: "",
    modePaiement: "Espèces",
    description: "",
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await API.get(API_PATHS.CLIENTS.GET_ALL_CLIENTS);
        setClients(res.data?.data || []);
      } catch (err) {
        toast.error("Erreur lors de la récupération des clients");
      }
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter((c) =>
    c.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.idClient) {
      return toast.error("Veuillez sélectionner un client.");
    }

    const montantNum = Number(formData.montant);
    if (montantNum <= 0) {
      return toast.error("Le montant doit être supérieur à 0.");
    }

    const userData = JSON.parse(localStorage.getItem("_appTransit_user"));
    const idUser = userData?._id || userData?.id;

    setLoading(true);

    try {
      // Construction de l'URL avec remplacement du paramètre dynamique
      const baseUrl = API_PATHS.RETRAIT_CLIENT.CREATE_RETRAIT_CLIENT;
      const finalUrl = baseUrl.includes(":idClient")
        ? baseUrl.replace(":idClient", formData.idClient)
        : baseUrl.replace(":id", formData.idClient);

      const payload = {
        idClient: formData.idClient,
        idUser: idUser,
        montant: montantNum,
        modePaiement: formData.modePaiement,
        description:
          formData.description || `Retrait client ${formData.clientName}`,
      };

      await API.post(finalUrl, payload);

      // Message de succès personnalisé si le client passe en négatif
      const nouveauSoldeTheorique = formData.clientSolde - montantNum;
      if (nouveauSoldeTheorique < 0) {
        toast.success(
          `Retrait effectué. Nouveau solde : ${nouveauSoldeTheorique} MRU (Découvert)`
        );
      } else {
        toast.success("Retrait enregistré avec succès");
      }

      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Erreur lors du retrait";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      {/* SELECTION CLIENT */}
      <div className="relative">
        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">
          Sélectionner le Client
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
              setFormData({
                ...formData,
                clientName: "",
                idClient: "",
                clientSolde: 0,
              });
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
                      clientSolde: client.solde || 0,
                    });
                    setSearchTerm("");
                    setIsDropdownOpen(false);
                  }}
                  className="px-5 py-3 hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-600 border-b border-slate-50 last:border-none flex justify-between items-center"
                >
                  <div className="flex flex-col">
                    <span>{client.nom}</span>
                    <span
                      className={`text-[9px] ${
                        client.solde < 0 ? "text-red-500" : "text-emerald-500"
                      }`}
                    >
                      Solde : {client.solde?.toLocaleString()} MRU
                    </span>
                  </div>
                  {client.solde < 0 && (
                    <span className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black uppercase">
                      Débiteur
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* MONTANT (Sans limite Max) */}
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
              className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500"
              placeholder="0.00"
            />
          </div>
          <div className="flex items-center gap-1 ml-1 text-blue-500">
            <Info size={12} />
            <p className="text-[9px] font-bold italic">
              Retrait autorisé au-delà du solde.
            </p>
          </div>
        </div>

        {/* MODE PAIEMENT */}
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

      {/* DESCRIPTION */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
          Motif du retrait
        </label>
        <div className="relative">
          <FileText className="absolute left-4 top-4 size-4 text-slate-400" />
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Ex: Avance sur salaire, Prêt exceptionnel..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none"
          />
        </div>
      </div>

      {/* BOUTONS ACTIONS */}
      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase transition-all hover:bg-slate-200"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200"
        >
          {loading ? (
            <Loader2 className="animate-spin size-4" />
          ) : (
            "Valider le Retrait"
          )}
        </button>
      </div>
    </form>
  );
};

export default RetraitClientForm;
