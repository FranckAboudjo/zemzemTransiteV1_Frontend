import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Wallet,
  BarChart3,
  TrendingUp,
  Calendar,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
// Importations demandées
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

// --- COMPOSANT : CARTE STATISTIQUE ---
const StatCard = ({ label, value, subValue, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm flex flex-col gap-3">
    <div className="flex justify-between items-center">
      <div className={`p-3 rounded-xl ${colorClass.bg} ${colorClass.text}`}>
        <Icon size={20} />
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <p className="text-[9px] font-bold text-slate-300 uppercase">
          {subValue}
        </p>
      </div>
    </div>
    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
      {value}
    </h3>
  </div>
);

const Depenses = () => {
  // --- ÉTATS ---
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    depenses: [],
    categories: [],
  });

  const [stats, setStats] = useState({
    mensuel: { depenses: 0, beneficeBrut: 0, beneficeReel: 0 },
    annuel: { depenses: 0, beneficeBrut: 0, beneficeReel: 0 },
  });

  const [filter, setFilter] = useState({
    mois: new Date().getMonth(),
    annee: new Date().getFullYear(),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    description: "",
    montant: "",
    id_categorieDepense: "",
    date: new Date().toISOString().split("T")[0],
  });

  // --- CHARGEMENT DES DONNÉES ---
  const loadPageData = useCallback(async () => {
    setLoading(true);
    try {
      // Utilisation de API_PATHS et de l'instance API
      const [resList, resCat, resStats] = await Promise.all([
        API.get(API_PATHS.DEPENSES.GET_ALL_DEPENSES),
        API.get(API_PATHS.CATDEPENSE.GET_ALL_CATDEPENSE),
        API.get(API_PATHS.DEPENSES.GET_DEPENSE_STATS, {
          params: { mois: filter.mois, annee: filter.annee },
        }),
      ]);

      // Adaptation aux structures de données de votre controller
      setData({
        depenses: resList.data?.data || [], // Votre responseHandler enveloppe souvent dans .data
        categories: resCat.data?.data || [],
      });

      if (resStats.data?.data) {
        setStats(resStats.data.data);
      }
    } catch (err) {
      console.error(
        "Erreur de chargement:",
        err.response?.data?.message || err.message
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  // --- ACTIONS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Conversion du montant en nombre pour le controller
      const payload = { ...form, montant: Number(form.montant) };

      await API.post(API_PATHS.DEPENSES.CREATE_DEPENSE, payload);

      setIsModalOpen(false);
      setForm({
        description: "",
        montant: "",
        id_categorieDepense: "",
        date: new Date().toISOString().split("T")[0],
      });
      loadPageData();
    } catch (err) {
      alert("Erreur: " + (err.response?.data?.message || err.message));
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm("Supprimer cette dépense ? Cela créditera la caisse.")) {
      try {
        // Remplacement dynamique de l'ID dans le path si nécessaire
        const deletePath = API_PATHS.DEPENSES.DELETE_DEPENSE.replace(":id", id);
        await API.delete(deletePath);
        loadPageData();
      } catch (err) {
        alert("Erreur: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const moisNoms = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  return (
    <div className="p-6 space-y-8 bg-[#F8FAFC] min-h-screen">
      {/* ENTÊTE */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Journal de Caisse
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase">
            Suivi des décaissements & rentabilité
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-2xl border flex items-center gap-2 shadow-sm text-xs font-black">
            <Calendar size={14} className="text-slate-400 ml-2" />
            <select
              value={filter.mois}
              onChange={(e) =>
                setFilter({ ...filter, mois: parseInt(e.target.value) })
              }
              className="bg-transparent outline-none uppercase"
            >
              {moisNoms.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={filter.annee}
              onChange={(e) =>
                setFilter({ ...filter, annee: parseInt(e.target.value) })
              }
              className="w-16 border-l pl-2 outline-none"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-500 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100 flex items-center gap-2"
          >
            <Plus size={16} /> Nouveau décaissement
          </button>
        </div>
      </div>

      {/* STATS : Connectées au controller */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Bénéfice Brut BL"
          subValue={`${moisNoms[filter.mois]}`}
          value={`${(stats.mensuel.beneficeBrut || 0).toLocaleString()} MRU`}
          icon={TrendingUp}
          colorClass={{ bg: "bg-blue-50", text: "text-blue-600" }}
        />
        <StatCard
          label="Total Dépenses"
          subValue="Sorties réelles"
          value={`${(stats.mensuel.depenses || 0).toLocaleString()} MRU`}
          icon={Wallet}
          colorClass={{ bg: "bg-red-50", text: "text-red-600" }}
        />
        <StatCard
          label="Bénéfice Net"
          subValue="Après charges"
          value={`${(stats.mensuel.beneficeReel || 0).toLocaleString()} MRU`}
          icon={BarChart3}
          colorClass={{ bg: "bg-emerald-50", text: "text-emerald-600" }}
        />
      </div>

      {/* TABLEAU */}
      <div className="bg-white rounded-[35px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Historique des transactions
          </h2>
          {loading && (
            <Loader2 size={18} className="animate-spin text-red-500" />
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-5 text-[10px] font-black uppercase text-slate-400">
                  Date
                </th>
                <th className="p-5 text-[10px] font-black uppercase text-slate-400">
                  Description
                </th>
                <th className="p-5 text-[10px] font-black uppercase text-slate-400">
                  Catégorie
                </th>
                <th className="p-5 text-[10px] font-black uppercase text-slate-400">
                  Montant
                </th>
                <th className="p-5 text-right text-[10px] font-black uppercase text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.depenses.length > 0 ? (
                data.depenses.map((dep) => (
                  <tr
                    key={dep._id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="p-5 text-xs font-bold text-slate-500">
                      {new Date(dep.date).toLocaleDateString()}
                    </td>
                    <td className="p-5 text-xs font-black text-slate-900">
                      {dep.description}
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase text-slate-500">
                        {dep.id_categorieDepense?.nom || "Non classé"}
                      </span>
                    </td>
                    <td className="p-5 text-sm font-black text-red-500">
                      -{dep.montant?.toLocaleString()} MRU
                    </td>
                    <td className="p-5 text-right">
                      <button
                        onClick={() => deleteItem(dep._id)}
                        className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="p-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest"
                  >
                    Aucune dépense enregistrée pour cette période
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black uppercase text-xs tracking-widest">
                Nouveau décaissement
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                  Catégorie
                </label>
                <select
                  required
                  className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-red-500"
                  value={form.id_categorieDepense}
                  onChange={(e) =>
                    setForm({ ...form, id_categorieDepense: e.target.value })
                  }
                >
                  <option value="">Sélectionner une catégorie...</option>
                  {data.categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-red-500"
                  placeholder="Ex: Facture SOMELEC"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                  Montant
                </label>
                <input
                  type="number"
                  required
                  className="w-full p-5 bg-slate-50 rounded-2xl text-2xl font-black text-red-500 outline-none border-2 border-transparent focus:border-red-500"
                  placeholder="0"
                  value={form.montant}
                  onChange={(e) =>
                    setForm({ ...form, montant: e.target.value })
                  }
                />
              </div>
              <button
                type="submit"
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-500 transition-all"
              >
                Valider la sortie de caisse
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Depenses;
