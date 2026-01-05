import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  Download,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Briefcase,
  Plus,
  Search,
  Box,
  X,
  Scale,
  FileText,
  Edit2,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { PDFDownloadLink } from "@react-pdf/renderer";
import BilanPDF from "./BilanPDF";

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const cleanId = id.split("_")[0];

  // --- ÉTATS DE DONNÉES ---
  const [client, setClient] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [extraServices, setExtraServices] = useState([]);
  const [bls, setBls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- ÉTATS D'INTERFACE ---
  const [activeTab, setActiveTab] = useState("historique");
  const [searchTerm, setSearchTerm] = useState("");

  const initialDateStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )
    .toISOString()
    .split("T")[0];
  const initialDateEnd = new Date().toISOString().split("T")[0];

  const [dateFilters, setDateFilters] = useState({
    historique: { start: initialDateStart, end: initialDateEnd },
    extra: { start: initialDateStart, end: initialDateEnd },
    bilan: { start: initialDateStart, end: initialDateEnd },
  });

  // États Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);

  const [newService, setNewService] = useState({
    description: "",
    montant: "",
    numBl: "",
  });

  // --- CHARGEMENT DES DONNÉES ---
  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Ajout de la requête pour les BL filtrée par idClient
      const [resClient, resTrans, resExtra, resBls] = await Promise.all([
        API.get(API_PATHS.CLIENTS.GET_ONE_CLIENT.replace(":id", cleanId)),
        API.get(
          API_PATHS.HISTORIQUE.CLIENTS_BY_ID.replace(":id_client", cleanId)
        ),
        API.get(
          API_PATHS.FACTURATION.GET_ALL_FACTURATION_BY_CLIENT.replace(
            ":id_client",
            cleanId
          )
        ),
        API.get(`${API_PATHS.BLS.GET_ALL_BL_BY_CLIENT}/${cleanId}`),
      ]);

      setClient(resClient.data.data);
      setTransactions(resTrans.data.data || []);
      const facturesRecues = resExtra.data.data;
      setExtraServices(Array.isArray(facturesRecues) ? facturesRecues : []);
      setBls(resBls.data.data || []);
    } catch (err) {
      toast.error(err.message || "Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [id]);
  // --- LOGIQUE DE FILTRAGE DES BLs ---
  const filteredBLs = (bls || []).filter((bl) => {
    // 1. On vérifie que l'état est exactement "Facturé" (sensible à la casse selon votre image)
    const isFacture = bl.etatBl === "Facturé";

    // 2. On garde la recherche par numéro si elle existe
    const reference = (bl.numBl || bl.numDeBl || "").toLowerCase();
    const matchesSearch = reference.includes(searchTerm.toLowerCase());

    return isFacture && matchesSearch;
  });

  // --- LOGIQUE DE FILTRAGE DES SERVICES EXTRA ---
  const filteredExtra = useMemo(() => {
    const servicesArray = Array.isArray(extraServices) ? extraServices : [];

    // Si searchTerm et dates sont vides, on doit voir toute la liste
    if (!searchTerm && !dateFilters.extra.start && !dateFilters.extra.end) {
      return servicesArray;
    }

    return servicesArray.filter((s) => {
      const sDate = new Date(s.date || s.createdAt);
      const date = new Date(sDate);

      const start = dateFilters.extra.start
        ? new Date(dateFilters.extra.start)
        : null;
      const end = dateFilters.extra.end
        ? new Date(dateFilters.extra.end)
        : null;

      // Normalisation des dates pour la comparaison (00:00:00)
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      const matchesSearch = (s.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesDate = (!start || date >= start) && (!end || date <= end);

      return matchesDate && matchesSearch;
    });
  }, [extraServices, dateFilters.extra, searchTerm]);

  // --- LOGIQUE DU BILAN FINANCIER ---
  const bilanData = useMemo(() => {
    const result = { initial: 0, debit: 0, credit: 0, final: 0 };
    if (!transactions || transactions.length === 0) return result;

    const start = new Date(dateFilters.bilan.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateFilters.bilan.end);
    end.setHours(23, 59, 59, 999);

    let soldeInitial = 0;
    let totalDebit = 0; // Factures (Dette qui augmente)
    let totalCredit = 0; // Versements (Dette qui diminue)

    transactions.forEach((op) => {
      const opDate = new Date(op.date);
      const montant = Number(op.montant) || 0;
      const isCredit = op.typeOperation === "Credit";

      if (opDate < start) {
        // Logique Dette Négative : Débit retire du solde, Crédit en ajoute
        soldeInitial += isCredit ? montant : -montant;
      } else if (opDate >= start && opDate <= end) {
        if (isCredit) totalCredit += montant;
        else totalDebit += montant;
      }
    });

    // CALCUL FINAL :
    // On part du solde initial, on retire les nouveaux débits (factures)
    // et on ajoute les nouveaux crédits (versements)
    const soldeFinal = soldeInitial - totalDebit + totalCredit;

    return {
      initial: soldeInitial,
      debit: totalDebit,
      credit: totalCredit,
      final: soldeFinal,
    };
  }, [transactions, dateFilters.bilan]);

  // --- ACTIONS ---
  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      await API.post(API_PATHS.FACTURATION.CREATE_FACTURATION, {
        description: newService.description,
        montant: Number(newService.montant),
        numBl: newService.numBl || null,
        idClient: cleanId,
      });
      toast.success("Facturation extra créée");
      setIsModalOpen(false);
      setNewService({ description: "", montant: "", numBl: "" });
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la création"
      );
    }
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      await API.patch(
        API_PATHS.FACTURATION.UPDATE_FACTURATION.replace(
          ":id",
          currentService._id
        ),
        {
          description: currentService.description,
          montant: Number(currentService.montant),
        }
      );
      toast.success("Mise à jour effectuée");
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Erreur de mise à jour");
    }
  };

  const handleDeleteService = async () => {
    try {
      await API.delete(
        API_PATHS.FACTURATION.DELETE_FACTURATION.replace(
          ":id",
          currentService._id
        )
      );
      toast.success("Service supprimé");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Erreur de suppression");
    }
  };

  const exportToExcel = (data, title) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Export");
    XLSX.writeFile(workbook, `${title}_${client?.nom}.xlsx`);
    toast.success("Fichier généré !");
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8 animate-fadeIn">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER & CLIENT INFO */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/clients")}
            className="flex items-center gap-2 text-slate-400 hover:text-[#EF233C] font-bold text-xs uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={16} /> Retour
          </button>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-start gap-6">
              <div className="size-20 rounded-3xl bg-slate-900 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                {client?.nom?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black text-slate-900 uppercase">
                    {client?.nom}
                  </h1>
                  {client?.restriction ? (
                    <ShieldAlert className="text-red-500" size={20} />
                  ) : (
                    <ShieldCheck className="text-emerald-500" size={20} />
                  )}
                </div>
                <div className="flex flex-wrap gap-4">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase">
                    <Briefcase size={14} className="text-red-500" />{" "}
                    {client?.typeClient}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase">
                    <MapPin size={14} className="text-red-500" />{" "}
                    {client?.adresse}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 rounded-2xl p-4 min-w-[200px] border border-slate-100 text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                Solde Global
              </p>
              <p
                className={`text-2xl font-black ${
                  client?.solde > 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {client?.solde?.toLocaleString()}{" "}
                <span className="text-sm">MRU</span>
              </p>
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex gap-8 border-b border-slate-200 px-4 overflow-x-auto scrollbar-hide">
          {[
            {
              id: "historique",
              label: "Historique BL",
              icon: <FileText size={14} />,
            },
            { id: "extra", label: "Services Extra", icon: <Plus size={14} /> },
            {
              id: "transactions",
              label: "Transactions",
              icon: <Wallet size={14} />,
            },
            {
              id: "bilan",
              label: "Bilan & Balance",
              icon: <Scale size={14} />,
            },
            { id: "informations", label: "Profil", icon: <Phone size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm("");
              }}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.icon} {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-[#EF233C] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {/* ONGLET HISTORIQUE BL */}
          {activeTab === "historique" && (
            <div className="space-y-4 animate-fadeIn">
              {/* BARRE DE FILTRES */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
                <DateFilter
                  values={dateFilters.historique}
                  onChange={(vals) =>
                    setDateFilters({ ...dateFilters, historique: vals })
                  }
                />
                <div className="relative flex-1 min-w-[200px]">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Rechercher un numéro de BL..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() =>
                    exportToExcel(filteredBLs, `Historique_BL_${client?.nom}`)
                  }
                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-colors"
                >
                  <Download size={14} /> Excel
                </button>
              </div>

              {/* TABLEAU DES BL */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0 z-10">
                    <tr>
                      <th className="px-8 py-4">Référence BL</th>
                      <th className="px-8 py-4">Nbr/Num conteneur</th>
                      <th className="px-8 py-4 text-center">Montant Facturé</th>
                      <th className="px-8 py-4 text-center">Statut</th>
                      <th className="px-8 py-4 text-right">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredBLs.length > 0 ? (
                      filteredBLs.map(
                        (
                          bl // Correction ici : on utilise 'bl'
                        ) => (
                          <tr
                            key={bl._id}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                  {bl.numBl || bl.numDeBl || "SANS RÉF"}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                  <Calendar size={10} />
                                  {new Date(bl.dateCreation).toLocaleDateString(
                                    "fr-FR",
                                    {
                                      day: "2-digit",
                                      month: "long",
                                      year: "numeric",
                                    }
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="inline-flex items-center  text-indigo-600 text-[10px] font-black uppercase">
                                {bl.nbrDeConteneur || 0} CONTENEUR(S)
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                {bl.numDeConteneur}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="text-sm font-black text-[#EF233C]">
                                {new Intl.NumberFormat("fr-FR").format(
                                  bl.montantFacturer || 0
                                )}{" "}
                                MRU
                              </span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              {/* Badge Vert pour Facturé */}
                              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-600 border border-emerald-200">
                                {bl.etatBl}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button
                                onClick={() => navigate(`/bls/${bl._id}`)} // Route simplifiée
                                className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm group-hover:shadow-md"
                              >
                                <ExternalLink size={15} />
                              </button>
                            </td>
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-8 py-20 text-center text-slate-400"
                        >
                          <div className="flex flex-col items-center gap-2 opacity-20">
                            <FileText size={48} />
                            <p className="text-sm font-black uppercase tracking-widest">
                              Aucun BL facturé trouvé
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ONGLET SERVICES EXTRA */}
          {activeTab === "extra" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
                <DateFilter
                  values={dateFilters.extra}
                  onChange={(vals) =>
                    setDateFilters({ ...dateFilters, extra: vals })
                  }
                />
                <div className="relative flex-1 min-w-[200px]">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Rechercher une désignation..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      exportToExcel(filteredExtra, `Extra_${client?.nom}`)
                    }
                    className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"
                  >
                    <Download size={14} /> Excel
                  </button>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#EF233C] transition-all"
                  >
                    <Plus size={16} /> Nouveau
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0">
                    <tr>
                      <th className="px-8 py-4">Description</th>
                      <th className="px-8 py-4">Liaison BL</th>
                      <th className="px-8 py-4">Date</th>
                      <th className="px-8 py-4 text-right">Montant</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredExtra.map((s) => (
                      <tr
                        key={s._id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="px-8 py-5 text-sm font-black text-slate-800 uppercase">
                          {s.description}
                        </td>
                        <td className="px-8 py-5">
                          {s.id_bl ? (
                            <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-[9px] font-black border border-blue-100 uppercase">
                              {s.id_bl.numBl}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 italic uppercase">
                              Général
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-xs text-slate-500 font-bold">
                          {new Date(s.date || s.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-5 text-right font-black text-[#EF233C] text-sm">
                          {Number(s.montant).toLocaleString()} MRU
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                setCurrentService(s);
                                setIsEditModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-blue-600 rounded-lg"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setCurrentService(s);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ONGLET TRANSACTIONS */}
          {activeTab === "transactions" && (
            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="px-8 py-4">Flux</th>
                    <th className="px-8 py-4">Détails</th>
                    <th className="px-8 py-4 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((t) => {
                      const isCredit = t.typeOperation
                        ?.toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .includes("credit");
                      return (
                        <tr key={t._id} className="hover:bg-slate-50/50">
                          <td className="px-8 py-5 flex items-center gap-4">
                            <div
                              className={`p-3 rounded-2xl ${
                                isCredit
                                  ? "bg-emerald-50 text-emerald-500"
                                  : "bg-red-50 text-red-500"
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDownLeft size={18} />
                              ) : (
                                <ArrowUpRight size={18} />
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase">
                                {new Date(t.date).toLocaleDateString()}
                              </p>
                              <p
                                className={`text-[9px] font-bold uppercase ${
                                  isCredit ? "text-emerald-400" : "text-red-400"
                                }`}
                              >
                                {isCredit ? "Crédit" : "Débit"}
                              </p>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-xs font-black text-slate-600 ">
                            {t.description}
                          </td>
                          <td
                            className={`px-8 py-5 text-right text-xs font-black ${
                              isCredit ? "text-emerald-500" : "text-red-500"
                            }`}
                          >
                            {isCredit ? "+" : "-"} {t.montant.toLocaleString()}{" "}
                            MRU
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* ONGLET BILAN & BALANCE */}
          {activeTab === "bilan" && (
            <div className="space-y-6 animate-fadeIn">
              {/* --- BARRE D'ACTIONS --- */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 text-white rounded-lg">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-800">
                      Période du Bilan
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Sélectionnez l'exercice
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex justify-end gap-3">
                  <DateFilter
                    values={dateFilters.bilan}
                    onChange={(vals) =>
                      setDateFilters({ ...dateFilters, bilan: vals })
                    }
                  />
                </div>

                <div className="flex items-center gap-2">
                  {/* BOUTON EXCEL EXISTANT */}
                  <button
                    onClick={() => {
                      const start = new Date(dateFilters.bilan.start);
                      start.setHours(0, 0, 0, 0);
                      const end = new Date(dateFilters.bilan.end);
                      end.setHours(23, 59, 59, 999);

                      const filteredOps = transactions
                        .filter((t) => {
                          const d = new Date(t.date);
                          return d >= start && d <= end;
                        })
                        .sort((a, b) => new Date(a.date) - new Date(b.date));

                      const excelData = [
                        {
                          Date: "---",
                          Désignation: "SOLDE INITIAL (REPORT)",
                          Débit: bilanData.initial,
                          Crédit: 0,
                        },
                        ...filteredOps.map((t) => {
                          const isCredit = t.typeOperation
                            ?.toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .includes("credit");
                          return {
                            Date: new Date(t.date).toLocaleDateString(),
                            Désignation: t.description.toUpperCase(),
                            Débit: !isCredit ? t.montant : 0,
                            Crédit: isCredit ? t.montant : 0,
                          };
                        }),
                        {
                          Date: "---",
                          Désignation: "SOLDE FINAL (BALANCE)",
                          Débit: bilanData.final,
                          Crédit: 0,
                        },
                      ];

                      exportToExcel(
                        excelData,
                        `Bilan_${client?.nom}_${dateFilters.bilan.start}_au_${dateFilters.bilan.end}`
                      );
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Download size={16} />
                    Excel
                  </button>

                  {/* NOUVEAU BOUTON PDF (Style Épuré ZemZem) */}
                  <PDFDownloadLink
                    document={
                      <BilanPDF
                        client={client}
                        period={dateFilters.bilan}
                        bilanSummary={bilanData}
                        data={transactions
                          .filter((t) => {
                            const d = new Date(t.date);
                            const s = new Date(dateFilters.bilan.start);
                            s.setHours(0, 0, 0, 0);
                            const e = new Date(dateFilters.bilan.end);
                            e.setHours(23, 59, 59, 999);
                            return d >= s && d <= e;
                          })
                          .sort((a, b) => new Date(a.date) - new Date(b.date))}
                      />
                    }
                    fileName={`Bilan_${
                      client?.nom
                    }_${new Date().toLocaleDateString()}.pdf`}
                  >
                    {({ loading }) => (
                      <button
                        disabled={loading}
                        className="bg-[#EF233C] hover:bg-[#d91e34] text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-colors shadow-sm"
                      >
                        <FileText size={16} />
                        {loading ? "Calcul..." : "PDF"}
                      </button>
                    )}
                  </PDFDownloadLink>
                </div>
              </div>

              {/* --- CARTES DE RÉSUMÉ --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                  title="Solde Initial"
                  amount={bilanData.initial}
                  sub="Report Antérieur"
                  color="text-slate-600"
                />
                <SummaryCard
                  title="Total Débit"
                  amount={bilanData.debit}
                  sub="Dépenses / Factures"
                  color="text-red-500"
                />
                <SummaryCard
                  title="Total Crédit"
                  amount={bilanData.credit}
                  sub="Versements Recus"
                  color="text-emerald-500"
                />
                <SummaryCard
                  title="Solde Final"
                  amount={bilanData.final}
                  sub="Balance Nette"
                  color="text-white"
                  bg="bg-slate-900"
                />
              </div>

              {/* --- TABLEAU DU BILAN --- */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0 z-10">
                      <tr>
                        <th className="px-8 py-5 border-b border-slate-100">
                          Date
                        </th>
                        <th className="px-8 py-5 border-b border-slate-100">
                          Désignation
                        </th>
                        <th className="px-8 py-5 text-right border-b border-slate-100">
                          Débit (-)
                        </th>
                        <th className="px-8 py-5 text-right border-b border-slate-100">
                          Crédit (+)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {/* LIGNE DE REPORT */}
                      <tr className="bg-slate-50/50 font-bold italic">
                        <td className="px-8 py-4 text-[10px] text-slate-400">
                          ---
                        </td>
                        <td className="px-8 py-4 text-[10px] uppercase text-slate-500 font-black">
                          Solde de report au{" "}
                          {new Date(
                            dateFilters.bilan.start
                          ).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-4 text-right text-slate-500 font-black">
                          {bilanData.initial.toLocaleString()}{" "}
                          <span className="text-[8px]">MRU</span>
                        </td>
                        <td className="px-8 py-4 text-right text-slate-300">
                          -
                        </td>
                      </tr>

                      {/* TRANSACTIONS FILTRÉES */}
                      {transactions
                        .filter((t) => {
                          const d = new Date(t.date);
                          const start = new Date(dateFilters.bilan.start);
                          start.setHours(0, 0, 0, 0);
                          const end = new Date(dateFilters.bilan.end);
                          end.setHours(23, 59, 59, 999);
                          return d >= start && d <= end;
                        })
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((t) => {
                          const isCredit = t.typeOperation
                            ?.toLowerCase()
                            .includes("credit");
                          return (
                            <tr
                              key={t._id}
                              className="hover:bg-slate-50/50 transition-colors group"
                            >
                              <td className="px-8 py-4 text-xs text-slate-500 font-bold">
                                {new Date(t.date).toLocaleDateString()}
                              </td>
                              <td className="px-8 py-4 text-xs font-black text-slate-700 uppercase">
                                {t.description}
                              </td>
                              <td className="px-8 py-4 text-right font-black text-red-500">
                                {!isCredit ? t.montant.toLocaleString() : "-"}
                              </td>
                              <td className="px-8 py-4 text-right font-black text-emerald-500">
                                {isCredit ? t.montant.toLocaleString() : "-"}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                    <tfoot className="bg-slate-900 text-white font-black">
                      <tr>
                        <td
                          colSpan="2"
                          className="px-8 py-5 text-[10px] uppercase tracking-widest"
                        >
                          Balance de la période
                        </td>
                        <td className="px-8 py-5 text-right text-red-400">
                          {bilanData.debit.toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-right text-emerald-400">
                          {bilanData.credit.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ONGLET PROFIL INFOS */}
          {activeTab === "informations" && (
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InfoBlock
                  label="Contact"
                  value={client?.contact}
                  icon={<Phone size={16} />}
                />
                <InfoBlock
                  label="Adresse"
                  value={client?.adresse}
                  icon={<MapPin size={16} />}
                />
                <InfoBlock
                  label="Enregistré le"
                  value={new Date(client?.dateCreation).toLocaleDateString()}
                  icon={<Calendar size={16} />}
                />
                <InfoBlock
                  label="ID Système"
                  value={client?._id}
                  icon={<Wallet size={16} />}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALES DE GESTION (STAY UNCHANGED IN UI) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"
            >
              <X size={24} />
            </button>
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase">
                Nouveau Service
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Facturer un service additionnel
              </p>
            </div>
            <form onSubmit={handleAddService} className="space-y-6">
              <InputBlock
                label="Description"
                placeholder="Ex: Manutention"
                value={newService.description}
                onChange={(v) =>
                  setNewService({ ...newService, description: v })
                }
              />
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                  Lier à un BL (Optionnel)
                </label>
                <select
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-red-500"
                  value={newService.numBl}
                  onChange={(e) =>
                    setNewService({ ...newService, numBl: e.target.value })
                  }
                >
                  <option value="">Aucun BL (Facturation Générale)</option>
                  {client?.bls?.map((bl) => (
                    <option key={bl._id} value={bl.numBl || bl.numDeBl}>
                      {bl.numBl || bl.numDeBl} (
                      {new Date(bl.dateCreation).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <InputBlock
                label="Montant (MRU)"
                type="number"
                placeholder="0.00"
                value={newService.montant}
                onChange={(v) => setNewService({ ...newService, montant: v })}
              />
              <button
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#EF233C] transition-all"
              >
                Confirmer la facturation
              </button>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && currentService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"
            >
              <X size={24} />
            </button>
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase">
                Modifier Service
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Mettre à jour les informations
              </p>
            </div>
            <form onSubmit={handleUpdateService} className="space-y-6">
              <InputBlock
                label="Description"
                value={currentService.description}
                onChange={(v) =>
                  setCurrentService({ ...currentService, description: v })
                }
              />
              <InputBlock
                label="Montant (MRU)"
                type="number"
                value={currentService.montant}
                onChange={(v) =>
                  setCurrentService({ ...currentService, montant: v })
                }
              />
              <button
                type="submit"
                className="w-full py-4 bg-[#EF233C] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-red-100"
              >
                Enregistrer les modifications
              </button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl text-center">
            <div className="size-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase mb-2">
              Supprimer ?
            </h3>
            <p className="text-sm font-bold text-slate-400 mb-8 px-4">
              Voulez-vous supprimer{" "}
              <span className="text-slate-600">
                "{currentService?.description}"
              </span>{" "}
              ?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteService}
                className="flex-1 py-4 bg-[#EF233C] text-white rounded-2xl text-[11px] font-black uppercase shadow-lg shadow-red-200"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SOUS-COMPOSANTS ---
const DateFilter = ({ values, onChange }) => (
  <div className="flex gap-4 items-center">
    <div className="space-y-1">
      <label className="text-[8px] font-black uppercase text-slate-400 ml-2">
        Du
      </label>
      <input
        type="date"
        className="block px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
        value={values.start}
        onChange={(e) => onChange({ ...values, start: e.target.value })}
      />
    </div>
    <div className="space-y-1">
      <label className="text-[8px] font-black uppercase text-slate-400 ml-2">
        Au
      </label>
      <input
        type="date"
        className="block px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
        value={values.end}
        onChange={(e) => onChange({ ...values, end: e.target.value })}
      />
    </div>
  </div>
);

const InputBlock = ({ label, type = "text", value, onChange, placeholder }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
      {label}
    </label>
    <input
      required
      type={type}
      placeholder={placeholder}
      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const SummaryCard = ({ title, amount, sub, color, bg = "bg-white" }) => (
  <div className={`${bg} p-6 rounded-[2rem] border border-slate-100 shadow-sm`}>
    <p
      className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
        bg === "bg-slate-900" ? "text-slate-400" : "text-slate-400"
      }`}
    >
      {title}
    </p>
    <p className={`text-xl font-black ${color}`}>
      {amount?.toLocaleString()} <span className="text-[10px]">MRU</span>
    </p>
    <p
      className={`text-[9px] font-bold mt-1 uppercase ${
        bg === "bg-slate-900" ? "text-slate-500" : "text-slate-300"
      }`}
    >
      {sub}
    </p>
  </div>
);

const InfoBlock = ({ label, value, icon }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 text-[#EF233C]">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
    </div>
    <p className="text-sm font-bold text-slate-800 ml-6">
      {value || "Non spécifié"}
    </p>
  </div>
);

const LoadingState = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
    <div className="size-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-xs font-black uppercase text-slate-400 tracking-widest">
      Chargement du dossier...
    </p>
  </div>
);

export default ClientDetails;
