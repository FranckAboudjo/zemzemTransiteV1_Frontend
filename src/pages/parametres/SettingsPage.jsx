import React, { useState, useEffect } from "react";
import {
  Building2,
  User,
  ShieldCheck,
  Save,
  Key,
  Database,
  Loader2,
  Wallet,
  AlertTriangle,
  HardDrive,
  Edit3,
  Plus,
  Trash2,
  Tag,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import Modal from "../../components/ui/Modal";

const SettingsPage = () => {
  // --- ÉTATS EXISTANTS ---
  const [activeTab, setActiveTab] = useState("company");
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resetProgress, setResetProgress] = useState(0);
  const [resetLogs, setResetLogs] = useState([]);
  const [isResetting, setIsResetting] = useState(false);

  // --- NOUVEAUX ÉTATS POUR DÉPENSES ---
  const [categories, setCategories] = useState([]);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null); // null pour ajout, {id, nom} pour modif
  const [catName, setCatName] = useState("");

  const userDataLocal = JSON.parse(
    localStorage.getItem("_appTransit_user") || "{}"
  );
  const isAdmin = userDataLocal.role === "admin";
  const currentUserId = userDataLocal._id || userDataLocal.id;

  const [companyData, setCompanyData] = useState({
    nomResponsable: "",
    nomEntreprise: "",
    adresse: "",
    email: "",
    contact: "",
    pays: "",
    montant: 0,
    useCaisseCompany: false,
    isInit: false,
  });

  const [profileData, setProfileData] = useState({
    nom: "",
    prenoms: "",
    username: "",
    solde: 0,
    oldPassword: "",
    newPassword: "",
  });

  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- CHARGEMENT DES DONNÉES ---
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [resCompany, resMe, resCats] = await Promise.all([
        API.get(API_PATHS.INITIALISATION.CHECK_INIT),
        API.get(API_PATHS.AUTH.ME),
        isAdmin
          ? API.get(API_PATHS.CATDEPENSE.GET_ALL_CATDEPENSE)
          : Promise.resolve({ data: { success: true, data: [] } }),
      ]);

      if (resCompany.data.success && resCompany.data.data.company) {
        setCompanyData(resCompany.data.data.company);
      }

      if (resMe.data.success) {
        const profile = resMe.data.data;
        setProfileData((prev) => ({
          ...prev,
          nom: profile.nom,
          prenoms: profile.prenoms,
          username: profile.username,
          solde: profile.solde || 0,
        }));
      }

      if (isAdmin && resCats.data.success) {
        setCategories(resCats.data.data);
      }
    } catch (err) {
      toast.error("Erreur de synchronisation");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLERS EXISTANTS ---
  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await API.patch(
        API_PATHS.INITIALISATION.UPDATE,
        companyData
      );
      if (response.data.success) toast.success("Structure mise à jour !");
    } catch (err) {
      toast.error("Échec de la mise à jour");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSubmitting(true);
    try {
      const url = API_PATHS.USERS.UPDATE_USER.replace(":id", currentUserId);
      const response = await API.patch(url, {
        nom: profileData.nom,
        prenoms: profileData.prenoms,
      });
      if (response.data.success) {
        const currentUser = JSON.parse(
          localStorage.getItem("_appTransit_user") || "{}"
        );
        localStorage.setItem(
          "_appTransit_user",
          JSON.stringify({
            ...currentUser,
            nom: profileData.nom,
            prenoms: profileData.prenoms,
          })
        );
        toast.success("Profil mis à jour !");
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || "Erreur profil");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!profileData.newPassword)
      return toast.error("Nouveau mot de passe requis");
    setSubmitting(true);
    try {
      const response = await API.patch(API_PATHS.AUTH.UPDATE_PASSWORD, {
        oldPassword: profileData.oldPassword,
        newPassword: profileData.newPassword,
      });
      if (response.data.success) {
        toast.success("Sécurité mise à jour");
        setProfileData((p) => ({ ...p, oldPassword: "", newPassword: "" }));
      }
    } catch (err) {
      toast.error(err.message || "Ancien mot de passe incorrect");
    } finally {
      setSubmitting(false);
    }
  };

  // --- NOUVEAUX HANDLERS : CATÉGORIES ---
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName) return toast.error("Le nom est requis");
    setSubmitting(true);
    try {
      if (editingCat) {
        const url = API_PATHS.CATDEPENSE.UPDATE_CATDEPENSE.replace(
          ":id",
          editingCat._id
        );
        await API.patch(url, { nom: catName });
        toast.success("Catégorie modifiée");
      } else {
        await API.post(API_PATHS.CATDEPENSE.CREATE_CATDEPENSE, {
          nom: catName,
        });
        toast.success("Catégorie ajoutée");
      }
      setCatName("");
      setIsCatModalOpen(false);
      setEditingCat(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Action échouée");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Voulez-vous supprimer cette catégorie ?")) {
      try {
        const url = API_PATHS.CATDEPENSE.DELETE_CATDEPENSE.replace(":id", id);
        await API.delete(url);
        toast.success("Supprimé");
        fetchData();
      } catch (err) {
        toast.error(err.message || "Erreur de suppression");
      }
    }
  };

  const handleResetSystem = async () => {
    if (!confirmPassword) return toast.error("Mot de passe requis");
    setIsResetting(true);
    setResetProgress(0);
    setResetLogs(["Démarrage de la purge de sécurité (20s estimées)..."]);

    const animateTo = (target, duration) => {
      return new Promise((resolve) => {
        const start = resetProgress;
        const startTime = performance.now();
        const update = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 4);
          const currentVal = Math.floor(start + (target - start) * ease);
          setResetProgress(currentVal);
          if (progress < 1) requestAnimationFrame(update);
          else resolve();
        };
        requestAnimationFrame(update);
      });
    };

    try {
      setResetLogs((prev) => [...prev, "Vérification des accès root..."]);
      await animateTo(15, 4000);
      setResetLogs((prev) => [
        ...prev,
        "Destruction des archives BL et Factures...",
      ]);
      await animateTo(40, 6000);
      setResetLogs((prev) => [
        ...prev,
        "Nettoyage des comptes clients et soldes...",
      ]);
      await animateTo(70, 6000);
      setResetLogs((prev) => [
        ...prev,
        "Finalisation de la purge sur le serveur...",
      ]);

      const response = await API.post(API_PATHS.INITIALISATION.RESET, {
        password: confirmPassword,
      });

      if (response.data.success) {
        await animateTo(100, 4000);
        setResetLogs((prev) => [
          ...prev,
          "✅ Système totalement réinitialisé.",
        ]);
        toast.success("Purge terminée !");
        setTimeout(() => {
          localStorage.clear();
          window.location.href = "/login";
        }, 1500);
      }
    } catch (err) {
      setResetLogs((prev) => [
        ...prev,
        "❌ ÉCHEC : " + (err.message || "Erreur serveur"),
      ]);
      setResetProgress(0);
      setIsResetting(false);
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8 animate-fadeIn">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase flex items-center gap-3 tracking-tighter">
              <ShieldCheck className="text-[#EF233C]" size={32} />
              Paramètres
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
              Configuration du système & Profil
            </p>
          </div>
        </header>

        {/* NAVIGATION TABS */}
        <div className="flex gap-8 border-b border-slate-200 px-4">
          {isAdmin && (
            <>
              <TabButton
                active={activeTab === "company"}
                onClick={() => setActiveTab("company")}
                label="Entreprise"
                icon={<Building2 size={16} />}
              />
              <TabButton
                active={activeTab === "depense"}
                onClick={() => setActiveTab("depense")}
                label="Dépense"
                icon={<Wallet size={16} />}
              />
            </>
          )}
          <TabButton
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
            label="Mon Profil"
            icon={<User size={16} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* TAB ENTREPRISE */}
            {activeTab === "company" && isAdmin && (
              <section className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl space-y-8 animate-fadeIn">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase">
                      Configuration Structure
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Identité et coordonnées
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Nom de l'Entreprise"
                    value={companyData?.nomEntreprise || ""}
                    onChange={(v) =>
                      setCompanyData({ ...companyData, nomEntreprise: v })
                    }
                  />
                  <Input
                    label="Nom du Responsable"
                    value={companyData.nomResponsable || ""}
                    onChange={(v) =>
                      setCompanyData({ ...companyData, nomResponsable: v })
                    }
                  />
                  <Input
                    label="Adresse Email"
                    type="email"
                    value={companyData.email || ""}
                    onChange={(v) =>
                      setCompanyData({ ...companyData, email: v })
                    }
                  />
                  <Input
                    label="Contact Téléphonique"
                    value={companyData.contact || ""}
                    onChange={(v) =>
                      setCompanyData({ ...companyData, contact: v })
                    }
                  />
                  <Input
                    label="Pays"
                    value={companyData.pays || ""}
                    onChange={(v) =>
                      setCompanyData({ ...companyData, pays: v })
                    }
                  />
                  <Input
                    label="Adresse Siège"
                    value={companyData.adresse || ""}
                    onChange={(v) =>
                      setCompanyData({ ...companyData, adresse: v })
                    }
                  />
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                      Description de l'activité
                    </label>
                    <textarea
                      rows="3"
                      className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold text-slate-700 outline-none border-2 border-transparent focus:border-slate-900 transition-all resize-none"
                      value={companyData?.descriptionActivite || ""}
                      onChange={(e) =>
                        setCompanyData({
                          ...companyData,
                          descriptionActivite: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  onClick={handleUpdateCompany}
                  disabled={submitting}
                  className="group flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase shadow-xl hover:bg-[#EF233C] transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  Mettre à jour la structure
                </button>
              </section>
            )}

            {/* NOUVEAU TAB DÉPENSE (CATÉGORIES) */}
            {activeTab === "depense" && isAdmin && (
              <section className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl space-y-8 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-[#EF233C] flex items-center justify-center text-white shadow-lg shadow-red-100">
                      <Tag size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 uppercase">
                        Catégories de Dépense
                      </h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Gestion des étiquettes de décaissement
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCat(null);
                      setCatName("");
                      setIsCatModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#EF233C] transition-all"
                  >
                    <Plus size={16} /> Nouvelle Catégorie
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <div
                        key={cat._id}
                        className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all"
                      >
                        <span className="font-black text-slate-700 text-sm uppercase">
                          {cat.nom}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingCat(cat);
                              setCatName(cat.nom);
                              setIsCatModalOpen(true);
                            }}
                            className="p-2 bg-white text-blue-500 rounded-lg shadow-sm hover:bg-blue-50"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat._id)}
                            className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="md:col-span-2 text-center py-10 text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">
                      Aucune catégorie enregistrée
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* TAB PROFIL */}
            {activeTab === "profile" && (
              <section className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl space-y-8 animate-fadeIn">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-[#EF233C] flex items-center justify-center text-white">
                    <User size={20} />
                  </div>
                  <h2 className="text-lg font-black text-slate-900 uppercase">
                    Mon Compte Personnel
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Nom"
                    value={profileData.nom}
                    onChange={(v) => setProfileData({ ...profileData, nom: v })}
                  />
                  <Input
                    label="Prénoms"
                    value={profileData.prenoms}
                    onChange={(v) =>
                      setProfileData({ ...profileData, prenoms: v })
                    }
                  />
                </div>
                <button
                  onClick={handleUpdateProfile}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-slate-800"
                >
                  Mettre à jour le nom
                </button>
                <div className="pt-8 border-t border-slate-100">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Key size={14} /> Sécurité
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="password"
                      placeholder="Actuel"
                      className="p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-slate-200 outline-none text-sm"
                      value={profileData.oldPassword}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          oldPassword: e.target.value,
                        })
                      }
                    />
                    <input
                      type="password"
                      placeholder="Nouveau"
                      className="p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-slate-200 outline-none text-sm"
                      value={profileData.newPassword}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          newPassword: e.target.value,
                        })
                      }
                    />
                    <button
                      onClick={handleUpdatePassword}
                      className="md:col-span-2 py-4 border-2 border-slate-900 text-slate-900 rounded-2xl font-black text-xs uppercase hover:bg-slate-900 hover:text-white transition-all"
                    >
                      Changer mon mot de passe
                    </button>
                  </div>
                </div>
              </section>
            )}

            {isAdmin && (
              <div className="bg-[#EF233C]/5 rounded-[2rem] border-2 border-red-100 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h2 className="font-black text-[#EF233C] uppercase text-lg">
                    Zone Critique
                  </h2>
                  <p className="text-xs font-bold text-slate-500">
                    Réinitialiser tout le système (Factures, BL, Clients).
                  </p>
                </div>
                <button
                  onClick={() => setShowResetModal(true)}
                  className="bg-white border-2 border-[#EF233C] text-[#EF233C] px-6 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 hover:bg-[#EF233C] hover:text-white transition-all"
                >
                  <Database size={18} /> Purge Totale
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL AJOUT/MODIF CATÉGORIE */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCat ? "Modifier la catégorie" : "Nouvelle catégorie"}
      >
        <form onSubmit={handleSaveCategory} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">
              Libellé de la catégorie
            </label>
            <input
              autoFocus
              className="w-full p-5 bg-slate-50 rounded-2xl font-black text-xl border-2 border-transparent focus:border-slate-900 outline-none uppercase"
              placeholder="Ex: LOYER, ELECTRICITÉ..."
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-[#EF233C] transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            {editingCat
              ? "Enregistrer les modifications"
              : "Créer la catégorie"}
          </button>
        </form>
      </Modal>

      {/* MODAL DE RÉINITIALISATION EXISTANT */}
      <Modal
        isOpen={showResetModal}
        onClose={() => !isResetting && setShowResetModal(false)}
        title="Confirmation de Purge"
      >
        <div className="p-6 text-center space-y-6">
          {!isResetting ? (
            <>
              <div className="size-20 bg-red-100 text-[#EF233C] rounded-3xl flex items-center justify-center mx-auto">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-slate-800 uppercase text-xl">
                  Action Irréversible
                </h3>
                <p className="text-sm font-bold text-slate-500">
                  Saisir mot de passe administrateur pour confirmer.
                </p>
              </div>
              <input
                type="password"
                placeholder="Mot de passe admin..."
                className="w-full p-5 bg-slate-50 rounded-2xl text-center font-black text-xl border-2 border-transparent focus:border-[#EF233C] outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase"
                >
                  Annuler
                </button>
                <button
                  onClick={handleResetSystem}
                  className="flex-1 py-4 bg-[#EF233C] text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-red-200"
                >
                  Confirmer Purge
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase text-slate-400">
                      Statut de la purge
                    </p>
                    <p className="text-sm font-black text-slate-700 uppercase">
                      {resetProgress < 100 ? "Traitement..." : "Terminé"}
                    </p>
                  </div>
                  <span className="text-2xl font-black text-[#EF233C]">
                    {resetProgress}%
                  </span>
                </div>
                <div className="w-full h-5 bg-slate-100 rounded-2xl p-1 overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-[#EF233C] to-[#ff4d61] rounded-xl"
                    style={{
                      width: `${resetProgress}%`,
                      transition: "width 100ms linear",
                    }}
                  />
                </div>
              </div>
              <div className="bg-slate-900 rounded-2xl p-4 h-48 overflow-y-auto text-left font-mono space-y-1">
                {resetLogs.map((log, i) => (
                  <p key={i} className="text-[10px] text-emerald-400">
                    <span className="text-slate-500 mr-2">
                      [{new Date().toLocaleTimeString()}]
                    </span>
                    {log}
                  </p>
                ))}
                <div className="animate-pulse inline-block w-2 h-3 bg-emerald-400 ml-1" />
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

// --- SOUS-COMPOSANTS ---
const TabButton = ({ active, onClick, label, icon }) => (
  <button
    onClick={onClick}
    className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative flex items-center gap-2 ${
      active ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
    }`}
  >
    {icon} {label}
    {active && (
      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#EF233C] rounded-t-full" />
    )}
  </button>
);

const Input = ({ label, value, onChange, type = "text" }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
      {label}
    </label>
    <input
      type={type}
      className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-slate-900 outline-none text-sm transition-all"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const LoadingState = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
    <div className="size-12 border-4 border-[#EF233C] border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">
      Chargement...
    </p>
  </div>
);

export default SettingsPage;
