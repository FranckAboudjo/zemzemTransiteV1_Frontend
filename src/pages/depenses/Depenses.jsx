import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Wallet,
  BarChart3,
  TrendingUp,
  Calendar,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ depenses: [], categories: [] });
  const [stats, setStats] = useState({
    mensuel: { depenses: 0, beneficeBrut: 0, beneficeReel: 0 },
  });
  const [filter, setFilter] = useState({
    mois: new Date().getMonth(),
    annee: new Date().getFullYear(),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedCats, setExpandedCats] = useState({}); // Pour gérer les lignes dépliantes

  const [form, setForm] = useState({
    description: "",
    montant: "",
    id_categorieDepense: "",
    date: new Date().toISOString().split("T")[0],
  });

  // --- CHARGEMENT ---
  const loadPageData = useCallback(async () => {
    setLoading(true);
    try {
      const [resList, resCat, resStats] = await Promise.all([
        API.get(API_PATHS.DEPENSES.GET_ALL_DEPENSES),
        API.get(API_PATHS.CATDEPENSE.GET_ALL_CATDEPENSE),
        API.get(API_PATHS.DEPENSES.GET_DEPENSE_STATS, {
          params: { mois: filter.mois, annee: filter.annee },
        }),
      ]);

      setData({
        depenses: resList.data?.data || [],
        categories: resCat.data?.data || [],
      });
      if (resStats.data?.data) setStats(resStats.data.data);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  // --- LOGIQUE DE GROUPEMENT (Inspirée de l'image) ---
  const groupedDepenses = useMemo(() => {
    // 1. Filtrer par mois/année sélectionnés
    const filtered = data.depenses.filter((d) => {
      const dDate = new Date(d.date);
      return (
        dDate.getMonth() === filter.mois && dDate.getFullYear() === filter.annee
      );
    });

    // 2. Grouper par catégorie
    return filtered.reduce((acc, dep) => {
      const catName = dep.id_categorieDepense?.nom || "Non classé";
      if (!acc[catName]) acc[catName] = { list: [], total: 0 };
      acc[catName].list.push(dep);
      acc[catName].total += dep.montant;
      return acc;
    }, {});
  }, [data.depenses, filter]);

  const toggleCat = (catName) => {
    setExpandedCats((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  // --- ACTIONS ---
  const handleEdit = (dep) => {
    setEditingId(dep._id);
    setForm({
      description: dep.description,
      montant: dep.montant,
      id_categorieDepense: dep.id_categorieDepense?._id || "",
      date: new Date(dep.date).toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(
          API_PATHS.DEPENSES.UPDATE_DEPENSE.replace(":id", editingId),
          form
        );
      } else {
        await API.post(API_PATHS.DEPENSES.CREATE_DEPENSE, form);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setForm({
        description: "",
        montant: "",
        id_categorieDepense: "",
        date: new Date().toISOString().split("T")[0],
      });
      loadPageData();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur");
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm("Supprimer cette dépense ?")) {
      try {
        await API.delete(API_PATHS.DEPENSES.DELETE_DEPENSE.replace(":id", id));
        loadPageData();
      } catch (err) {
        alert("Erreur");
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
      {/* HEADER IDEM */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Journal de Caisse
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase">
            Analyse des flux financiers
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
              className="w-20 border-l pl-2 outline-none"
            />
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-red-500 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2"
          >
            <Plus size={16} /> Nouveau décaissement
          </button>
        </div>
      </div>

      {/* STATS IDEM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Bénéfice Brut"
          subValue={moisNoms[filter.mois]}
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

      {/* TABLEAU GROUPÉ (STYLE IMAGE) */}
      <div className="bg-white rounded-[35px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="p-5 text-[10px] font-black uppercase text-slate-400">
                  Dépenses / Catégories
                </th>
                <th className="p-5 text-right text-[10px] font-black uppercase text-slate-400">
                  Montant (MRU)
                </th>
                <th className="p-5 text-right text-[10px] font-black uppercase text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedDepenses).length > 0 ? (
                Object.entries(groupedDepenses).map(([catName, data]) => (
                  <React.Fragment key={catName}>
                    {/* LIGNE CATÉGORIE (PARENT) */}
                    <tr
                      className="border-b bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => toggleCat(catName)}
                    >
                      <td className="p-4 flex items-center gap-3 text-xs font-black text-slate-700">
                        {expandedCats[catName] ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                        <span className="text-blue-600 font-bold">
                          {catName}
                        </span>
                      </td>
                      <td className="p-4 text-right text-xs font-black text-slate-900">
                        {data.total.toLocaleString()}
                      </td>
                      <td className="p-4"></td>
                    </tr>

                    {/* LIGNES DÉPENSES (ENFANTS) */}
                    {expandedCats[catName] &&
                      data.list.map((dep) => (
                        <tr
                          key={dep._id}
                          className="border-b hover:bg-red-50/30 transition-colors group"
                        >
                          <td className="p-4 pl-12">
                            <div className="text-[11px] font-bold text-slate-600">
                              {dep.description}
                            </div>
                            <div className="text-[9px] text-slate-400 uppercase font-bold">
                              {new Date(dep.date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4 text-right text-xs font-black text-red-500">
                            - {dep.montant.toLocaleString()}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleEdit(dep)}
                              className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => deleteItem(dep._id)}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    className="p-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest"
                  >
                    Aucune donnée pour {moisNoms[filter.mois]} {filter.annee}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE (ADAPTÉE POUR AJOUT/MODIF) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black uppercase text-xs tracking-widest">
                {editingId
                  ? "Modifier le décaissement"
                  : "Nouveau décaissement"}
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
                {editingId ? "Mettre à jour" : "Valider la sortie"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Depenses;
