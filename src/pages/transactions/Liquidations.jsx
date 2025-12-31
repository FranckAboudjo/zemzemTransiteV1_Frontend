import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  History,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCcw,
  Container,
} from "lucide-react";
import { toast } from "react-hot-toast";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const Liquidations = () => {
  const [activeTab, setActiveTab] = useState("credit"); // "credit" ou "espece"
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const url =
        activeTab === "credit"
          ? API_PATHS.LIQUIDATION.GET_ALL_LIQUIDATION_DOUANE
          : API_PATHS.LIQUIDATION.GET_ONE_LIQUIDATION_ESPECES;

      const response = await API.get(url);
      const result = response.data?.data || response.data || [];
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      toast.error(error.message || "Erreur de récupération");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const stats = useMemo(() => {
    if (!Array.isArray(data))
      return {
        paye: 0,
        aRembourser: 0,
        totalHistorique: 0,
        historiqueCredit: 0,
        historiqueEspece: 0,
      };

    return data.reduce(
      (acc, item) => {
        const montant = parseFloat(item.montant) || 0;

        // Normalisation du type pour la comparaison (enlève accents et met en minuscule)
        const typeNormalise = item.typePaiement
          ? item.typePaiement
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
          : "";

        // 1. Stats globales
        if (item.isCreditDouane === true) {
          acc.aRembourser += montant;
        } else {
          acc.paye += montant;
        }

        // 2. Stats Historique (Somme totale)
        acc.totalHistorique += montant;

        // 3. Répartition par type (Comparaison sécurisée)
        if (typeNormalise.includes("credit")) {
          acc.historiqueCredit += montant;
        } else if (typeNormalise.includes("espece")) {
          acc.historiqueEspece += montant;
        }

        return acc;
      },
      {
        paye: 0,
        aRembourser: 0,
        totalHistorique: 0,
        historiqueCredit: 0,
        historiqueEspece: 0,
      }
    );
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.numBl?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.numLiquidation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nomClient?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleAction = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      const url =
        activeTab === "credit"
          ? API_PATHS.LIQUIDATION.PAYER_LIQUIDATION.replace(
              ":id_bl",
              selectedItem.id_bl
            ).replace(":id_charge", selectedItem.id_charge)
          : API_PATHS.LIQUIDATION.ANNULER_LIQUIDATION.replace(
              ":id_bl",
              selectedItem.id_bl
            ).replace(":id_charge", selectedItem.id_charge);

      await API.patch(url);
      toast.success(
        activeTab === "credit" ? "Remboursement effectué" : "Annulation réussie"
      );
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Erreur opération");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-8 animate-fadeIn  text-slate-900">
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-center">
          <h1 className="text-2xl font-black relative z-10">
            <span className="text-red-500">Liquidation</span>
          </h1>
          <RefreshCcw
            size={80}
            className="absolute -right-5 -bottom-5 text-white/5 rotate-12"
          />
        </div>

        {activeTab === "credit" ? (
          <>
            <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm lg:col-span-3 flex gap-8 items-center">
              <div className="flex-1">
                <Wallet className="text-red-600 mb-2" size={20} />
                <div className="text-2xl font-black">
                  {stats.aRembourser.toLocaleString()}{" "}
                  <span className="text-xs text-slate-400">MRU</span>
                </div>
                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                  Dette Crédit Douane
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* CARD TOTAL HISTORIQUE */}
            <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm">
              <History className="text-slate-900 mb-2" size={20} />
              <div className="text-xl font-black">
                {stats.totalHistorique.toLocaleString()}{" "}
                <span className="text-xs text-slate-400">MRU</span>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Total Historique
              </span>
            </div>

            {/* CARD CREDIT DOUANE PAYÉ */}
            <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm">
              <CheckCircle2 className="text-amber-600 mb-2" size={20} />
              <div className="text-xl font-black">
                {stats.historiqueCredit.toLocaleString()}{" "}
                <span className="text-xs text-slate-400">MRU</span>
              </div>
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                Réglement Crédit
              </span>
            </div>

            {/* CARD ESPECES NATIVES */}
            <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm">
              <Wallet className="text-blue-600 mb-2" size={20} />
              <div className="text-xl font-black">
                {stats.historiqueEspece.toLocaleString()}{" "}
                <span className="text-xs text-slate-400">MRU</span>
              </div>
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                Réglement Espèces
              </span>
            </div>
          </>
        )}
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm space-y-6">
        <div className="flex justify-between items-center px-2">
          <div className="flex gap-6 border-b">
            {[
              { id: "credit", label: "À Rembourser" },
              { id: "espece", label: "Liquidation Payé" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? "border-b-2 border-red-600 text-slate-900"
                    : "text-slate-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 bg-slate-100 rounded-xl text-[10px] font-bold outline-none w-64 focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Num Liquidation</th>
                <th className="px-6 py-5">num BL</th>
                <th className="px-6 py-5">Nom Client</th>
                <th className="px-6 py-5">Montant</th>
                <th className="px-6 py-5">Reglement</th>
                <th className="px-6 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-[11px] font-bold text-slate-900">
                          {new Date(item.datePaiement).toLocaleDateString()}
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">
                          {new Date(item.datePaiement).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-[11px] font-black text-slate-900 uppercase">
                          {item.numLiquidation}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-[11px] font-black text-slate-900 uppercase">
                          {item.numBl}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-[11px] font-black text-slate-900 uppercase">
                          {item.nomClient}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-[11px]">
                    {parseFloat(item.montant).toLocaleString()}{" "}
                    <span className="text-[9px] text-slate-400">MRU</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                        // On se base sur le texte du type de paiement
                        item.typePaiement === "Credit Douane"
                          ? "bg-amber-50 text-amber-600 border-amber-100" // Orange pour le Crédit
                          : "bg-blue-50 text-blue-600 border-blue-100" // Bleu pour l'Espèce
                      }`}
                    >
                      {item.typePaiement}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {activeTab === "credit" ? (
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setIsModalOpen(true);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-red-100 hover:scale-105 transition-transform"
                      >
                        Régler
                      </button>
                    ) : // ICI : Le bouton Annuler ne s'affiche que si le type est "Crédit Douane"
                    // (Puisque votre backend ne change plus le type en "Espèce" après paiement)
                    item.typePaiement === "Credit Douane" ? (
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setIsModalOpen(true);
                        }}
                        className="px-4 py-2 bg-slate-100 text-slate-600 hover:text-red-600 rounded-xl text-[9px] font-black uppercase transition-colors"
                      >
                        Annuler
                      </button>
                    ) : (
                      // Pour les liquidations de type "Espèce" natives, on ne met aucune action
                      <span className="text-[9px] text-slate-300 font-bold uppercase italic">
                        Finalisé
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CONFIRMATION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 text-center animate-scaleIn">
            <div
              className={`size-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 ${
                activeTab === "credit" ? "bg-red-50" : "bg-slate-50"
              }`}
            >
              {activeTab === "credit" ? (
                <Wallet className="text-red-600" size={32} />
              ) : (
                <AlertCircle className="text-slate-600" size={32} />
              )}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              {activeTab === "credit"
                ? "Confirmer Paiement"
                : "Annuler Remboursement"}
            </h3>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-8">
              BL: {selectedItem?.numBl} •{" "}
              {parseFloat(selectedItem?.montant).toLocaleString()} MRU
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={processing}
                className="py-4 rounded-2xl font-black uppercase text-[10px] text-slate-400 border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={handleAction}
                disabled={processing}
                className={`py-4 rounded-2xl font-black uppercase text-[10px] text-white flex items-center justify-center gap-2 transition-all shadow-xl ${
                  activeTab === "credit"
                    ? "bg-red-600 shadow-red-200"
                    : "bg-slate-900 shadow-slate-200"
                }`}
              >
                {processing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                {processing ? "Traitement..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Liquidations;
