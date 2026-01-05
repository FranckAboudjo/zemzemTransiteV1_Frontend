import React, { useEffect, useState } from "react";
import { ChevronRight, Loader2, RefreshCw } from "lucide-react";
import API from "../../utils/axiosInstance"; // Ajuste le chemin selon ton projet
import { API_PATHS } from "../../utils/apiPaths"; // Ajuste le chemin selon ton projet

const TransactionTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await API.get(
        API_PATHS.PAIEMENTCHARGE.GET_ALL_PAIEMENT_CHARGE
      );
      // On récupère les données depuis res.data.data selon ta structure JSON
      setTransactions(res.data.data || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des paiements", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800">Dernières transactions</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Historique des paiements
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <RefreshCw size={18} />
          )}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase text-slate-400 font-black bg-slate-50/50">
              <th className="px-6 py-4 tracking-wider">Date</th>
              <th className="px-6 py-4 tracking-wider">Client</th>
              <th className="px-6 py-4 tracking-wider">Désignation</th>
              <th className="px-6 py-4 tracking-wider">N° BL</th>
              <th className="px-6 py-4 text-right tracking-wider">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-10 text-center text-slate-400 text-sm"
                >
                  Chargement des transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-10 text-center text-slate-400 text-sm"
                >
                  Aucune transaction trouvée.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr
                  key={t._id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-700">
                      {new Date(t.date).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(t.date).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <p className="font-bold text-slate-700 leading-none">
                      {t.clientId?.nomComplet || "Client Inconnu"}
                    </p>
                    <p className="text-[10px] text-indigo-500 font-medium mt-1">
                      {t.clientId?.codeClient}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase">
                      {t.chargeId?.designation || "Frais"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500">
                    {/* On affiche les 8 derniers caractères de l'ID du BL ou le BL ID réel */}
                    #{t.blId?.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-right text-emerald-600">
                    {t.montant.toLocaleString()}{" "}
                    <span className="text-[10px]">FCFA</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Voir Plus */}
      <div className="p-4 bg-slate-50/30 border-t border-slate-50">
        <button className="w-full py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-2">
          Voir tout l'historique <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default TransactionTable;
