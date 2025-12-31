import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Edit2,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { socket } from "../../utils/socket";

import CreateBlForm from "./CreateBlForm";
import UpdateBlForm from "./UpdateBlForm";

const AllBLs = () => {
  const navigate = useNavigate();
  const [bls, setBls] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // On récupère la chaîne JSON
  const userDataRaw = localStorage.getItem("_appTransit_user");
  // On analyse la chaîne seulement si elle existe pour éviter les erreurs
  const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
  // Extraction sécurisée du rôle
  const userRole = userData?.role; // 'admin', 'superviseur', etc.
  const isAdmin = userRole === "admin";
  const isSuperviseur = userRole === "superviseur";

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBL, setSelectedBL] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [resBL, resClients] = await Promise.all([
        API.get(API_PATHS.BLS.GET_ALL_BL),
        API.get(API_PATHS.CLIENTS.GET_ALL_CLIENTS),
      ]);
      setBls(resBL.data.data || []);
      setClients(resClients.data.data || []);
    } catch (err) {
      toast.error(err.message || "Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    socket.on("blCreated", (newBl) => {
      setBls((prev) => [newBl, ...prev]);
      toast.success(`Nouveau BL ${newBl.numBl} ajouté`, { icon: "🚢" });
    });

    socket.on("blUpdated", (updatedBl) => {
      setBls((prev) =>
        prev.map((bl) => (bl._id === updatedBl._id ? updatedBl : bl))
      );
    });

    socket.on("blDeleted", (blId) => {
      setBls((prev) => prev.filter((bl) => bl._id !== blId));
    });

    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener("click", handleClickOutside);

    return () => {
      socket.off("blCreated");
      socket.off("blUpdated");
      socket.off("blDeleted");
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleConfirmDelete = async () => {
    if (!selectedBL) return;
    try {
      await API.delete(`${API_PATHS.BLS.DELETE_BL}/${selectedBL._id}`);
      toast.success("Dossier supprimé avec succès");
      setIsDeleteOpen(false);
      setSelectedBL(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Erreur lors de la suppression");
    }
  };

  // --- NOUVEAUX ONGLETS FILTRÉS PAR RÔLE ---
  const availableTabs = useMemo(() => {
    const tabs = ["tous", "En attente", "En cours"];
    if (isAdmin || isSuperviseur) tabs.push("A validé");
    if (isAdmin) tabs.push("Facturé");
    return tabs;
  }, [isAdmin, isSuperviseur]);

  const filteredBLs = useMemo(() => {
    return bls.filter((bl) => {
      const status = bl.etatBl?.trim();

      // 1. Règle de visibilité stricte (Sécurité de l'affichage)
      if (status === "A validé" && !isAdmin && !isSuperviseur) return false;
      if (status === "Facturé" && !isAdmin) return false;

      // 2. Filtre par recherche textuelle
      const searchString = searchTerm.toLowerCase();
      const matchesSearch =
        bl.numBl?.toLowerCase().includes(searchString) ||
        bl.id_client?.nom?.toLowerCase().includes(searchString) ||
        bl.etatBl?.toLowerCase().includes(searchString) ||
        bl.codeBl?.toLowerCase().includes(searchString);

      // 3. Filtre par onglet (Status)
      const matchesStatus = statusFilter === "tous" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bls, searchTerm, statusFilter, isAdmin, isSuperviseur]);

  const currentItems = filteredBLs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredBLs.length / itemsPerPage);

  const ChargeProgress = ({ paye, total }) => {
    const percentage = total > 0 ? Math.min((paye / total) * 100, 100) : 0;
    return (
      <div className="w-full max-w-[120px]">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">
            {paye}/{total}
          </span>
          <span className="text-[10px] font-bold text-red-500">
            {Math.round(percentage)}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const StatusBadge = ({ etat }) => {
    const colors = {
      "En attente": "text-orange-500 bg-orange-50",
      "En cours": "text-blue-500 bg-blue-50",
      "A validé": "text-purple-600 bg-purple-50", // Nouveau
      Facturé: "text-emerald-600 bg-emerald-100", // Nouveau (Remplace payée)
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
          colors[etat] || "text-slate-400 bg-slate-50"
        }`}
      >
        {etat}
      </span>
    );
  };

  if (isLoading)
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <div className="size-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Synchronisation...
        </p>
      </div>
    );

  return (
    <div className="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-8 animate-fadeIn">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Bons de Lading
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Suivi des flux et situations financières.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
            <input
              type="text"
              placeholder="Rechercher BL, client, statut..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-red-500/5 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          {/* On affiche le bouton seulement si isAdmin OU isSuperviseur est vrai */}
          {(isAdmin || isSuperviseur) && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#EF233C] hover:bg-[#D90429] text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
              <PlusCircle size={18} /> Nouveau
            </button>
          )}
        </div>
      </div>

      {/* TABS DYNAMIQUES */}
      <div className="flex gap-8 border-b border-slate-200 text-sm font-bold text-slate-400 overflow-x-auto">
        {availableTabs.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`pb-4 capitalize whitespace-nowrap transition-all border-b-2 ${
              statusFilter === f
                ? "border-red-500 text-slate-900"
                : "border-transparent hover:text-slate-600"
            }`}
          >
            {f === "tous" ? "Tous les dossiers" : f}
          </button>
        ))}
      </div>

      {/* TABLEAU */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto lg:overflow-visible">
        <table className="overflow-x-auto md-overflow-hidden  w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-[11px] font-black uppercase text-slate-400 tracking-widest">
              <th className="px-6 py-4">Code / Date</th>
              <th className="px-6 py-4">Numero BL</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Charges</th>
              <th className="px-6 py-4">Num/Qte</th>
              <th className="px-6 py-4">Liquidation</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {currentItems.map((bl) => (
              <tr
                key={bl._id}
                onClick={() => navigate(`/bls/${bl._id}`)}
                className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-5">
                  <div className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                    {bl.codeBl}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 mt-1 uppercase">
                    Créé le{" "}
                    {new Date(bl.createdAt || Date.now()).toLocaleDateString(
                      "fr-FR"
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                    {bl.numBl}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-sm font-semibold uppercase text-slate-700">
                    {bl.id_client?.nom || "Non assigné"}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <ChargeProgress
                    paye={bl.totalChargePayer || 0}
                    total={bl.totalCharge || 0}
                  />
                </td>
                <td className="px-6 py-5">
                  <div className="text-sm font-bold text-slate-900 truncate max-w-[150px]">
                    {bl.numDeConteneur || "---"}
                  </div>
                  <div className="text-[10px] font-bold text-red-500 mt-0.5 uppercase tracking-wider">
                    {bl.nbrDeConteneur || 0} CONTENEUR(S)
                  </div>
                </td>
                <td className="px-6 py-5">
                  {bl.estLiquide ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-[11px] uppercase tracking-wider">
                      <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                      Liquidée
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                      <span className="size-1.5 bg-slate-300 rounded-full"></span>
                      En attente
                    </span>
                  )}
                </td>
                <td className="px-6 py-5">
                  <StatusBadge etat={bl.etatBl} />
                </td>
                <td className="px-6 py-5 text-right relative">
                  {/* On n'affiche le menu que si l'utilisateur est admin ou superviseur */}
                  {(isAdmin || isSuperviseur) && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === bl._id ? null : bl._id);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <MoreHorizontal size={20} />
                      </button>

                      {activeMenu === bl._id && (
                        <div className="absolute right-10 top-12 w-52 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-2 animate-in zoom-in-95">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBL(bl);
                              setIsUpdateOpen(true);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                          >
                            <Edit2 size={14} className="text-blue-500" />{" "}
                            Modifier le dossier
                          </button>

                          {/* Option de suppression souvent réservée uniquement à l'admin */}
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBL(bl);
                                setIsDeleteOpen(true);
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                              <Trash2 size={14} /> Supprimer définitivement
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="px-6 py-5 border-t border-slate-50 flex justify-between items-center bg-white">
          <p className="text-xs font-bold text-slate-400 uppercase">
            Affichage {currentItems.length} sur {filteredBLs.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage((p) => p - 1);
              }}
              className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 disabled:opacity-20 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage(i + 1);
                  }}
                  className={`size-8 rounded-lg text-xs font-bold transition-all ${
                    currentPage === i + 1
                      ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage((p) => p + 1);
              }}
              className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 disabled:opacity-20 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Mises à jour actives{" "}
          <span className="size-1.5 bg-green-500 rounded-full animate-pulse"></span>
        </button>
      </div>

      {/* MODALS */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Créer un Bill of Lading"
      >
        <CreateBlForm
          clients={clients}
          onCancel={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchData();
          }}
        />
      </Modal>

      <Modal
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        title="Modifier le Dossier"
      >
        <UpdateBlForm
          bl={selectedBL}
          clients={clients}
          onCancel={() => setIsUpdateOpen(false)}
          onSuccess={() => {
            setIsUpdateOpen(false);
            fetchData();
          }}
        />
      </Modal>

      {/* MODAL DE SUPPRESSION */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirmation de suppression"
      >
        <div className="p-1">
          <div className="flex items-center gap-4 mb-6 p-4 bg-red-50 rounded-2xl border border-red-100">
            <div className="size-12 bg-red-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-200">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Action Irréversible
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Suppression du dossier{" "}
                <span className="font-bold text-red-600">
                  {selectedBL?.numBl}
                </span>
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-8 px-1">
            Êtes-vous sûr de vouloir supprimer définitivement ce dossier ?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-[1.5] px-4 py-3 rounded-xl text-sm font-bold text-white bg-[#EF233C] hover:bg-[#D90429] shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> Supprimer le dossier
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AllBLs;
