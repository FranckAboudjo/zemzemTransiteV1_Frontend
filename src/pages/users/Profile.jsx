import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Retrait de useParams
import {
  ArrowLeft,
  Calendar,
  User,
  ShieldCheck,
  ShieldAlert,
  Download,
  Mail,
  ArrowUpRight,
  ArrowDownLeft,
  IdCard,
  UserCheck,
  Landmark,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("transactions");
  const [showManageModal, setShowManageModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    show: false,
    title: "",
    message: "",
    action: null,
    isDangerous: false,
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // 1. Récupération de l'ID depuis votre clé LocalStorage spécifique
      const storedData = localStorage.getItem("_appTransit_user");

      if (!storedData) {
        toast.error("Session expirée, veuillez vous reconnecter.");
        navigate("/login");
        return;
      }

      const parsedData = JSON.parse(storedData);
      const currentUserId = parsedData.id; // Utilisation de .id selon votre JSON

      // 2. Chargement des données via API pour avoir les infos complètes (solde, etc.)
      const resUser = await API.get(
        API_PATHS.USERS.GET_ONE_USER.replace(":id", currentUserId)
      );
      setUser(resUser.data.data);

      const resTrans = await API.get(
        API_PATHS.HISTORIQUE.AGENTS_BY_ID.replace(":id_agent", currentUserId)
      );
      setTransactions(resTrans.data.data);
    } catch (err) {
      toast.error("Erreur lors du chargement de votre profil");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) return <LoadingState />;
  if (!user)
    return (
      <div className="p-10 text-center font-bold">Profil introuvable.</div>
    );

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8 animate-fadeIn">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* --- HEADER PROFIL --- */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-slate-900/5 rounded-full -mr-20 -mt-20" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="size-24 rounded-[2rem] bg-[#EF233C] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-red-500/30">
                {user.nom?.charAt(0)}
                {user.prenoms?.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {user.prenoms} {user.nom}
                  </h1>
                  <StatusBadge isRestricted={user.restriction} />
                </div>
                <div className="flex flex-wrap gap-4">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase">
                    <UserCheck size={14} className="text-[#EF233C]" />{" "}
                    {user.role}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase">
                    <IdCard size={14} className="text-[#EF233C]" /> @
                    {user.username}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 min-w-[260px] text-white shadow-2xl shadow-slate-900/30 border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <Wallet size={14} className="text-[#EF233C]" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Solde Actuel
                </p>
              </div>
              <p className="text-4xl font-black">
                {user.compte?.montant?.toLocaleString()}
                <span className="text-sm font-medium text-slate-500 ml-2 uppercase">
                  Mru
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex gap-8 border-b border-slate-200 px-6">
          <TabButton
            label="Historique des Opérations"
            active={activeTab === "transactions"}
            onClick={() => setActiveTab("transactions")}
          />
          <TabButton
            label="Détails de l'Agent"
            active={activeTab === "informations"}
            onClick={() => setActiveTab("informations")}
          />
        </div>

        {/* --- CONTENT --- */}
        <div className="transition-all duration-300">
          {activeTab === "transactions" ? (
            <div className="bg-white rounded-[2rem] border  border-slate-100 shadow-sm max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="px-8 py-5">Date & Heure</th>
                    <th className="px-8 py-5">Désignation de l'opération</th>
                    <th className="px-8 py-5 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.length > 0 ? (
                    transactions.map((t) => {
                      const isPositive =
                        t.type === "Rechargement" || t.type === "Remboursement";

                      return (
                        <tr
                          key={t._id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-2.5 rounded-2xl transition-transform group-hover:scale-110 ${
                                  isPositive
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                {isPositive ? (
                                  <ArrowDownLeft size={18} />
                                ) : (
                                  <ArrowUpRight size={18} />
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800">
                                  {new Date(t.date).toLocaleDateString(
                                    "fr-FR",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                  {new Date(t.date).toLocaleTimeString(
                                    "fr-FR",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                              {t.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border ${
                                  isPositive
                                    ? "border-emerald-200 text-emerald-600 bg-emerald-50"
                                    : "border-slate-200 text-slate-500 bg-slate-50"
                                }`}
                              >
                                {t.type}
                              </span>
                              {t.id_bl && (
                                <span className="text-[10px] font-bold text-[#EF233C] bg-red-50 px-2 py-0.5 rounded-full">
                                  DOSSIER: {t.id_bl?.numBl}
                                </span>
                              )}
                            </div>
                          </td>
                          <td
                            className={`px-8 py-6 text-right font-black text-base ${
                              isPositive ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            <div className="flex flex-col items-end">
                              <span className="flex items-center gap-1">
                                {isPositive ? "+" : "-"}{" "}
                                {Math.abs(t.montant)?.toLocaleString()}{" "}
                                <small className="text-[10px]">MRU</small>
                              </span>
                              <span className="text-[9px] text-slate-300 font-bold mt-1 uppercase tracking-tighter">
                                Nouveau Solde: {t.soldeApres?.toLocaleString()}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-24 text-center">
                        <div className="flex flex-col items-center opacity-20">
                          <Wallet size={48} className="mb-2" />
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Aucune operation enregistrée
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              <div className="md:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10 flex items-center gap-2">
                  <User size={18} className="text-[#EF233C]" /> Profil de
                  l'utilisateur
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-8">
                  <InfoBlock
                    label="Nom et Prénoms"
                    value={`${user.nom} ${user.prenoms}`}
                    icon={<User size={16} />}
                  />
                  <InfoBlock
                    label="Login Système"
                    value={user.username}
                    icon={<IdCard size={16} />}
                  />
                  <InfoBlock
                    label="Rôle / Permission"
                    value={user.role}
                    icon={<Landmark size={16} />}
                  />
                  <InfoBlock
                    label="Date de création"
                    value={new Date(user.dateCreation).toLocaleDateString()}
                    icon={<Calendar size={16} />}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL DE GESTION --- */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  Sécurité Compte
                </h3>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">
                Actions disponibles pour {user.nom}
              </p>

              <div className="space-y-4">
                {/* CORRECTION: Appel de triggerResetPassword */}
                <button
                  disabled={isProcessing}
                  onClick={triggerResetPassword}
                  className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-slate-800 uppercase">
                        Réinitialiser le mot de passe
                      </p>
                      <p className="text-[14px] text-slate-400 font-bold ">
                        Défaut:{" "}
                        <span className="text-slate-800"> Test1234</span>
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-slate-300" />
                </button>

                {/* CORRECTION: Appel de triggerToggleRestriction */}
                <button
                  disabled={isProcessing}
                  onClick={triggerToggleRestriction}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all group ${
                    user.restriction
                      ? "bg-emerald-50 hover:bg-emerald-100 border border-emerald-100"
                      : "bg-red-50 hover:bg-red-100 border border-red-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${
                        user.restriction
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {user.restriction ? (
                        <ShieldCheck size={20} />
                      ) : (
                        <ShieldAlert size={20} />
                      )}
                    </div>
                    <div className="text-left">
                      <p
                        className={`text-sm font-black uppercase ${
                          user.restriction ? "text-emerald-800" : "text-red-800"
                        }`}
                      >
                        {user.restriction
                          ? "Réactiver le compte"
                          : "Restreindre le compte"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {user.restriction
                          ? "L'agent retrouvera ses accès"
                          : "L'agent ne pourra plus se connecter"}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight
                    size={18}
                    className={
                      user.restriction ? "text-emerald-300" : "text-red-300"
                    }
                  />
                </button>
              </div>

              <button
                onClick={() => setShowManageModal(false)}
                className="w-full mt-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-600 transition-colors"
              >
                Fermer la fenêtre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALE DE CONFIRMATION PERSONNALISÉE --- */}
      {confirmConfig.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 p-8 text-center">
            <div
              className={`mx-auto size-16 rounded-2xl flex items-center justify-center mb-6 ${
                confirmConfig.isDangerous
                  ? "bg-red-50 text-red-500"
                  : "bg-emerald-50 text-emerald-500"
              }`}
            >
              <ShieldAlert size={32} />
            </div>

            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
              {confirmConfig.title}
            </h3>
            <p className="text-sm font-bold text-slate-400 mb-8 leading-relaxed">
              {confirmConfig.message}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() =>
                  setConfirmConfig((prev) => ({ ...prev, show: false }))
                }
                className="py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmConfig.action}
                disabled={isProcessing}
                className={`py-4 rounded-2xl text-[10px] font-black uppercase text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                  confirmConfig.isDangerous
                    ? "bg-red-500 shadow-red-500/20"
                    : "bg-emerald-500 shadow-emerald-500/20"
                }`}
              >
                {isProcessing ? "Patientez..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- COMPOSANTS AUXILIAIRES --- */

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`pb-4 text-[11px] font-black uppercase tracking-[0.15em] transition-all relative ${
      active ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
    }`}
  >
    {label}
    {active && (
      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#EF233C] rounded-t-full" />
    )}
  </button>
);

const StatusBadge = ({ isRestricted }) => (
  <div
    className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${
      isRestricted
        ? "bg-red-100 text-red-600"
        : "bg-emerald-100 text-emerald-600"
    }`}
  >
    {isRestricted ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
    <span className="text-[10px] font-black uppercase">
      {isRestricted ? "Bloqué" : "Actif"}
    </span>
  </div>
);

const InfoBlock = ({ label, value, icon }) => (
  <div className="group">
    <div className="flex items-center gap-2 text-[#EF233C] mb-1">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
    </div>
    <p className="text-base font-bold text-slate-800 ml-6 group-hover:text-[#EF233C] transition-colors">
      {value || "N/A"}
    </p>
  </div>
);

const LoadingState = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
    <div className="size-14 border-[5px] border-[#EF233C]/10 border-t-[#EF233C] rounded-full animate-spin mb-4" />
    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] animate-pulse">
      Synchronisation Agent...
    </p>
  </div>
);

export default Profile;
