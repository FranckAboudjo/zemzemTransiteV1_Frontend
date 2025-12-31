import React, { useEffect, useState } from "react";
import API from "../../utils/axiosInstance"; // Ajuste le chemin selon ton projet
import { API_PATHS } from "../../utils/apiPaths"; // Ajuste le chemin selon ton projet
import { Loader2 } from "lucide-react";

const StatsCard = ({
  title,
  period = "day", // day, week, month, year
  subtitle,
  icon: Icon,
  variant = "white",
}) => {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const isIndigo = variant === "indigo";

  useEffect(() => {
    const fetchAndCalculate = async () => {
      try {
        setLoading(true);
        const res = await API.get(
          API_PATHS.PAIEMENTCHARGE.GET_ALL_PAIEMENT_CHARGE
        );
        const payments = res.data.data || [];

        const now = new Date();
        const startOfPeriod = new Date();

        // Définition de la période de calcul
        if (period === "day") startOfPeriod.setHours(0, 0, 0, 0);
        if (period === "week") startOfPeriod.setDate(now.getDate() - 7);
        if (period === "month") startOfPeriod.setMonth(now.getMonth(), 1);
        if (period === "year")
          startOfPeriod.setFullYear(now.getFullYear(), 0, 1);

        const total = payments
          .filter((p) => new Date(p.date) >= startOfPeriod)
          .reduce((sum, p) => sum + p.montant, 0);

        setAmount(total);
      } catch (err) {
        console.error("Erreur StatsCard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculate();
  }, [period]);

  return (
    <div
      className={`p-8 rounded-[2rem] border transition-all duration-300 h-full relative overflow-hidden group ${
        isIndigo
          ? "bg-[#0f172a] border-slate-800 text-white shadow-xl shadow-slate-200"
          : "bg-white border-slate-100 text-slate-800 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div className="space-y-1">
          <p
            className={`text-[10px] font-black uppercase tracking-[0.2em] ${
              isIndigo ? "text-indigo-300" : "text-slate-400"
            }`}
          >
            {title}
          </p>

          {loading ? (
            <Loader2 className="animate-spin text-indigo-500 mt-2" size={20} />
          ) : (
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black tracking-tighter">
                {amount.toLocaleString("fr-FR")}
              </h3>
              <span
                className={`text-[10px] font-bold ${
                  isIndigo ? "text-indigo-400" : "text-slate-400"
                }`}
              >
                MRU
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={`p-3 rounded-2xl border transition-transform duration-500 group-hover:scale-110 ${
              isIndigo
                ? "bg-slate-800 border-slate-700 text-indigo-400"
                : "bg-slate-50 border-slate-100 text-slate-900"
            }`}
          >
            <Icon size={20} strokeWidth={2.5} />
          </div>
        )}
      </div>

      {subtitle && (
        <div className="flex items-center gap-2">
          <div
            className={`h-1 w-1 rounded-full ${
              isIndigo ? "bg-indigo-400" : "bg-emerald-500"
            }`}
          ></div>
          <p
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isIndigo ? "text-indigo-300/60" : "text-slate-400"
            }`}
          >
            {subtitle}
          </p>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
