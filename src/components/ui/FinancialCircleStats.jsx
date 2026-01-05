import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import API from "../../utils/axiosInstance"; // Ajuste le chemin selon ton projet
import { API_PATHS } from "../../utils/apiPaths"; // Ajuste le chemin selon ton projet

const FinancialCircleStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    day: 0,
    week: 0,
    month: 0,
    year: 0,
    monthProgress: 0, // Pourcentage de l'année écoulée
  });

  const radius = 90;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        const res = await API.get(
          API_PATHS.PAIEMENTCHARGE.GET_ALL_PAIEMENT_CHARGE
        );
        const payments = res.data.data || [];

        const now = new Date();
        // Calcul du progrès de l'année (ex: Mois 12 sur 12)
        const currentMonth = now.getMonth() + 1;
        const yearPercentage = (currentMonth / 12) * 100;

        const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
        const startOfWeek = new Date();
        startOfWeek.setDate(now.getDate() - 7);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const totals = payments.reduce(
          (acc, p) => {
            const pDate = new Date(p.date);
            const amt = Number(p.montant) || 0;

            if (pDate >= startOfDay) acc.day += amt;
            if (pDate >= startOfWeek) acc.week += amt;
            if (pDate >= startOfMonth) acc.month += amt;
            if (pDate >= startOfYear) acc.year += amt;

            return acc;
          },
          { day: 0, week: 0, month: 0, year: 0 }
        );

        setStats({ ...totals, monthProgress: yearPercentage });
      } catch (err) {
        console.error("Erreur stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  // Calcul dynamique de l'offset basé sur les mois écoulés
  const offset = circumference - (stats.monthProgress / 100) * circumference;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      {/* Graphique Circulaire SVG */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-slate-50"
          />
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset: offset,
              transition: "stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            strokeLinecap="round"
            className="text-indigo-600 shadow-xl"
          />
        </svg>

        <div className="absolute text-center">
          <p className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">
            Total Annuel
          </p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">
            {stats.year.toLocaleString("fr-FR")}
          </p>
          <div className="mt-1 px-2 py-0.5 bg-indigo-50 rounded-full inline-block">
            <p className="text-[12px] font-black text-indigo-600 uppercase">
              Mois {Math.round((stats.monthProgress / 100) * 12)} / 12
            </p>
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="w-full grid grid-cols-3 gap-2 mt-10">
        <div className="text-center">
          <p className="text-[12px] text-slate-400 font-black uppercase mb-1">
            Jour
          </p>
          <p className="text-md font-black text-slate-800">
            {stats.day.toLocaleString()}{" "}
            <span className="text-[8px] opacity-50">MRU</span>
          </p>
        </div>
        <div className="text-center border-x border-slate-100">
          <p className="text-[12px] text-slate-400 font-black uppercase mb-1">
            Semaine
          </p>
          <p className="text-md font-black text-slate-800">
            {stats.week.toLocaleString()}{" "}
            <span className="text-[8px] opacity-50">MRU</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-[12px] text-slate-400 font-black uppercase mb-1">
            Mois
          </p>
          <p className="text-md font-black text-indigo-600">
            {stats.month.toLocaleString()}{" "}
            <span className="text-[8px] opacity-50">MRU</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialCircleStats;
