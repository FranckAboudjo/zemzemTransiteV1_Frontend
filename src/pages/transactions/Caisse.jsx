import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Users,
  Wallet,
  Calendar,
  Edit2,
  Trash2,
  PieChart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { socket } from "../../utils/socket";
import VersementClientForm from "./VersementClientForm";
import RechargeCaisseForm from "./RechargeCaisseForm";

const Caisse = () => {
  // --- ÉTATS ---
  const [historiqueCaisse, setHistoriqueCaisse] = useState([]);
  const [versementsAgent, setVersementsAgent] = useState([]);
  const [rechargesCaisse, setRechargesCaisse] = useState([]); // Ajouté pour les recharges
  const [balances, setBalances] = useState({ solde: 0, soldeDouane: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // --- FILTRES ---
  const [activeTab, setActiveTab] = useState("historique");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  // --- MODALS ---
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);

  // --- ÉTATS MODALS (EDITION & SUPPRESSION) ---
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editFormData, setEditFormData] = useState({
    montant: "",
    description: "",
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [resCaisse, resDouane, resHist, resAgents, resRecharges] =
        await Promise.all([
          API.get(API_PATHS.GETINFO.GET_INFO_CAISSE),
          API.get(API_PATHS.GETINFO.GET_INFO_CREDIT),
          API.get(API_PATHS.HISTORIQUE.CAISSE),
          API.get(API_PATHS.VERSEMENTAGENT.GET_ALL_VERSEMENT_AGENT),
          API.get(API_PATHS.RECHARGE.GET_ALL_RECHARGE), // Ajouté
        ]);

      setBalances({
        solde: resCaisse.data?.solde || 0,
        soldeDouane: resDouane.data?.montant || 0,
      });
      setHistoriqueCaisse(resHist.data?.data || []);
      setVersementsAgent(resAgents.data?.data || []);
      setRechargesCaisse(resRecharges.data?.data || []); // Ajouté
    } catch (err) {
      toast.error("Erreur de récupération des données");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    socket.on("caisseUpdated", fetchData);
    socket.on("versementAgentUpdated", fetchData);
    socket.on("rechargeCaisseUpdated", fetchData); // Ajouté
    return () => {
      socket.off("caisseUpdated");
      socket.off("versementAgentUpdated");
      socket.off("rechargeCaisseUpdated");
    };
  }, []);

  // --- GESTION ACTIONS (AGENTS & RECHARGES) ---

  const openEditModal = (transaction) => {
    setSelectedTransaction(transaction);
    setEditFormData({
      montant: transaction.montant,
      description: transaction.description,
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const userData = JSON.parse(localStorage.getItem("_appTransit_user"));
      const nomComplet = `${userData?.nom || ""} ${
        userData?.prenoms || ""
      }`.trim();

      const isRecharge = activeTab === "recharges";

      const payload = {
        montant: Number(editFormData.montant),
        description: editFormData.description,
        ...(!isRecharge && {
          typeOperation: selectedTransaction.typeOperation,
          par: nomComplet || "Utilisateur Inconnu",
        }),
      };

      const urlTemplate = isRecharge
        ? API_PATHS.RECHARGE.UPDATE_RECHARGE
        : API_PATHS.VERSEMENTAGENT.UPDATE_VERSEMENT_AGENT;

      const url = urlTemplate.replace(":id", selectedTransaction._id);

      await API.patch(url, payload);

      toast.success("Mise à jour réussie");
      setIsEditOpen(false);
      fetchData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Erreur lors de la modification"
      );
    }
  };

  const handleDelete = async () => {
    try {
      const isRecharge = activeTab === "recharges";
      const urlTemplate = isRecharge
        ? API_PATHS.RECHARGE.DELETE_RECHARGE
        : API_PATHS.VERSEMENTAGENT.DELETE_VERSEMENT_AGENT;

      const url = urlTemplate.replace(":id", selectedTransaction._id);

      await API.delete(url);

      toast.success("Suppression réussie");
      setIsDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Erreur lors de la suppression"
      );
    }
  };

  // --- LOGIQUE DE FILTRAGE & BILAN ---
  const { filteredData, stats } = useMemo(() => {
    let currentDataSource = historiqueCaisse;
    if (activeTab === "agents") currentDataSource = versementsAgent;
    if (activeTab === "recharges") currentDataSource = rechargesCaisse;

    const filtered = currentDataSource.filter((item) => {
      const itemDate = item.date
        ? new Date(item.date).toISOString().split("T")[0]
        : "";
      const matchesSearch =
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.par?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDateDebut = dateDebut ? itemDate >= dateDebut : true;
      const matchesDateFin = dateFin ? itemDate <= dateFin : true;
      return matchesSearch && matchesDateDebut && matchesDateFin;
    });

    // Le bilan se base toujours sur l'historique global pour la cohérence
    const totals = historiqueCaisse.reduce(
      (acc, curr) => {
        const itemDate = curr.date
          ? new Date(curr.date).toISOString().split("T")[0]
          : "";
        const inDateRange =
          (dateDebut ? itemDate >= dateDebut : true) &&
          (dateFin ? itemDate <= dateFin : true);

        if (inDateRange) {
          const amount = Number(curr.montant) || 0;
          const isOut =
            curr.typeOperation === "Debit" || curr.typeOperation === "Retrait";
          if (isOut) acc.debit += amount;
          else acc.credit += amount;
        }
        return acc;
      },
      { debit: 0, credit: 0 }
    );

    return { filteredData: filtered, stats: totals };
  }, [
    activeTab,
    historiqueCaisse,
    versementsAgent,
    rechargesCaisse,
    searchTerm,
    dateDebut,
    dateFin,
  ]);

  if (isLoading)
    return (
      <div className="h-96 flex items-center justify-center animate-spin">
        <div className="size-10 border-4 border-red-500 border-t-transparent rounded-full"></div>
      </div>
    );

  return (
    <div className="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-8 animate-fadeIn">
      {/* HEADER & SOLDES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-slate-400 mb-4">
              <Wallet size={18} />
              <span className="text-xs font-black uppercase tracking-widest">
                Caisse Centrale
              </span>
            </div>
            <h1 className="text-5xl font-black text-green-500">
              {balances.solde?.toLocaleString()}{" "}
              <span className="text-xl text-white">MRU</span>
            </h1>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setIsDepositOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-2xl text-xs font-black uppercase flex items-center gap-2 transition-all"
              >
                <ArrowDownLeft size={16} /> Versement Client
              </button>
              <button
                onClick={() => setIsRechargeOpen(true)}
                className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl text-xs font-black uppercase flex items-center gap-2 transition-all"
              >
                <PlusCircle size={16} /> Recharge Caisse
              </button>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 size-64 bg-red-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Crédit Douane
            </span>
            <h2
              className={`text-3xl font-black mt-2 ${
                balances.soldeDouane < 0 ? "text-red-500" : "text-slate-900"
              }`}
            >
              {balances.soldeDouane?.toLocaleString()}{" "}
              <span className="text-sm">MRU</span>
            </h2>
          </div>
          <div className="text-[10px] font-bold uppercase text-slate-400 border-t pt-4">
            Statut:{" "}
            <span
              className={
                balances.soldeDouane < 0 ? "text-red-500" : "text-emerald-500"
              }
            >
              {balances.soldeDouane < 0 ? "Dette" : "Créditeur"}
            </span>
          </div>
        </div>
      </div>

      {/* FILTRES & TABS */}
      <div className="space-y-6 bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex gap-6 border-b">
            {[
              {
                id: "historique",
                label: "Historique",
                icon: <History size={14} />,
              },
              { id: "agents", label: "Agents", icon: <Users size={14} /> },
              {
                id: "recharges",
                label: "Recharges",
                icon: <PlusCircle size={14} />,
              }, // Ajouté
              { id: "bilan", label: "Bilan", icon: <PieChart size={14} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? "border-b-2 border-red-500 text-slate-900"
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
                className="pl-8 pr-3 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <span className="text-slate-300 text-xs">au</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="pl-8 pr-3 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div className="relative ml-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-2 bg-slate-100 border-none rounded-xl text-[10px] font-bold outline-none w-44 focus:w-64 transition-all"
              />
            </div>
          </div>
        </div>

        {/* CONTENU BILAN (RESTAURÉ) */}
        {activeTab === "bilan" ? (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Solde Initial
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-slate-900">0</span>
                  <span className="text-xs font-bold text-slate-400">MRU</span>
                </div>
                <span className="text-[9px] font-black text-slate-300 uppercase mt-1 block">
                  Report
                </span>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Sorties
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-red-500">
                    {stats.debit.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-red-500">MRU</span>
                </div>
                <span className="text-[9px] font-black text-slate-300 uppercase mt-1 block">
                  Débit (-)
                </span>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Entrées
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-emerald-500">
                    {stats.credit.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-emerald-500">
                    MRU
                  </span>
                </div>
                <span className="text-[9px] font-black text-slate-300 uppercase mt-1 block">
                  Crédit (+)
                </span>
              </div>

              <div className="bg-[#0f172a] p-6 rounded-[2rem] text-white shadow-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Balance Période
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black">
                    {(stats.credit - stats.debit).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold opacity-60">MRU</span>
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase mt-1 block">
                  Résultat
                </span>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full max-h-[500px] overflow-y-auto text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50">
                    <th className="px-8 py-6">Date</th>
                    <th className="px-8 py-6">Désignation</th>
                    <th className="px-8 py-6 text-right">Débit (-)</th>
                    <th className="px-8 py-6 text-right">Crédit (+)</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-bold text-slate-600">
                  <tr className="border-b border-slate-50/50">
                    <td className="px-8 py-5 text-slate-400 uppercase tracking-tighter">
                      Report
                    </td>
                    <td className="px-8 py-5 text-slate-400 uppercase tracking-tighter">
                      Solde antérieur au {dateDebut || "..."}
                    </td>
                    <td className="px-8 py-5 text-right">0</td>
                    <td className="px-8 py-5 text-right">-</td>
                  </tr>
                  {filteredData.map((item, idx) => {
                    const isDebit =
                      item.typeOperation === "Debit" ||
                      item.typeOperation === "Retrait";
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
                  <tr className="bg-[#0f172a] text-white">
                    <td
                      colSpan="2"
                      className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-200"
                    >
                      Total Période
                    </td>
                    <td className="px-8 py-6 text-right text-sm font-black text-red-400">
                      - {stats.debit.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 text-right text-sm font-black text-emerald-400">
                      + {stats.credit.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-150 overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="px-6 py-4">Date & Heure</th>
                  <th className="px-6 py-4">
                    {activeTab === "historique" ? "Description" : "Nom AGENT"}
                  </th>

                  <th className="px-6 py-4">Montant</th>
                  <th className="px-6 py-4">
                    {activeTab === "historique" ? "Catégorie" : "Auteur"}
                  </th>
                  {(activeTab === "agents" || activeTab === "recharges") && (
                    <th className="px-6 py-4 w-20">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map((item, idx) => {
                  const isNegativeStyle =
                    activeTab === "agents" ||
                    item.typeOperation === "Debit" ||
                    item.typeOperation === "Retrait";
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-[11px] font-bold text-slate-900">
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">
                          {new Date(item.date).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-600 max-w-xs">
                        {
                          activeTab === "historique"
                            ? item.description || "Aucune description" // Affiche la description
                            : item.idUser?.nom || "N/A" // Sinon affiche le nom de l'agent
                        }
                      </td>
                      <td
                        className={`px-6 py-4 text-[11px] font-black ${
                          isNegativeStyle ? "text-red-500" : "text-emerald-600"
                        }`}
                      >
                        {isNegativeStyle ? "-" : "+"}{" "}
                        {item.montant?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">
                        {activeTab === "historique"
                          ? item.categorie || "N/A"
                          : item.par || "Système"}
                      </td>
                      {(activeTab === "agents" ||
                        activeTab === "recharges") && (
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(item)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      <Modal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        title="Effectuer un Versement Client"
      >
        <VersementClientForm
          onClose={() => setIsDepositOpen(false)}
          onSuccess={fetchData}
        />
      </Modal>

      <Modal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
        title="Recharge de la Caisse Centrale"
      >
        <RechargeCaisseForm
          onClose={() => setIsRechargeOpen(false)}
          onSuccess={fetchData}
        />
      </Modal>

      {/* MODAL ÉDITION (PARTAGÉ AGENTS / RECHARGES) */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Modifier la transaction"
      >
        <form onSubmit={handleEdit} className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">
              Montant (MRU)
            </label>
            <input
              type="number"
              value={editFormData.montant}
              onChange={(e) =>
                setEditFormData({ ...editFormData, montant: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">
              Description
            </label>
            <textarea
              value={editFormData.description}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  description: e.target.value,
                })
              }
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-100"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL SUPPRESSION (PARTAGÉ AGENTS / RECHARGES) */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Supprimer la transaction"
      >
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl">
            <div className="bg-red-500 p-2 rounded-xl text-white">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-red-800 uppercase">
                Attention !
              </p>
              <p className="text-[11px] text-red-600 font-bold leading-tight">
                Cette action est irréversible. Le montant sera réajusté dans les
                soldes.
              </p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Transaction de
            </p>
            <p className="text-2xl font-black text-slate-900">
              {selectedTransaction?.montant?.toLocaleString()} MRU
            </p>
            <p className="text-[10px] text-slate-400 font-bold italic mt-1">
              "{selectedTransaction?.description}"
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-4 bg-[#EF233C] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#D90429] transition-all shadow-xl shadow-red-100"
            >
              Confirmer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Caisse;
