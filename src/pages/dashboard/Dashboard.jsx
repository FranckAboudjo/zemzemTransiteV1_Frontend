import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  Users,
  UserCheck,
  DollarSign,
  Wallet,
  ArrowUpRight,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  HandCoins,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  // --- AUTHENTIFICATION ---
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // --- ÉTATS ---
  const [statsData, setStatsData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAmounts, setShowAmounts] = useState(false); // État pour masquer/afficher les montants

  // --- FONCTION DE MASQUAGE ---
  // Applique les points de suture si showAmounts est faux, sinon formate le nombre
  // Remplacez votre fonction mask actuelle par celle-ci
  const mask = (value) => {
    if (!showAmounts) return "••••••";

    // Gestion des cas où la donnée n'est pas encore chargée
    if (value === undefined || value === null) return "0";

    // Formatage propre
    return typeof value === "number" ? value.toLocaleString("fr-FR") : value;
  };

  // --- CHARGEMENT DES DONNÉES ---
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsResponse, historyResponse] = await Promise.all([
        API.get(API_PATHS.STAT.GET_ALL_STATS),
        API.get(API_PATHS.HISTORIQUE.CAISSE),
      ]);

      setStatsData(statsResponse.data.data || null);
      setTransactions((historyResponse.data.data || []).slice(0, 10));
    } catch (err) {
      toast.error("Erreur de récupération des données");
      console.error("Dashboard Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- CONFIGURATION DES CARTES ---
  const secondaryStats = useMemo(
    () => [
      {
        label: "TOTAL BL EN COURS",
        value: statsData?.totalBlEnCours || 0,
        sub: `Dépenses sur dossiers non facturés`,
        icon: Users,
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        isAdminOnly: false,
      },
      {
        label: "SOLDE AGENTS",
        value: statsData?.soldeAgents?.positif || 0,
        sub: `Dettes agents: ${mask(statsData?.soldeAgents?.negatif)} MRU`,
        icon: UserCheck,
        color: "text-purple-500",
        bgColor: "bg-purple-50",
        isAdminOnly: false,
      },
      {
        label: "SOLDE CLIENTS",
        value: statsData?.soldeTotalClients?.ceQueLesClientsDoivent || 0,
        sub: `Avances clients: ${mask(
          statsData?.soldeTotalClients?.ceQueNousDevonsAuxClients
        )} MRU`,
        icon: HandCoins,
        color: "text-rose-500",
        bgColor: "bg-rose-50",
        isAdminOnly: true,
      },
      {
        label: "BÉNÉFICE RÉEL",
        value: statsData?.beneficeMois || 0,
        sub: `Total liquidation: ${mask(statsData?.totalLiquidation)} MRU`,
        icon: Wallet,
        color: "text-emerald-500",
        bgColor: "bg-emerald-50",
        isAdminOnly: true,
      },
    ],
    [statsData, isAdmin, showAmounts] // Re-calculer si la visibilité change
  );

  const LockedOverlay = () => (
    <div className="absolute inset-0 bg-white/40 backdrop-blur-[6px] flex flex-col items-center justify-center rounded-3xl z-20 border border-gray-100/50 transition-all">
      <div className="bg-white p-3 rounded-full mb-2 shadow-md">
        <Lock size={20} className="text-gray-400" />
      </div>
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
        Accès Admin
      </p>
    </div>
  );

  return (
    <div className="space-y-8 p-2">
      {/* SECTION HAUTE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Solde Générale */}
        <div className="lg:col-span-2 bg-[#202042] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl border border-white/5">
          <div className="relative z-10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Solde Générale (Caisse)
            </p>
            <h3 className="text-4xl font-extrabold text-[#EF233C] flex items-baseline gap-2">
              {isLoading ? "..." : mask(statsData?.soldeGenerale)}
              <span className="text-sm font-medium text-gray-400">MRU</span>
            </h3>
            <div className="mt-6 flex items-center gap-2 text-[11px] font-bold text-[#EF233C] uppercase tracking-tighter">
              <div className="w-1.5 h-1.5 rounded-full bg-[#EF233C] animate-pulse" />
              Compte Principal Actif
            </div>
          </div>
          <TrendingUp className="absolute right-8 top-1/2 -translate-y-1/2 size-32 text-white/5" />

          {/* BARRE D'OUTILS (Masquage + Refresh) */}
          <div className="absolute top-6 right-6 flex gap-2 z-30">
            <button
              onClick={() => setShowAmounts(!showAmounts)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-95 text-white"
              title={
                showAmounts ? "Masquer les montants" : "Afficher les montants"
              }
            >
              {showAmounts ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
            <button
              onClick={fetchDashboardData}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-95 text-white"
            >
              <RefreshCw
                size={20}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Crédit Douane */}
        <div className="bg-[#EF233C] rounded-3xl p-8 text-white shadow-lg flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-bold text-[#202042] uppercase tracking-widest mb-2">
              Crédit Douane
            </p>
            <h3 className="text-4xl text-[#202042] font-extrabold flex items-baseline gap-2">
              {isLoading ? "..." : mask(statsData?.creditDouane)}
              <span className="text-sm font-medium text-white">MRU</span>
            </h3>
            <p className="text-[10px] mt-4 font-bold text-[#202042]/70 uppercase">
              Disponible en douane
            </p>
          </div>
          <ArrowUpRight
            className="absolute bottom-4 right-4 opacity-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
            size={60}
          />
        </div>
      </div>

      {/* SECTION CARTES STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {secondaryStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group"
          >
            {stat.isAdminOnly && !isAdmin && <LockedOverlay />}

            <div
              className={`flex justify-between items-start mb-4 ${
                stat.isAdminOnly && !isAdmin ? "blur-sm" : ""
              }`}
            >
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                <h4 className="text-2xl font-black text-[#202042]">
                  {isLoading ? "..." : mask(stat.value)}{" "}
                  <span className="text-xs text-gray-400 font-medium">MRU</span>
                </h4>
              </div>
              <div className={`p-3 rounded-2xl ${stat.bgColor}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
            </div>
            <p
              className={`text-[9px] font-bold text-gray-400 uppercase border-t pt-3 flex items-center gap-1.5 ${
                stat.isAdminOnly && !isAdmin ? "blur-sm" : ""
              }`}
            >
              <span
                className={`w-1 h-1 rounded-full ${stat.color.replace(
                  "text",
                  "bg"
                )}`}
              />
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* SECTION BASSE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transactions */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h4 className="text-lg font-black text-[#202042]">
              Flux de Caisse Récents
            </h4>
          </div>
          <div className="flex-1 p-4 max-h-[440px] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <RefreshCw className="animate-spin text-gray-200" />
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      {t.typeOperation === "Credit" ? (
                        <ArrowDownCircle
                          className="text-emerald-500"
                          size={24}
                        />
                      ) : (
                        <ArrowUpCircle className="text-red-500" size={24} />
                      )}
                      <div>
                        <p className="text-sm font-bold text-[#202042] line-clamp-1">
                          {t.description}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                          {t.categorie || "TRANSACTION"} •{" "}
                          {new Date(t.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-black text-sm ${
                        t.typeOperation === "Credit"
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    >
                      {t.typeOperation === "Credit" ? "+" : "-"}{" "}
                      {mask(t.montant)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-12 text-sm text-gray-400 font-medium">
                Aucun mouvement récent.
              </p>
            )}
          </div>
        </div>

        {/* Bilan Réel - RÉSERVÉ ADMIN */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col items-center relative overflow-hidden">
          {!isAdmin && <LockedOverlay />}

          <div
            className={`w-full h-full flex flex-col items-center ${
              !isAdmin ? "blur-md" : ""
            }`}
          >
            <div className="w-full flex justify-between items-center mb-8">
              <h4 className="text-lg font-black text-[#202042]">Rentabilité</h4>
              <TrendingUp size={18} className="text-emerald-500" />
            </div>

            <div className="relative flex justify-center items-center mb-8">
              <div className="size-48 rounded-full border-[12px] border-emerald-500 flex flex-col items-center justify-center shadow-inner bg-emerald-50/20">
                <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Marge Nette
                </span>
                <span className="text-2xl font-black text-[#202042]">
                  {isLoading ? "..." : mask(statsData?.beneficeGlobal)}
                </span>
                <span className="text-[9px] text-gray-400 font-bold uppercase">
                  MRU
                </span>
              </div>
            </div>

            <div className="w-full space-y-4 border-t pt-8">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  Total Facturé
                </span>
                <span className="font-black text-[#202042]">
                  {mask(statsData?.totalBlFacture)} MRU
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  Dépenses (BL En cours)
                </span>
                <span className="font-black text-blue-500">
                  {mask(statsData?.totalBlEnCours)} MRU
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  Créances Clients
                </span>
                <span className="font-black text-rose-500">
                  {mask(statsData?.soldeClients?.aRecouvrer)} MRU
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
