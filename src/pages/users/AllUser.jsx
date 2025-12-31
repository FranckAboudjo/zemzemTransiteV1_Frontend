import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  ShieldAlert,
  Edit2,
  Trash2,
  MoreVertical,
  ShieldCheck,
  ExternalLink,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/ui/Modal";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import CreateUserForm from "./CreateUserForm";
import UpdateUserForm from "./UpdateUserForm";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const AllUsers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  // --- ÉTATS ---
  const [users, setUsers] = useState([]);
  const [caisseSolde, setCaisseSolde] = useState(0); // Pour le rechargement
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // États UI
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "nom",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // États Modaux
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  // Nouveaux états Rechargement / Retrait
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isRetraitOpen, setIsRetraitOpen] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState("");

  const ROLE_STYLES = {
    admin: "bg-slate-900 text-white border-slate-900",
    administrateur: "bg-slate-900 text-white border-slate-900",
    agent: "bg-red-50 text-[#EF233C] border-red-100",
    superviseur: "bg-slate-100 text-slate-700 border-slate-200",
    client: "bg-slate-50 text-slate-500 border-slate-100",
  };

  // --- CHARGEMENT DES DONNÉES ---
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const [userRes, caisseRes] = await Promise.all([
        API.get(API_PATHS.USERS.GET_ALL_USERS),
        API.get(API_PATHS.GETINFO.GET_INFO_CAISSE), // Route supposée pour récupérer le solde caisse
      ]);
      setUsers(Array.isArray(userRes.data.data) ? userRes.data.data : []);
      setCaisseSolde(caisseRes.data.solde || 0);
      setError(null);
    } catch (err) {
      setError({
        message: err.message || "Erreur de chargement.",
        status: err.status,
      });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  // --- LOGIQUE DE TRANSACTION (RECHARGE / RETRAIT) ---
  const getCurrentAdminName = () => {
    const userData = JSON.parse(
      localStorage.getItem("_appTransit_user") || "{}"
    );
    return `${userData.nom} ${userData.prenoms}`.trim() || "Admin";
  };

  const handleTransaction = async (type) => {
    const amount = parseInt(transactionAmount);
    if (!amount || amount <= 0) return toast.error("Montant invalide");

    const isRecharge = type === "recharge";
    const path = isRecharge
      ? API_PATHS.VERSEMENTAGENT.ADD_VERSEMENT_AGENT
      : API_PATHS.VERSEMENTAGENT.ADD_RETAIT_AGENT;

    const payload = {
      montant: amount,
      idUser: selectedUser._id,
      par: getCurrentAdminName(),
      ...(!isRecharge && { description: "Retour surplus fin de mission" }),
    };

    try {
      await API.post(path, payload);
      toast.success(isRecharge ? "Compte rechargé !" : "Retrait effectué !");
      setIsRechargeOpen(false);
      setIsRetraitOpen(false);
      setTransactionAmount("");
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'opération");
    }
  };

  // --- ACTIONS EXISTANTES ---
  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await API.delete(
        API_PATHS.USERS.DELETE_USER.replace(":id", selectedUser._id)
      );
      toast.success("Utilisateur supprimé");
      setIsDeleteOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Erreur de suppression");
    }
  };

  // --- LOGIQUE DE FILTRE ET TRI ---
  const processedUsers = useMemo(() => {
    let result = Array.isArray(users) ? [...users] : [];
    if (searchTerm) {
      result = result.filter(
        (u) =>
          u.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.prenoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    result.sort((a, b) => {
      let valA, valB;
      if (sortConfig.key === "solde") {
        valA = a.compte?.montant || 0;
        valB = b.compte?.montant || 0;
      } else {
        valA = a[sortConfig.key] || "";
        valB = b[sortConfig.key] || "";
      }
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [users, searchTerm, sortConfig]);

  const totalPages = Math.ceil(processedUsers.length / itemsPerPage);
  const currentUsers = processedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // (Rendu isLoading et error inchangé...)
  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-[3px] border-[#EF233C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="p-4 lg:p-8 space-y-6 bg-[#F8FAFC]">
      {/* HEADER & RECHERCHE (Inchangés) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl">
            <UsersIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
              Gestion Comptes
            </h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              {users.length} Utilisateurs actifs
            </p>
          </div>
        </div>

        {/* LE BOUTON N'EST RENDU QUE SI L'UTILISATEUR EST ADMIN */}
        {isAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#EF233C] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#D90429] transition-all active:scale-95 shadow-lg shadow-red-100 w-full md:w-auto justify-center"
          >
            <UserPlus size={18} /> Ajouter un Agent
          </button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
        <input
          type="text"
          placeholder="RECHERCHER PAR NOM OU RÔLE..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-[#EF233C] outline-none shadow-sm"
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* TABLEAU */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm max-h-[600px] overflow-y-auto ">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <th
                className="px-6 py-5 cursor-pointer hover:text-[#EF233C]"
                onClick={() =>
                  setSortConfig({
                    key: "nom",
                    direction: sortConfig.direction === "asc" ? "desc" : "asc",
                  })
                }
              >
                Utilisateur{" "}
                {sortConfig.key === "nom" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-5">Rôle</th>
              <th
                className="px-6 py-5 cursor-pointer hover:text-[#EF233C]"
                onClick={() =>
                  setSortConfig({
                    key: "solde",
                    direction: sortConfig.direction === "asc" ? "desc" : "asc",
                  })
                }
              >
                Solde MRU{" "}
                {sortConfig.key === "solde" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-5">Restriction</th>
              <th className="px-6 py-5">Gestion Fonds</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {currentUsers.map((user) => (
              <tr
                key={user._id}
                className={`hover:bg-red-50/10 transition-colors group ${
                  user.restriction ? "bg-slate-50/50" : ""
                }`}
              >
                <td
                  className="px-6 py-4"
                  onClick={() => navigate(`/users/id=${user._id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-black text-white text-[10px] uppercase">
                      {user.nom?.[0]}
                      {user.prenoms?.[0]}
                    </div>
                    <div className="text-sm font-black text-slate-900 uppercase group-hover:text-[#EF233C] transition-colors">
                      {user.nom} {user.prenoms}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${
                      ROLE_STYLES[user.role] || ROLE_STYLES.Client
                    }`}
                  >
                    {user.role || "Client"}
                  </span>
                </td>
                <td className="px-6 py-4 font-black text-sm">
                  <span
                    className={
                      (user.compte?.montant || 0) < 0
                        ? "text-[#EF233C]"
                        : "text-emerald-600"
                    }
                  >
                    {new Intl.NumberFormat("fr-FR").format(
                      user.compte?.montant || 0
                    )}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.restriction ? (
                    <div className="inline-flex items-center gap-1.5 text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase">
                      <ShieldAlert size={12} /> Bloqué
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase">
                      <ShieldCheck size={12} /> Actif
                    </div>
                  )}
                </td>
                {/* NOUVELLE COLONNE GESTION FONDS */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(user);
                        setIsRechargeOpen(true);
                      }}
                      className="p-2  text-slate-500 flex items-center gap-2 text-xs rounded-lg hover:underline hover:text-[#EF233C] transition-all active:scale-90"
                      title="Recharger"
                    >
                      <ArrowDownCircle size={18} /> Recharge
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(user);
                        setIsRetraitOpen(true);
                      }}
                      className="p-2 text-slate-500  flex items-center gap-2 text-xs rounded-lg hover:underline hover:text-green-600 transition-all active:scale-90"
                      title="Retrait"
                    >
                      <ArrowUpCircle size={18} /> Retrait
                    </button>
                  </div>
                </td>
                <td
                  className="px-6 py-4 text-right relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isAdmin && (
                    <button
                      onClick={() =>
                        setActiveMenu(activeMenu === user._id ? null : user._id)
                      }
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                  )}

                  {activeMenu === user._id && (
                    <div className="absolute right-6 top-10 w-44 bg-white border border-slate-200 rounded-xl py-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsUpdateOpen(true);
                          setActiveMenu(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-slate-700 hover:bg-slate-50 uppercase tracking-tighter"
                      >
                        <Edit2 size={14} /> Modifier
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsDeleteOpen(true);
                          setActiveMenu(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-[#EF233C] hover:bg-red-50 uppercase tracking-tighter"
                      >
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL RECHARGE */}
      <Modal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
        title={`Recharger le compte de ${selectedUser?.nom}`}
      >
        <div className="space-y-5 p-2">
          <div className="flex justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">
                Caisse Centrale
              </p>
              <p className="text-sm font-black text-slate-900">
                {caisseSolde.toLocaleString()} MRU
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase">
                Solde après
              </p>
              <p className="text-sm font-black text-red-600">
                {(
                  caisseSolde - (parseInt(transactionAmount) || 0)
                ).toLocaleString()}{" "}
                MRU
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
              Montant du versement
            </label>
            <div className="relative">
              <Wallet
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-xl font-black text-lg focus:border-[#EF233C] outline-none"
              />
            </div>
          </div>
          <button
            onClick={() => handleTransaction("recharge")}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl"
          >
            Valider le rechargement
          </button>
        </div>
      </Modal>

      {/* MODAL RETRAIT */}
      <Modal
        isOpen={isRetraitOpen}
        onClose={() => setIsRetraitOpen(false)}
        title={`Retrait du compte de ${selectedUser?.nom}`}
      >
        <div className="space-y-5 p-2">
          <div className="flex justify-between p-4 bg-red-50/50 rounded-xl border border-red-100">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">
                Solde Agent
              </p>
              <p className="text-sm font-black text-slate-900">
                {(selectedUser?.compte?.montant || 0).toLocaleString()} MRU
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase">
                Solde après
              </p>
              <p className="text-sm font-black text-emerald-600">
                {(
                  (selectedUser?.compte?.montant || 0) -
                  (parseInt(transactionAmount) || 0)
                ).toLocaleString()}{" "}
                MRU
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
              Montant du retrait
            </label>
            <input
              type="number"
              value={transactionAmount}
              onChange={(e) => setTransactionAmount(e.target.value)}
              className="w-full px-4 py-4 bg-white border-2 border-slate-100 rounded-xl font-black text-lg focus:border-[#EF233C] outline-none"
              placeholder="0.00"
            />
          </div>
          <button
            onClick={() => handleTransaction("retrait")}
            className="w-full py-4 bg-[#EF233C] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#D90429] transition-all shadow-xl shadow-red-100"
          >
            Confirmer le retrait
          </button>
        </div>
      </Modal>

      {/* MODALS EXISTANTS (Inchangés) */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Sécurité Compte"
      >
        <div className="text-center space-y-6 py-2">
          <div className="w-16 h-16 bg-red-50 text-[#EF233C] rounded-2xl flex items-center justify-center mx-auto ring-8 ring-red-50/50">
            <Trash2 size={32} />
          </div>
          <p className="text-xs text-slate-600 font-bold uppercase tracking-wide">
            Confirmer la suppression de <br />
            <span className="text-sm font-black text-slate-900 underline decoration-[#EF233C] uppercase">
              {selectedUser?.nom} {selectedUser?.prenoms}
            </span>
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-4 bg-[#EF233C] text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-red-100 hover:bg-[#D90429]"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>

      {/* FORMULAIRES DE CRÉATION/MAJ (Inchangés) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouvel Agent"
      >
        <CreateUserForm
          onSubmit={async (data) => {
            await API.post(API_PATHS.AUTH.REGISTER, data);
            fetchUsers();
            setIsCreateOpen(false);
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        title="Modifier Profil"
      >
        <UpdateUserForm
          user={selectedUser}
          onSubmit={async (data) => {
            await API.patch(
              API_PATHS.USERS.UPDATE_USER.replace(":id", selectedUser._id),
              data
            );
            fetchUsers();
            setIsUpdateOpen(false);
          }}
          onCancel={() => setIsUpdateOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default AllUsers;
