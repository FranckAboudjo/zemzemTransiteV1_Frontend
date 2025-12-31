import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  PlusCircle,
  History,
  ShieldCheck,
  Calendar,
  PieChart,
  FileText,
  CreditCard,
  Container,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useAuth } from "../../context/AuthContext"; // Import du contexte
import { socket } from "../../utils/socket";

const Douane = () => {
  // --- ÉTATS ---
  const { user } = useAuth(); // Récupération de l'utilisateur connecté
  const [historiqueDouane, setHistoriqueDouane] = useState([]);
  const [balanceDouane, setBalanceDouane] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [remboursements, setRemboursements] = useState([]);

  // --- FILTRES & TABS ---
  const [activeTab, setActiveTab] = useState("historique");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  // --- MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ montant: "", description: "" });

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Appel des APIs : Solde, Historique complet et Remboursements
      const [resBalance, resHist, resRemb] = await Promise.all([
        API.get(API_PATHS.GETINFO.GET_INFO_CREDIT),
        API.get(API_PATHS.HISTORIQUE.DOUANE),
        API.get(API_PATHS.REMBOURSEMENTDOUANE.GET_ALL_REMBOURSEMENT_DOUANE),
      ]);

      setBalanceDouane(resBalance.data?.montant || 0);
      setRemboursements(resRemb.data?.data || resRemb.data || []);
      setHistoriqueDouane(resHist.data?.data || resHist.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erreur de récupération des données");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    socket.on("douaneUpdated", fetchData);
    socket.on("remboursementUpdated", fetchData); // Optionnel si votre backend émet ce signal
    return () => {
      socket.off("douaneUpdated");
      socket.off("remboursementUpdated");
    };
  }, []);

  // --- LOGIQUE DE FILTRAGE ---
  const { filteredData, stats } = useMemo(() => {
    const dataToFilter =
      activeTab === "transactions" ? remboursements : historiqueDouane;

    const filtered = dataToFilter.filter((item) => {
      const itemDate =
        item.date || item.createdAt
          ? new Date(item.date || item.createdAt).toISOString().split("T")[0]
          : "";

      // Filtrage par Onglet spécifique (pour l'historique général)
      if (
        activeTab === "bl-liquides" &&
        (item.typeOperation !== "Debit" || !item.id_bl)
      )
        return false;

      const matchesSearch =
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.numLiquidation?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDateDebut = dateDebut ? itemDate >= dateDebut : true;
      const matchesDateFin = dateFin ? itemDate <= dateFin : true;

      return matchesSearch && matchesDateDebut && matchesDateFin;
    });

    const totals = filtered.reduce(
      (acc, curr) => {
        const amt = Number(curr.montant) || 0;
        curr.typeOperation === "Debit"
          ? (acc.debit += amt)
          : (acc.credit += amt);
        return acc;
      },
      { debit: 0, credit: 0 }
    );

    return { filteredData: filtered, stats: totals };
  }, [
    historiqueDouane,
    remboursements,
    searchTerm,
    dateDebut,
    dateFin,
    activeTab,
  ]);

  const handleRemboursement = async (e) => {
    e.preventDefault();
    if (!user?._id) return toast.error("Session utilisateur introuvable");

    try {
      await API.post(
        API_PATHS.REMBOURSEMENTDOUANE.CREATE_REMBOURSEMENT_DOUANE,
        {
          montant: Number(formData.montant),
          description: formData.description,
          userId: user._id,
        }
      );

      toast.success("Remboursement enregistré avec succès");
      setIsModalOpen(false);
      setFormData({ montant: "", description: "" });
      fetchData();
    } catch (error) {
      toast.error(error.message || "Erreur lors du remboursement");
    }
  };

  if (isLoading)
    return (
      <div className="h-96 flex items-center justify-center animate-spin">
        <div className="size-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );

  return (
    <div className="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-8 animate-fadeIn">
      {/* HEADER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-slate-400 mb-4">
                <ShieldCheck size={18} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Compte Crédit Douane
                </span>
              </div>
              <h1
                className={`text-5xl font-black ${
                  balanceDouane < 0 ? "text-red-500" : "text-blue-400"
                }`}
              >
                {balanceDouane?.toLocaleString()}{" "}
                <span className="text-xl text-white">MRU</span>
              </h1>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
            >
              <PlusCircle size={18} /> Remboursement
            </button>
          </div>
        </div>
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
          <FileText className="text-blue-600 mb-4" size={32} />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Opérations
          </span>
          <p className="text-[11px] text-slate-500 font-bold mt-2">
            Gestion des taxes et remboursements
          </p>
        </div>
      </div>

      {/* TABS & FILTRES */}
      <div className="space-y-6 bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex gap-6 border-b overflow-x-auto min-w-max">
            {[
              {
                id: "historique",
                label: "Historique",
                icon: <History size={14} />,
              },
              {
                id: "transactions",
                label: "Transactions (Remb.)",
                icon: <CreditCard size={14} />,
              },
              {
                id: "bl-liquides",
                label: "BL Liquidés",
                icon: <Container size={14} />,
              },
              { id: "bilan", label: "Bilan", icon: <PieChart size={14} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? "border-b-2 border-blue-600 text-slate-900"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="pl-8 pr-3 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-bold outline-none"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-2 bg-slate-100 border-none rounded-xl text-[10px] font-bold outline-none w-44 focus:w-60 transition-all"
              />
            </div>
          </div>
        </div>

        {activeTab === "bilan" ? (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Payé
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-red-500">
                    {stats.debit.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-red-500">MRU</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Rechargé
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-emerald-500">
                    {stats.credit.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-emerald-500">
                    MRU
                  </span>
                </div>
              </div>

              <div className="bg-[#0f172a] p-6 rounded-[2rem] text-white shadow-xl lg:col-span-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Balance de la période
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black">
                    {(stats.credit - stats.debit).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold opacity-60">MRU</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50">
                    <th className="px-8 py-6">Date</th>
                    <th className="px-8 py-6">Libellé / Dossier</th>
                    <th className="px-8 py-6 text-right">Débit (-)</th>
                    <th className="px-8 py-6 text-right">Crédit (+)</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-bold text-slate-600">
                  {filteredData.map((item, idx) => {
                    const isDebit = item.typeOperation === "Debit";
                    return (
                      <tr
                        key={idx}
                        className="border-b border-slate-50/50 hover:bg-slate-50/30 transition-colors"
                      >
                        <td className="px-8 py-4 text-slate-400">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-4 uppercase text-slate-700">
                          {item.description}
                        </td>
                        <td className="px-8 py-4 text-right font-black text-red-500">
                          {isDebit ? item.montant?.toLocaleString() : "-"}
                        </td>
                        <td className="px-8 py-4 text-right font-black text-emerald-600">
                          {!isDebit ? item.montant?.toLocaleString() : "-"}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-900 text-white font-black uppercase tracking-widest text-[10px]">
                    <td colSpan="2" className="px-8 py-6">
                      Cumul Période
                    </td>
                    <td className="px-8 py-6 text-right text-red-400">
                      - {stats.debit.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 text-right text-emerald-400">
                      + {stats.credit.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest sticky top-0 z-10">
                  <th className="px-6 py-4">Date & Heure</th>
                  <th className="px-6 py-4">Libellé</th>
                  <th className="px-6 py-4">Montant</th>
                  <th className="px-6 py-4 text-right">Solde Après</th>
                  <th className="px-6 py-4 text-center">Effectué par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-[11px] font-bold text-slate-900">
                        {new Date(
                          item.date || item.createdAt
                        ).toLocaleDateString()}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium">
                        {new Date(
                          item.date || item.createdAt
                        ).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[11px] font-bold text-slate-600 uppercase">
                        {item.description}
                      </div>
                      {item.numLiquidation &&
                        item.numLiquidation !== "non renseigné" && (
                          <div className="text-[9px] text-blue-500 font-black">
                            LIQ: {item.numLiquidation}
                          </div>
                        )}
                    </td>
                    <td
                      className={`px-6 py-4 text-[11px] font-black ${
                        item.typeOperation === "Debit"
                          ? "text-red-500"
                          : "text-emerald-600"
                      }`}
                    >
                      {item.typeOperation === "Debit" ? "-" : "+"}{" "}
                      {item.montant?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-[11px] font-bold text-slate-500">
                      {item.soldeApres?.toLocaleString()} MRU
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase">
                        {item.userId?.nom || "Admin"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL REMBOURSEMENT */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau Remboursement Douane"
      >
        <form onSubmit={handleRemboursement} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
              Montant à recharger
            </label>
            <input
              required
              type="number"
              placeholder="0.00"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.montant}
              onChange={(e) =>
                setFormData({ ...formData, montant: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
              Justification / Description
            </label>
            <textarea
              required
              placeholder="Ex: Remboursement suite à annulation..."
              className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Confirmer l'opération
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Douane;
