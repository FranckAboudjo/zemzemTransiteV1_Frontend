import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Scale,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const UserDetails = () => {
  const { id } = useParams();
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

  // --- LOGIQUE DU BILAN PAR TYPE (TABLEAU) ---
  const bilanData = useMemo(() => {
    const stats = transactions.reduce((acc, t) => {
      if (!acc[t.type]) {
        acc[t.type] = { count: 0, total: 0 };
      }
      acc[t.type].count += 1;
      acc[t.type].total += Math.abs(t.montant);
      return acc;
    }, {});

    const entries = Object.entries(stats).map(([type, data]) => ({
      type,
      ...data,
      isPositive:
        type === "Rechargement" ||
        type === "Annulation paiement" ||
        type === "Retour",
    }));

    const totalEntrees = entries
      .filter((e) => e.isPositive)
      .reduce((sum, e) => sum + e.total, 0);
    const totalSorties = entries
      .filter((e) => !e.isPositive)
      .reduce((sum, e) => sum + e.total, 0);

    return {
      entries,
      totalEntrees,
      totalSorties,
      balance: totalEntrees - totalSorties,
    };
  }, [transactions]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const cleanId = id.replace("id=", "").split("_")[0].trim();

      const resUser = await API.get(
        API_PATHS.USERS.GET_ONE_USER.replace(":id", cleanId)
      );
      setUser(resUser.data.data);

      const resTrans = await API.get(
        API_PATHS.HISTORIQUE.AGENTS_BY_ID.replace(":id_agent", cleanId)
      );
      setTransactions(resTrans.data.data);
    } catch (err) {
      toast.error("Erreur lors du chargement des données");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  if (isLoading) return <LoadingState />;
  if (!user)
    return <div className="p-10 text-center font-bold">Agent introuvable.</div>;

  const triggerResetPassword = () => {
    setConfirmConfig({
      show: true,
      title: "Réinitialisation",
      message:
        "Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet agent à 'Test1234' ?",
      isDangerous: true,
      action: async () => {
        try {
          setIsProcessing(true);
          const cleanId = id.replace("id=", "").split("_")[0].trim();
          await API.patch(
            API_PATHS.USERS.RESET_PASSWORD.replace(":id", cleanId)
          );
          toast.success("Mot de passe réinitialisé");
          setConfirmConfig((p) => ({ ...p, show: false }));
          setShowManageModal(false);
        } catch (err) {
          toast.error("Erreur de réinitialisation");
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const triggerToggleRestriction = () => {
    setConfirmConfig({
      show: true,
      title: user.restriction ? "Réactivation" : "Restriction",
      message: `Voulez-vous modifier le statut d'accès de ${user.nom} ?`,
      action: async () => {
        try {
          setIsProcessing(true);
          const cleanId = id.replace("id=", "").split("_")[0].trim();
          const res = await API.patch(
            API_PATHS.USERS.RESTRICT_USER.replace(":id", cleanId)
          );
          setUser((prev) => ({
            ...prev,
            restriction: res.data.data.restriction,
          }));
          toast.success("Statut mis à jour");
          setConfirmConfig((p) => ({ ...p, show: false }));
          setShowManageModal(false);
        } catch (err) {
          toast.error("Erreur de modification");
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8 animate-fadeIn">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* --- NAVIGATION --- */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/users")}
            className="flex items-center gap-2 text-slate-400 hover:text-[#EF233C] transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={16} /> Retour à la liste
          </button>
          <div className="flex gap-2">
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-500 shadow-sm transition-all">
              <Mail size={18} />
            </button>
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-500 shadow-sm transition-all">
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* --- HEADER --- */}
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
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                    {user.nom} {user.prenoms}
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
            label="Mouvements Financiers"
            active={activeTab === "transactions"}
            onClick={() => setActiveTab("transactions")}
          />
          <TabButton
            label="Bilan & Balance"
            active={activeTab === "bilan"}
            onClick={() => setActiveTab("bilan")}
          />
          <TabButton
            label="Détails de l'Agent"
            active={activeTab === "informations"}
            onClick={() => setActiveTab("informations")}
          />
        </div>

        {/* --- CONTENT --- */}
        <div className="transition-all duration-300">
          {activeTab === "transactions" && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 sticky top-0 z-10">
                  <tr>
                    <th className="px-8 py-5">Date & Heure</th>
                    <th className="px-8 py-5">Désignation de l'opération</th>
                    <th className="px-8 py-5 text-right">Impact Solde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.map((t) => {
                    const isPos =
                      t.type === "Rechargement" ||
                      t.type === "Remboursement" ||
                      t.type === "Retour";
                    return (
                      <tr
                        key={t._id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-2.5 rounded-2xl ${
                                isPos
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {isPos ? (
                                <ArrowDownLeft size={18} />
                              ) : (
                                <ArrowUpRight size={18} />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800">
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
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-slate-800 uppercase">
                            {t.description}
                          </p>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border mt-1.5 inline-block ${
                              isPos
                                ? "border-emerald-200 text-emerald-600 bg-emerald-50"
                                : "border-slate-200 text-slate-500 bg-slate-50"
                            }`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td
                          className={`px-8 py-6 text-right font-black text-base ${
                            isPos ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {isPos ? "+" : "-"}{" "}
                          {Math.abs(t.montant)?.toLocaleString()}{" "}
                          <small className="text-[10px]">MRU</small>
                          <p className="text-[9px] text-slate-300 font-bold uppercase mt-1">
                            Nouveau: {t.soldeApres?.toLocaleString()}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* --- ONGLET BILAN DÉBIT / CRÉDIT --- */}
          {activeTab === "bilan" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                {/* Header du tableau */}
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                      Bilan Débit / Crédit
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                      Analyse des flux financiers de l'agent
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-[9px] font-black text-emerald-600 uppercase">
                        Total Crédits
                      </p>
                      <p className="text-sm font-black text-emerald-700">
                        +{bilanData.totalEntrees.toLocaleString()} MRU
                      </p>
                    </div>
                    <div className="px-4 py-2 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-[9px] font-black text-red-600 uppercase">
                        Total Débits
                      </p>
                      <p className="text-sm font-black text-red-700">
                        -{bilanData.totalSorties.toLocaleString()} MRU
                      </p>
                    </div>
                  </div>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                    <tr>
                      <th className="px-8 py-4">Désignation de l'opération</th>
                      <th className="px-8 py-4 text-center">Nombre</th>
                      <th className="px-8 py-4 text-right text-red-400">
                        Débit (-)
                      </th>
                      <th className="px-8 py-4 text-right text-emerald-400">
                        Crédit (+)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {bilanData.entries.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`size-2 rounded-full ${
                                item.isPositive
                                  ? "bg-emerald-500"
                                  : "bg-red-500"
                              }`}
                            />
                            <span className="text-xs font-black text-slate-700 uppercase">
                              {item.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
                            {item.count} ops
                          </span>
                        </td>
                        {/* Colonne DÉBIT */}
                        <td className="px-8 py-6 text-right font-bold text-slate-600">
                          {!item.isPositive ? (
                            <span className="text-red-600 font-black">
                              {item.total.toLocaleString()}{" "}
                              <small className="text-[9px]">MRU</small>
                            </span>
                          ) : (
                            <span className="text-slate-200">-</span>
                          )}
                        </td>
                        {/* Colonne CRÉDIT */}
                        <td className="px-8 py-6 text-right font-bold text-slate-600">
                          {item.isPositive ? (
                            <span className="text-emerald-600 font-black">
                              {item.total.toLocaleString()}{" "}
                              <small className="text-[9px]">MRU</small>
                            </span>
                          ) : (
                            <span className="text-slate-200">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Ligne de Totalisation */}
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td
                        colSpan="2"
                        className="px-8 py-6 text-xs font-black uppercase text-slate-900"
                      >
                        Totaux Périodiques
                      </td>
                      <td className="px-8 py-6 text-right font-black text-red-600 text-base">
                        {bilanData.totalSorties.toLocaleString()}{" "}
                        <small className="text-[10px]">MRU</small>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-emerald-600 text-base">
                        {bilanData.totalEntrees.toLocaleString()}{" "}
                        <small className="text-[10px]">MRU</small>
                      </td>
                    </tr>
                    <tr className="bg-slate-900">
                      <td
                        colSpan="3"
                        className="px-8 py-6 text-xs font-black uppercase text-white tracking-[0.2em]"
                      >
                        Balance Nette (Crédit - Débit)
                      </td>
                      <td
                        className={`px-8 py-6 text-right font-black text-xl ${
                          bilanData.balance >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {bilanData.balance.toLocaleString()}{" "}
                        <span className="text-[10px] text-white/50 ml-1 font-normal">
                          MRU
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {activeTab === "informations" && (
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
              <div className="space-y-6">
                <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                  <div className="absolute bottom-0 right-0 opacity-10">
                    <ShieldCheck size={120} />
                  </div>
                  <h3 className="text-[10px] font-black text-[#EF233C] uppercase tracking-widest mb-4">
                    Sécurité
                  </h3>
                  <p className="text-sm font-bold mb-6">
                    Accès {user.restriction ? "restreint" : "opérationnel"}.
                  </p>
                  <button
                    onClick={() => setShowManageModal(true)}
                    className="w-full py-4 bg-[#EF233C] rounded-2xl text-xs font-black uppercase"
                  >
                    Gérer les accès
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS (CONSERVÉS À L'IDENTIQUE) --- */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-900 uppercase">
                Sécurité Compte
              </h3>
              <button
                onClick={() => setShowManageModal(false)}
                className="text-slate-400"
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <button
                onClick={triggerResetPassword}
                className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-800 uppercase">
                      Réinitialiser Pass
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={18} className="text-slate-300" />
              </button>
              <button
                onClick={triggerToggleRestriction}
                className={`w-full flex items-center justify-between p-5 rounded-2xl ${
                  user.restriction ? "bg-emerald-50" : "bg-red-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${
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
                      {user.restriction ? "Réactiver" : "Restreindre"}
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmConfig.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 text-center shadow-2xl">
            <div
              className={`mx-auto size-16 rounded-2xl flex items-center justify-center mb-6 ${
                confirmConfig.isDangerous
                  ? "bg-red-50 text-red-500"
                  : "bg-emerald-50 text-emerald-500"
              }`}
            >
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase mb-2">
              {confirmConfig.title}
            </h3>
            <p className="text-sm font-bold text-slate-400 mb-8">
              {confirmConfig.message}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setConfirmConfig((p) => ({ ...p, show: false }))}
                className="py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase"
              >
                Annuler
              </button>
              <button
                onClick={confirmConfig.action}
                className={`py-4 rounded-2xl text-[10px] font-black uppercase text-white ${
                  confirmConfig.isDangerous ? "bg-red-500" : "bg-emerald-500"
                }`}
              >
                Confirmer
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
    className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${
      active ? "text-slate-900" : "text-slate-400"
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
  <div>
    <div className="flex items-center gap-2 text-[#EF233C] mb-1">
      {icon}
      <span className="text-[10px] font-black uppercase text-slate-400">
        {label}
      </span>
    </div>
    <p className="text-base font-bold text-slate-800 ml-6">{value || "N/A"}</p>
  </div>
);

const LoadingState = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
    <div className="size-14 border-[5px] border-[#EF233C]/10 border-t-[#EF233C] rounded-full animate-spin mb-4" />
    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">
      Chargement...
    </p>
  </div>
);

export default UserDetails;
