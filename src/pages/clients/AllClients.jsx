import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  MoreHorizontal,
  ShieldCheck,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { socket } from "../../utils/socket";
import { useAuth } from "../../context/AuthContext";
import CreateClientForm from "./CreateClientForm";
import UpdateClientForm from "./UpdateClientForm";

const AllClients = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  // --- ÉTATS ---
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  // --- CHARGEMENT INITIAL ---
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await API.get(API_PATHS.CLIENTS.GET_ALL_CLIENTS);
      // Correction de la clé d'accès aux données
      setClients(response.data.data || []);
    } catch (err) {
      toast.error("Erreur de récupération des clients");
    } finally {
      setIsLoading(false);
    }
  };

  // --- TEMPS RÉEL (SOCKET.IO) ---
  useEffect(() => {
    fetchClients();

    socket.on("clientCreated", (newClient) => {
      setClients((prev) => [newClient, ...prev]);
    });

    socket.on("clientUpdated", (updatedClient) => {
      setClients((prev) =>
        prev.map((c) => (c._id === updatedClient._id ? updatedClient : c))
      );
    });

    socket.on("clientDeleted", (data) => {
      // On gère si data est l'ID directement ou un objet { _id: ... }
      const deletedId = typeof data === "object" ? data._id : data;
      setClients((prev) => prev.filter((c) => c._id !== deletedId));
    });

    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener("click", handleClickOutside);

    return () => {
      socket.off("clientCreated");
      socket.off("clientUpdated");
      socket.off("clientDeleted");
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // --- ACTIONS ---
  const handleDelete = async () => {
    if (!selectedClient) return;
    try {
      const url = API_PATHS.CLIENTS.DELETE_CLIENT.replace(
        ":id",
        selectedClient._id
      );

      await API.delete(url);

      // MISE À JOUR LOCALE IMMÉDIATE (Si Socket.io met trop de temps)
      setClients((prev) => prev.filter((c) => c._id !== selectedClient._id));

      toast.success("Client supprimé avec succès");
      setIsDeleteOpen(false);
      setSelectedClient(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de suppression");
    }
  };

  // --- FILTRES & PAGINATION ---
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const name = (c.nom || "").toLowerCase();
      const contact = (c.contact || "").toLowerCase();
      const codeClient = (c.codeClient || "").toLowerCase();
      const search = searchTerm.toLowerCase();
      return (
        name.includes(search) ||
        contact.includes(search) ||
        codeClient.includes(search)
      );
    });
  }, [clients, searchTerm]);

  const currentItems = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  // --- COMPOSANTS INTERNES ---
  const StatusBadge = ({ restricted }) =>
    restricted ? (
      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100">
        <ShieldAlert size={12} /> Restreint
      </span>
    ) : (
      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
        <ShieldCheck size={12} /> Actif
      </span>
    );

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
            Base Clients
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos relations et suivis financiers.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
            <input
              type="text"
              placeholder="Rechercher un nom, contact..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-red-500/5 transition-all"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#EF233C] hover:bg-[#D90429] text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all active:scale-95"
          >
            <UserPlus size={18} /> Nouveau Client
          </button>
        </div>
      </div>

      {/* TABLEAU */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-[11px] font-black uppercase text-slate-400 tracking-widest">
              <th className="px-6 py-4">Nom du client</th>
              <th className="px-6 py-4">Code client</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4 text-center">Dossiers BL</th>
              <th className="px-6 py-4 text-center">Solde</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {currentItems.map((client) => (
              <tr
                key={client._id}
                onClick={() => navigate(`/clients/${client._id}`)}
                className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-200">
                      {(client.nom || "??").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors uppercase">
                        {client.nom}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 tracking-wider">
                        {client.contact}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 ">
                  <div className="flex  gap-1.5 text-xs font-semibold text-slate-600">
                    {client.codeClient}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                      client.typeClient === "Entreprise"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {client.typeClient}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-slate-600">
                    <FileText size={14} className="text-slate-300" />
                    {client.bls?.length || 0}
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <div
                    className={`text-sm font-black ${
                      client.solde > 0 ? "text-red-500" : "text-emerald-500"
                    }`}
                  >
                    {new Intl.NumberFormat("fr-FR", {
                      currency: "MRU",
                    }).format(client.solde || 0)}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <StatusBadge restricted={client.restriction} />
                </td>
                <td
                  className="px-6 py-5 text-right relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() =>
                      setActiveMenu(
                        activeMenu === client._id ? null : client._id
                      )
                    }
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  {activeMenu === client._id && (
                    <div className="absolute right-10 top-12 w-44 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-2 animate-in zoom-in-95">
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setIsUpdateOpen(true);
                          setActiveMenu(null);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Edit2 size={14} className="text-indigo-500" /> Modifier
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setIsDeleteOpen(true);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Supprimer
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="px-6 py-5 border-t border-slate-50 flex justify-between items-center bg-white">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
            Total : {filteredClients.length} Partenaires
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 disabled:opacity-20 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`size-8 rounded-lg text-xs font-bold transition-all ${
                    currentPage === i + 1
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 disabled:opacity-20 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Ajouter un Partenaire"
      >
        <CreateClientForm
          onCancel={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchClients(); // Sécurité si socket lent
          }}
        />
      </Modal>

      <Modal
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        title="Mise à jour Client"
      >
        <UpdateClientForm
          client={selectedClient}
          onCancel={() => setIsUpdateOpen(false)}
          onSuccess={() => {
            setIsUpdateOpen(false);
            fetchClients();
          }}
        />
      </Modal>

      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirmer la suppression"
      >
        <div className="p-4 bg-red-50 rounded-xl border border-red-100 mb-6 text-center">
          <p className="text-sm text-red-700 leading-relaxed">
            Supprimer <strong>{selectedClient?.nom}</strong> ?
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsDeleteOpen(false)}
            className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm"
          >
            Confirmer
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AllClients;
