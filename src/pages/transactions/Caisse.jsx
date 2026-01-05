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
  RefreshCw,
  Printer,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import VersementClientForm from "./VersementClientForm";
import RechargeCaisseForm from "./RechargeCaisseForm";
import EditVersementClientForm from "./EditVersementClientForm";
import { pdf } from "@react-pdf/renderer";
import BordereauVersement from "./BordereauVersement";

const Caisse = () => {
  // --- ÉTATS ---
  const [historiqueCaisse, setHistoriqueCaisse] = useState([]);
  const [versementsAgent, setVersementsAgent] = useState([]);
  const [rechargesCaisse, setRechargesCaisse] = useState([]);
  const [versementsClient, setVersementsClient] = useState([]); // Nouvel état
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [editFormData, setEditFormData] = useState({
    montant: "",
    description: "",
  });

  // --- CHARGEMENT DES DONNÉES ---
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [
        resCaisse,
        resDouane,
        resHist,
        resAgents,
        resRecharges,
        resVClient,
      ] = await Promise.all([
        API.get(API_PATHS.GETINFO.GET_INFO_CAISSE),
        API.get(API_PATHS.GETINFO.GET_INFO_CREDIT),
        API.get(API_PATHS.HISTORIQUE.CAISSE),
        API.get(API_PATHS.VERSEMENTAGENT.GET_ALL_VERSEMENT_AGENT),
        API.get(API_PATHS.RECHARGE.GET_ALL_RECHARGE),
        API.get(API_PATHS.VERSEMENTCLIENT.GET_ALL_VERSEMENT_CLIENT),
      ]);

      setBalances({
        solde: resCaisse.data?.solde || 0,
        soldeDouane: resDouane.data?.montant || 0,
      });
      setHistoriqueCaisse(resHist.data?.data || []);
      setVersementsAgent(resAgents.data?.data || []);
      setRechargesCaisse(resRecharges.data?.data || []);
      setVersementsClient(resVClient.data?.data || []);
    } catch (err) {
      toast.error("Erreur de récupération des données");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- GESTION ACTIONS ---
  const handlePrint = async (item) => {
    try {
      const doc = <BordereauVersement data={item} />;
      const asPdf = pdf([]);
      asPdf.updateContainer(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const openEditModal = (transaction) => {
    setSelectedTransaction(transaction);
    if (activeTab === "versements_client") {
      setIsEditClientOpen(true);
    } else {
      setEditFormData({
        montant: transaction.montant,
        description: transaction.description,
      });
      setIsEditOpen(true);
    }
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
      let urlTemplate = "";
      if (activeTab === "recharges")
        urlTemplate = API_PATHS.RECHARGE.DELETE_RECHARGE;
      else if (activeTab === "agents")
        urlTemplate = API_PATHS.VERSEMENTAGENT.DELETE_VERSEMENT_AGENT;
      else if (activeTab === "versements_client")
        urlTemplate = API_PATHS.VERSEMENTCLIENT.DELETE_VERSEMENT_CLIENT;

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

  // --- LOGIQUE DE FILTRAGE ---
  const { filteredData, stats } = useMemo(() => {
    let currentDataSource = historiqueCaisse;
    if (activeTab === "agents") currentDataSource = versementsAgent;
    if (activeTab === "recharges") currentDataSource = rechargesCaisse;
    if (activeTab === "versements_client") currentDataSource = versementsClient;

    const filtered = currentDataSource.filter((item) => {
      const itemDate = item.date
        ? new Date(item.date).toISOString().split("T")[0]
        : "";
      const matchesSearch =
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.par?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.idClient?.nom?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDateDebut = dateDebut ? itemDate >= dateDebut : true;
      const matchesDateFin = dateFin ? itemDate <= dateFin : true;
      return matchesSearch && matchesDateDebut && matchesDateFin;
    });

    const totals = historiqueCaisse.reduce(
      (acc, curr) => {
        const itemDate = curr.date
          ? new Date(curr.date).toISOString().split("T")[0]
          : "";
        if (
          (dateDebut ? itemDate >= dateDebut : true) &&
          (dateFin ? itemDate <= dateFin : true)
        ) {
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
    versementsClient,
    searchTerm,
    dateDebut,
    dateFin,
  ]);

  if (isLoading)
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4 animate-fadeIn">
        <div className="size-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Synchronisation...
        </p>
      </div>
    );

  return (
    <div className="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-8 animate-fadeIn">
      {/* HEADER & SOLDES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-slate-400 mb-4">
                <Wallet size={18} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Caisse Centrale
                </span>
              </div>
              <button
                onClick={fetchData}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
              >
                <RefreshCw size={16} />
              </button>
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
          <div className="flex gap-6 border-b overflow-x-auto no-scrollbar">
            {[
              {
                id: "historique",
                label: "Historique",
                icon: <History size={14} />,
              },
              { id: "agents", label: "Agents", icon: <Users size={14} /> },
              {
                id: "versements_client",
                label: "Versements Clients",
                icon: <UserCheck size={14} />,
              },
              {
                id: "recharges",
                label: "Recharges",
                icon: <PlusCircle size={14} />,
              },
              { id: "bilan", label: "Bilan", icon: <PieChart size={14} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${
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
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="px-3 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-bold outline-none"
            />
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="px-3 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-bold outline-none"
            />
            <div className="relative">
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

        {activeTab === "bilan" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Total Entrées
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-emerald-500">
                  {stats.credit.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-emerald-500">MRU</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-150 overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="px-6 py-4">Date & Heure</th>
                  <th className="px-6 py-4">
                    {activeTab === "historique"
                      ? "Description"
                      : activeTab === "versements_client"
                      ? "Client"
                      : "Agent"}
                  </th>
                  <th className="px-6 py-4">Montant</th>
                  <th className="px-6 py-4">Auteur / Cat.</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map((item, idx) => {
                  const isDebit =
                    item.typeOperation === "Debit" ||
                    item.typeOperation === "Retrait" ||
                    activeTab === "agents";
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
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-600">
                        {activeTab === "versements_client"
                          ? item.idClient?.nom || "Client"
                          : item.description || item.idUser?.nom || "N/A"}
                      </td>
                      <td
                        className={`px-6 py-4 text-[11px] font-black ${
                          isDebit ? "text-red-500" : "text-emerald-600"
                        }`}
                      >
                        {isDebit ? "-" : "+"} {item.montant?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">
                        {item.par || item.categorie || "Système"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {activeTab === "versements_client" && (
                            <button
                              onClick={() => handlePrint(item)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            >
                              <Printer size={14} />
                            </button>
                          )}
                          {activeTab !== "historique" && (
                            <>
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => openDeleteModal(item)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
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

      <Modal
        isOpen={isEditClientOpen}
        onClose={() => setIsEditClientOpen(false)}
        title="Modifier Versement Client"
      >
        <EditVersementClientForm
          versement={selectedTransaction}
          onClose={() => setIsEditClientOpen(false)}
          onSuccess={fetchData}
        />
      </Modal>

      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Modifier la transaction"
      >
        <form onSubmit={handleEdit} className="p-6 space-y-4">
          <input
            type="number"
            value={editFormData.montant}
            onChange={(e) =>
              setEditFormData({ ...editFormData, montant: e.target.value })
            }
            className="w-full px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <textarea
            value={editFormData.description}
            onChange={(e) =>
              setEditFormData({ ...editFormData, description: e.target.value })
            }
            className="w-full px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
            required
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

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
              <p className="text-[11px] text-red-600 font-bold">
                Cette action est irréversible.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="flex-1 py-4 bg-slate-100 rounded-xl font-black text-[10px] uppercase"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-4 bg-[#EF233C] text-white rounded-xl font-black text-[10px] uppercase"
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
