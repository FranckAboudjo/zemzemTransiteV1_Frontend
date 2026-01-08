import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  IdCard,
  UserCheck,
  Landmark,
  Wallet,
  Clock,
  Download, // Nouvel import pour l'icône
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { exportToExcel } from "./ExportExcel"; // Import de la fonction

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

  const triggerResetPassword = () => {
    setConfirmConfig({
      show: true,
      title: "Réinitialiser ?",
      message: "Le mot de passe sera remis par défaut (Test1234).",
      isDangerous: false,
      action: async () => {
        setIsProcessing(true);
        // Votre logique API ici
        setIsProcessing(false);
        setConfirmConfig({ ...confirmConfig, show: false });
      },
    });
  };

  const triggerToggleRestriction = () => {
    setConfirmConfig({
      show: true,
      title: user.restriction ? "Réactiver ?" : "Restreindre ?",
      message: user.restriction
        ? "L'agent pourra de nouveau se connecter."
        : "L'agent sera déconnecté immédiatement.",
      isDangerous: !user.restriction,
      action: async () => {
        setIsProcessing(true);
        // Votre logique API ici
        setIsProcessing(false);
        setConfirmConfig({ ...confirmConfig, show: false });
      },
    });
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const storedData = localStorage.getItem("_appTransit_user");
      if (!storedData) {
        toast.error("Session expirée, veuillez vous reconnecter.");
        navigate("/login");
        return;
      }
      const parsedData = JSON.parse(storedData);
      const currentUserId = parsedData.id;

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
      <div className="p-10 text-center font-bold text-slate-500 uppercase text-xs tracking-widest">
        Profil introuvable.
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-3 md:p-8 animate-fadeIn pb-24">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        {/* --- HEADER PROFIL --- */}
        <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-slate-900/5 rounded-full -mr-16 -mt-16" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-4 md:gap-6 text-center sm:text-left">
              <div className="size-20 md:size-24 rounded-[1.5rem] md:rounded-[2rem] bg-[#EF233C] flex items-center justify-center text-white text-2xl md:text-3xl font-black shadow-lg shadow-red-500/30 shrink-0">
                {user.nom?.charAt(0)}
                {user.prenoms?.charAt(0)}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3">
                  <h1 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                    {user.prenoms} {user.nom}
                  </h1>
                  <StatusBadge isRestricted={user.restriction} />
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 md:gap-4">
                  <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-slate-400 uppercase">
                    <UserCheck size={14} className="text-[#EF233C]" />{" "}
                    {user.role}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-slate-400 uppercase">
                    <IdCard size={14} className="text-[#EF233C]" /> @
                    {user.username}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-6 w-full lg:min-w-[260px] lg:w-auto text-white shadow-2xl shadow-slate-900/30 border border-slate-800 relative">
              <button
                onClick={() => setShowManageModal(true)}
                className="absolute top-4 right-4 p-2 bg-slate-800 rounded-lg hover:bg-[#EF233C] transition-colors"
              >
                <ShieldCheck size={16} />
              </button>
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <Wallet size={14} className="text-[#EF233C]" />
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Solde Actuel
                </p>
              </div>
              <p className="text-3xl md:text-4xl font-black">
                {user.compte?.montant?.toLocaleString()}
                <span className="text-xs md:text-sm font-medium text-slate-500 ml-2 uppercase">
                  Mru
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* --- TABS & EXPORT --- */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 md:px-6 overflow-x-auto no-scrollbar whitespace-nowrap">
          <div className="flex gap-4 md:gap-8">
            <TabButton
              label="Historique"
              active={activeTab === "transactions"}
              onClick={() => setActiveTab("transactions")}
            />
            <TabButton
              label="Détails de l'Agent"
              active={activeTab === "informations"}
              onClick={() => setActiveTab("informations")}
            />
          </div>

          {/* BOUTON EXCEL - Visible uniquement sur l'onglet Historique */}
          {activeTab === "transactions" && transactions.length > 0 && (
            <button
              onClick={() =>
                exportToExcel(transactions, `${user.prenoms}_${user.nom}`)
              }
              className="flex items-center gap-2 mb-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Exporter Excel</span>
            </button>
          )}
        </div>

        {/* --- CONTENT --- */}
        <div className="transition-all duration-300">
          {activeTab === "transactions" ? (
            <div className="space-y-3">
              <div className="hidden md:block bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 sticky top-0 z-10">
                      <tr>
                        <th className="px-8 py-5">Date & Heure</th>
                        <th className="px-8 py-5">Désignation</th>
                        <th className="px-8 py-5 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.map((t) => (
                        <DesktopRow key={t._id} t={t} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="md:hidden space-y-3">
                {transactions.length > 0 ? (
                  transactions.map((t) => <MobileCard key={t._id} t={t} />)
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              <div className="md:col-span-2 bg-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-widest mb-8 md:mb-10 flex items-center gap-2">
                  <User size={18} className="text-[#EF233C]" /> Informations
                  Profil
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 md:gap-y-10 gap-x-8 text-center sm:text-left">
                  <InfoBlock
                    label="Nom Complet"
                    value={`${user.nom} ${user.prenoms}`}
                    icon={<User size={16} />}
                  />
                  <InfoBlock
                    label="Identifiant"
                    value={user.username}
                    icon={<IdCard size={16} />}
                  />
                  <InfoBlock
                    label="Permissions"
                    value={user.role}
                    icon={<Landmark size={16} />}
                  />
                  <InfoBlock
                    label="Membre depuis"
                    value={new Date(user.dateCreation).toLocaleDateString()}
                    icon={<Calendar size={16} />}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- (Identiques à votre code initial) */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-slideUp sm:animate-fadeIn">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight">
                  Sécurité Compte
                </h3>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="size-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-400"
                >
                  <ArrowLeft size={18} />
                </button>
              </div>
              <div className="space-y-3 md:space-y-4">
                <ModalButton
                  icon={<ShieldCheck size={20} />}
                  title="Reset Password"
                  desc="Défaut: Test1234"
                  color="blue"
                  onClick={triggerResetPassword}
                />
                <ModalButton
                  icon={
                    user.restriction ? (
                      <ShieldCheck size={20} />
                    ) : (
                      <ShieldAlert size={20} />
                    )
                  }
                  title={user.restriction ? "Réactiver" : "Restreindre"}
                  desc={
                    user.restriction ? "Rétablir les accès" : "Bloquer l'accès"
                  }
                  color={user.restriction ? "emerald" : "red"}
                  onClick={triggerToggleRestriction}
                />
              </div>
              <button
                onClick={() => setShowManageModal(false)}
                className="w-full mt-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmConfig.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-xs overflow-hidden p-6 md:p-8 text-center shadow-2xl border border-slate-100 animate-fadeIn">
            <div
              className={`mx-auto size-14 rounded-2xl flex items-center justify-center mb-4 ${
                confirmConfig.isDangerous
                  ? "bg-red-50 text-red-500"
                  : "bg-emerald-50 text-emerald-500"
              }`}
            >
              <ShieldAlert size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">
              {confirmConfig.title}
            </h3>
            <p className="text-[11px] font-bold text-slate-400 mb-6 leading-relaxed uppercase">
              {confirmConfig.message}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  setConfirmConfig({ ...confirmConfig, show: false })
                }
                className="py-3 bg-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-400"
              >
                Annuler
              </button>
              <button
                onClick={confirmConfig.action}
                className={`py-3 rounded-xl text-[10px] font-black uppercase text-white ${
                  confirmConfig.isDangerous ? "bg-red-500" : "bg-emerald-500"
                }`}
              >
                {isProcessing ? "..." : "OUI"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- MINI COMPOSANTS (Inchangés) --- */
const MobileCard = ({ t }) => {
  const isPositive = t.type === "Rechargement" || t.type === "Remboursement";
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${
              isPositive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {isPositive ? (
              <ArrowDownLeft size={16} />
            ) : (
              <ArrowUpRight size={16} />
            )}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-800 uppercase leading-none mb-1">
              {t.description}
            </p>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock size={10} />
              <p className="text-[9px] font-bold uppercase tracking-tight">
                {new Date(t.date).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                })}{" "}
                •{" "}
                {new Date(t.date).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`text-sm font-black ${
              isPositive ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {isPositive ? "+" : "-"} {Math.abs(t.montant)?.toLocaleString()}
          </p>
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
            Solde: {t.soldeApres?.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
        <span
          className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase border ${
            isPositive
              ? "border-emerald-200 text-emerald-600 bg-emerald-50"
              : "border-slate-200 text-slate-500 bg-slate-50"
          }`}
        >
          {t.type}
        </span>
        {t.id_bl && (
          <span className="text-[8px] font-black text-[#EF233C] bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
            Dossier: {t.id_bl?.numBl}
          </span>
        )}
      </div>
    </div>
  );
};

const DesktopRow = ({ t }) => {
  const isPositive = t.type === "Rechargement" || t.type === "Remboursement";
  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div
            className={`p-2.5 rounded-2xl ${
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
            <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">
              {new Date(t.date).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              {new Date(t.date).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </td>
      <td className="px-8 py-6 uppercase tracking-tight">
        <p className="text-sm font-black text-slate-800">{t.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] px-2 py-0.5 rounded-full font-black border border-slate-100">
            {t.type}
          </span>
          {t.id_bl && (
            <span className="text-[10px] font-bold text-[#EF233C]">
              DOSSIER: {t.id_bl?.numBl}
            </span>
          )}
        </div>
      </td>
      <td
        className={`px-8 py-6 text-right font-black ${
          isPositive ? "text-emerald-600" : "text-red-600"
        }`}
      >
        <span className="text-base">
          {isPositive ? "+" : "-"} {Math.abs(t.montant)?.toLocaleString()}{" "}
          <small className="text-[10px]">MRU</small>
        </span>
        <p className="text-[9px] text-slate-300 font-bold uppercase">
          Solde: {t.soldeApres?.toLocaleString()}
        </p>
      </td>
    </tr>
  );
};

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`pb-4 text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all relative ${
      active ? "text-slate-900" : "text-slate-400"
    }`}
  >
    {label}
    {active && (
      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#EF233C] rounded-t-full shadow-lg shadow-red-500/50" />
    )}
  </button>
);

const ModalButton = ({ icon, title, desc, color, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all group"
  >
    <div className="flex items-center gap-4 text-left">
      <div
        className={`p-3 bg-${color}-100 text-${color}-600 rounded-lg group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <div>
        <p
          className={`text-xs font-black uppercase tracking-tight text-slate-800`}
        >
          {title}
        </p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
          {desc}
        </p>
      </div>
    </div>
    <ArrowUpRight size={16} className="text-slate-300" />
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
    {isRestricted ? <ShieldAlert size={10} /> : <ShieldCheck size={10} />}
    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tight">
      {isRestricted ? "Bloqué" : "Actif"}
    </span>
  </div>
);

const InfoBlock = ({ label, value, icon }) => (
  <div className="group">
    <div className="flex items-center justify-center sm:justify-start gap-2 text-[#EF233C] mb-1">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
    </div>
    <p className="text-sm md:text-base font-bold text-slate-800 uppercase truncate">
      {value || "N/A"}
    </p>
  </div>
);

const EmptyState = () => (
  <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 opacity-40">
    <Wallet size={40} className="mx-auto mb-3 text-slate-300" />
    <p className="text-[10px] font-black uppercase tracking-widest">
      Aucune opération
    </p>
  </div>
);

const LoadingState = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-6 text-center">
    <div className="size-12 border-[4px] border-[#EF233C]/10 border-t-[#EF233C] rounded-full animate-spin mb-4" />
    <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] animate-pulse">
      Synchronisation Profil...
    </p>
  </div>
);

export default Profile;
