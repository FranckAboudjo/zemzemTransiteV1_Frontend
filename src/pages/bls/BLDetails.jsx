import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  User,
  Edit3,
  Trash2,
  AlertTriangle,
  FileCheck,
  Lock,
  PlusCircle,
  Box,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import Modal from "../../components/ui/Modal";
import Select from "react-select";

const BLDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]); // Initialisation correcte

  // Récupération des données utilisateur
  const userData = JSON.parse(localStorage.getItem("_appTransit_user"));
  const userRole = userData?.role || null;
  const currentUserId = userData?._id || userData?.id;

  const [bl, setBl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("a_payer");
  const [selectedCharge, setSelectedCharge] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [montantFacturer, setMontantFacturer] = useState("");
  const [showAddChargeModal, setShowAddChargeModal] = useState(false);
  const [newChargeName, setNewChargeName] = useState("");

  const [formData, setFormData] = useState({
    montant: "",
    description: "",
    type: "Espéce",
    numLiquidation: "",
    id_nouveau_agent: "", // <--- Nouveau champ
  });

  // Récupération des utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get(API_PATHS.USERS.GET_ALL_USERS);
        // Sécurité : on vérifie si res.data est le tableau, sinon on cherche dans res.data.data
        const dataArray = Array.isArray(res.data) ? res.data : res.data.data;

        if (Array.isArray(dataArray)) {
          setUsers(dataArray);
        } else {
          console.error("Format de données reçu incorrect:", res.data);
          setUsers([]); // On remet à vide pour éviter le crash
        }
      } catch (err) {
        console.error("Erreur chargement utilisateurs", err);
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const url = API_PATHS.BLS.GET_ONE_BL.replace(":id", id);
      const response = await API.get(url);
      if (response.data.success) {
        setBl(response.data.data);
        if (response.data.data.montantFacturer > 0) {
          setMontantFacturer(response.data.data.montantFacturer);
        }
      }
    } catch (err) {
      toast.error(err.message || "Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // --- ACTIONS ---

  const handleValiderBL = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isUpdating = bl.montantFacturer > 0;
      const url = isUpdating
        ? API_PATHS.VALIDERBL.UPDATE_VALIDERBL.replace(":id_bl", id)
        : API_PATHS.VALIDERBL.CREATE_VALIDERBL.replace(":id_bl", id);

      const payload = isUpdating
        ? { nouveauMontantFacturer: Number(montantFacturer) }
        : { montantFacturer: Number(montantFacturer) };

      const response = await (isUpdating
        ? API.patch(url, payload)
        : API.post(url, payload));
      if (response.data.success) {
        toast.success(isUpdating ? "Facturation rectifiée !" : "BL validé !");
        setShowValidationModal(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || "Erreur de validation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExtraCharge = async (e) => {
    e.preventDefault();
    if (!newChargeName.trim()) return toast.error("Nom requis");
    setSubmitting(true);
    try {
      const url = API_PATHS.BLS.ADD_NEW_CHARGE.replace(":id_bl", id);
      await API.post(url, { nomCharge: newChargeName });
      toast.success("Charge ajoutée");
      setShowAddChargeModal(false);
      setNewChargeName("");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Erreur d'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPayment = (charge) => {
    setSelectedCharge(charge);
    setIsEditing(false);
    setFormData({
      montant: charge.montant || 0,
      description: charge.nom,
      type: "Espéce",
      numLiquidation: charge.numLiquidation || "",
    });
  };

  const handleOpenEdit = (charge) => {
    setSelectedCharge(charge);
    setIsEditing(true);
    setFormData({
      montant: charge.montant,
      description: charge.description || charge.nom,
      type: charge.type || "Espéce",
      numLiquidation:
        charge.numLiquidation !== "non renseigné" ? charge.numLiquidation : "",
      id_nouveau_agent: charge.id_user_payeur || "", // <--- Initialiser avec le payeur actuel
    });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        id_charge: selectedCharge._id,
        description: formData.description,
        type: formData.type,
        numLiquidation: formData.numLiquidation,
        montant: formData.montant,
        id_nouveau_agent: formData.id_nouveau_agent, // <--- Envoyer au backend
      };
      const url = API_PATHS.PAIEMENTCHARGE.CREATE_PAIEMENT_CHARGE.replace(
        ":id_bl",
        id
      );
      if (isEditing) await API.patch(url, payload);
      else await API.post(url, payload);

      toast.success("Succès");
      setSelectedCharge(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Erreur opération");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeletePayment = async () => {
    try {
      const url = API_PATHS.PAIEMENTCHARGE.DELETE_PAIEMENT_CHARGE.replace(
        ":id_bl",
        id
      ).replace(":id_charge", showDeleteConfirm);
      await API.delete(url);
      toast.success("Paiement annulé");
      setShowDeleteConfirm(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Erreur");
    }
  };

  if (isLoading) return <LoadingState />;
  if (!bl) return null;

  const chargesAPayer = bl.chargesFixes?.filter((c) => !c.paye) || [];
  const chargesPayees = bl.chargesFixes?.filter((c) => c.paye) || [];

  const beneficeTemp = montantFacturer
    ? Number(montantFacturer) - (bl.totalSommePayer || 0)
    : 0;

  const totalAutorise = chargesPayees.reduce((acc, charge) => {
    const estAuteur = charge.id_user_payeur === currentUserId;
    const roleDuPayeur = charge.rolePayeur;
    if (userRole === "admin") return acc + (charge.montant || 0);
    if (userRole === "superviseur") {
      if (estAuteur || roleDuPayeur === "agent")
        return acc + (charge.montant || 0);
    }
    if (userRole === "agent" && estAuteur) return acc + (charge.montant || 0);
    return acc;
  }, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-3 sm:p-4 md:p-8 animate-fadeIn text-slate-900">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        {/* HEADER ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-[#EF233C] font-bold text-[10px] md:text-xs uppercase transition-colors"
          >
            <ArrowLeft size={16} /> Retour
          </button>

          {userRole === "admin" && (
            <div className="flex w-full sm:w-auto gap-2">
              {bl.montantFacturer === 0 &&
                bl.totalChargePayer === bl.totalCharge && (
                  <button
                    onClick={() => setShowValidationModal(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 md:px-6 py-3 rounded-xl md:rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-emerald-700 transition-all"
                  >
                    <FileCheck size={18} className="hidden xs:block" /> Valider
                    & Facturer
                  </button>
                )}
              {bl.montantFacturer > 0 && (
                <button
                  onClick={() => setShowValidationModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 md:px-6 py-3 rounded-xl md:rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-700 transition-all"
                >
                  <Edit3 size={18} className="hidden xs:block" /> Modifier
                  Facture
                </button>
              )}
            </div>
          )}
        </div>

        {/* INFO CARD */}
        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 border border-slate-100 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="shrink-0 size-12 md:size-14 rounded-xl md:rounded-2xl bg-slate-900 flex items-center justify-center text-white">
              <Package size={24} />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase truncate">
                BL #{bl.numBl}
              </h1>
              <div className="space-y-1 mt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <User size={12} className="text-[#EF233C]" />{" "}
                  {bl.id_client?.nom}
                </p>
                <p className="text-[11px] md:text-[12px] font-bold text-slate-500 uppercase flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Box size={10} /> {bl.nbrDeConteneur} Cont.
                  </span>
                  <span className="hidden xs:inline">|</span>
                  <span>{bl.contenance}</span>
                  <span className="hidden xs:inline">|</span>
                  <span className="text-[10px] bg-slate-50 px-2 py-0.5 rounded italic">
                    N° {bl.numDeConteneur}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full lg:w-auto justify-between lg:justify-end items-center gap-4 md:gap-8 border-t lg:border-t-0 pt-4 lg:pt-0">
            <div className="text-left lg:text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase">
                Décaissé
              </p>
              <p className="text-lg md:text-xl font-black text-slate-900">
                {totalAutorise.toLocaleString()}{" "}
                <span className="text-[10px]">MRU</span>
              </p>
            </div>
            {userRole === "admin" && bl.montantFacturer > 0 && (
              <div className="text-right bg-emerald-50 px-4 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-600 uppercase">
                  Bénéfice
                </p>
                <p className="text-lg md:text-xl font-black text-emerald-700">
                  {bl.benefice?.toLocaleString()}{" "}
                  <span className="text-[10px]">MRU</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-6 md:gap-8 border-b border-slate-200 px-2 md:px-4 overflow-x-auto scrollbar-hide">
          <TabButton
            active={activeTab === "a_payer"}
            onClick={() => setActiveTab("a_payer")}
            label="À Régler"
            count={chargesAPayer.length}
            color="bg-amber-500"
          />
          <TabButton
            active={activeTab === "payees"}
            onClick={() => setActiveTab("payees")}
            label="Payées"
            count={chargesPayees.length}
            color="bg-emerald-500"
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {/* Suppression du min-w sur mobile pour l'onglet "a_payer" pour éviter le scroll horizontal */}
            <table
              className={`w-full text-left md:min-w-full ${
                activeTab === "a_payer" ? "min-w-0" : "min-w-[600px]"
              }`}
            >
              <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400">
                <tr>
                  <th className="px-6 md:px-8 py-4">Désignation</th>
                  {/* Suppression visuelle totale sur mobile pour l'onglet A PAYER */}
                  <th
                    className={`px-6 md:px-8 py-4 ${
                      activeTab === "a_payer" ? "hidden md:table-cell" : ""
                    }`}
                  >
                    Payeur
                  </th>
                  {/* Suppression visuelle totale sur mobile pour l'onglet A PAYER */}
                  <th
                    className={`px-6 md:px-8 py-4 text-right ${
                      activeTab === "a_payer" ? "hidden md:table-cell" : ""
                    }`}
                  >
                    Montant
                  </th>
                  <th className="px-6 md:px-8 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(activeTab === "a_payer" ? chargesAPayer : chargesPayees).map(
                  (charge, idx) => {
                    const estAuteur = charge.id_user_payeur === currentUserId;
                    const roleDuPayeur = charge.rolePayeur;

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 md:px-8 py-4 md:py-5">
                          <p className="text-sm font-black text-slate-800 uppercase leading-none">
                            {charge.nom}
                          </p>
                          <p className="text-[10px] text-slate-400 italic mt-1">
                            {charge.description}
                          </p>
                        </td>
                        {/* Cellule Payeur supprimée sur mobile pour l'onglet A PAYER */}
                        <td
                          className={`px-6 md:px-8 py-4 md:py-5 text-[11px] font-bold text-slate-600 uppercase ${
                            activeTab === "a_payer"
                              ? "hidden md:table-cell"
                              : ""
                          }`}
                        >
                          {charge.nomPayeur || "---"}
                        </td>
                        {/* Cellule Montant supprimée sur mobile pour l'onglet A PAYER */}
                        <td
                          className={`px-6 md:px-8 py-4 text-right font-black text-slate-900 ${
                            activeTab === "a_payer"
                              ? "hidden md:table-cell"
                              : ""
                          }`}
                        >
                          {(() => {
                            if (userRole === "admin")
                              return `${charge.montant?.toLocaleString()} MRU`;
                            if (userRole === "superviseur") {
                              if (estAuteur || roleDuPayeur === "agent")
                                return `${charge.montant?.toLocaleString()} MRU`;
                            }
                            if (userRole === "agent" && estAuteur)
                              return `${charge.montant?.toLocaleString()} MRU`;

                            return (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black uppercase">
                                <Lock size={10} /> Privé
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 md:px-8 py-4 text-right">
                          {!charge.paye ? (
                            <button
                              onClick={() => handleOpenPayment(charge)}
                              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-[#EF233C] transition-colors"
                            >
                              Régler
                            </button>
                          ) : (
                            <div className="flex justify-end gap-3 items-center">
                              {userRole === "admin" &&
                                bl.etatBl !== "payée" && (
                                  <>
                                    <button
                                      onClick={() => handleOpenEdit(charge)}
                                      className="text-blue-500 hover:scale-110 transition-transform p-1"
                                    >
                                      <Edit3 size={15} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setShowDeleteConfirm(charge._id)
                                      }
                                      className="text-[#EF233C] hover:scale-110 transition-transform p-1"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </>
                                )}
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase">
                                <CheckCircle2 size={10} /> Payé
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {activeTab === "a_payer" &&
            (userRole === "admin" || userRole === "superviseur") && (
              <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                <button
                  onClick={() => setShowAddChargeModal(true)}
                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-[#EF233C] hover:border-[#EF233C] hover:bg-white transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase"
                >
                  <PlusCircle size={16} /> Ajouter une charge exceptionnelle
                </button>
              </div>
            )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* RÈGLEMENT / MODIFICATION */}
      <Modal
        isOpen={!!selectedCharge}
        onClose={() => setSelectedCharge(null)}
        title={`${isEditing ? "Modifier" : "Régler"} : ${selectedCharge?.nom}`}
      >
        <form onSubmit={handlePayment} className="p-4 md:p-6 space-y-4">
          {(() => {
            const isLiq = selectedCharge?.nom
              ?.toLowerCase()
              .includes("liquidation");
            const isAutre = selectedCharge?.nom
              ?.toLowerCase()
              .includes("autre");
            const isAdmin = userRole === "admin" || userRole === "superviseur";

            // Options pour le Select
            const userOptions = users.map((u) => ({
              value: u._id,
              label: `${u.nom} ${u.prenoms}`,
            }));

            return (
              <>
                {/* SECTION CHANGEMENT DE PAYEUR : Affichée uniquement en mode modification (isEditing) */}
                {isEditing && isAdmin && (
                  <div className="space-y-1 pb-2 border-b border-slate-100">
                    <label className="text-[10px] font-black text-[#EF233C] uppercase ml-2 flex items-center gap-1">
                      <User size={12} /> Réassigner le payeur (Responsable)
                    </label>
                    <Select
                      options={userOptions}
                      value={userOptions.find(
                        (o) => o.value === formData.id_nouveau_agent
                      )}
                      onChange={(opt) =>
                        setFormData({
                          ...formData,
                          id_nouveau_agent: opt.value,
                        })
                      }
                      placeholder="Sélectionner un agent..."
                      className="text-sm font-bold"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderRadius: "16px",
                          padding: "4px",
                          backgroundColor: "#fff1f2",
                          border: "none",
                        }),
                      }}
                    />
                    <p className="text-[9px] text-slate-400 ml-2 italic">
                      Note : Modifier l'agent déclenchera un remboursement sur
                      l'ancien compte et un débit sur le nouveau.
                    </p>
                  </div>
                )}

                <div
                  className={`grid ${
                    isLiq && isAdmin
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1"
                  } gap-4`}
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                      Montant
                    </label>
                    <input
                      type="number"
                      className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-slate-900 transition-all"
                      placeholder="0"
                      required
                      value={formData.montant}
                      onChange={(e) =>
                        setFormData({ ...formData, montant: e.target.value })
                      }
                      min="0"
                    />
                  </div>
                  {isLiq && isAdmin && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                        Mode
                      </label>
                      <select
                        className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-slate-900"
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                      >
                        <option value="Espéce">Espèce</option>
                        <option value="Credit Douane">Crédit Douane</option>
                      </select>
                    </div>
                  )}
                </div>

                {isLiq && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-blue-500 uppercase ml-2">
                      N° Liquidation
                    </label>
                    <input
                      required
                      placeholder="Numéro..."
                      className="w-full p-4 bg-blue-50 rounded-2xl font-bold border-2 border-blue-100 outline-none focus:border-blue-500"
                      value={formData.numLiquidation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          numLiquidation: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                    Description {!isAutre && "(Lecture seule)"}
                  </label>
                  <textarea
                    readOnly={!isAutre}
                    className={`w-full p-4 rounded-2xl font-bold outline-none border-2 border-transparent ${
                      isAutre
                        ? "bg-slate-50 focus:border-slate-900"
                        : "bg-slate-100 text-slate-400"
                    }`}
                    rows="2"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-xs transition-all disabled:opacity-50 text-white ${
                    isEditing
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-slate-900 hover:bg-[#EF233C]"
                  }`}
                >
                  {submitting
                    ? "Traitement..."
                    : isEditing
                    ? "Mettre à jour le paiement"
                    : "Confirmer le règlement"}
                </button>
              </>
            );
          })()}
        </form>
      </Modal>

      {/* FACTURATION */}
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Facturation du Dossier"
      >
        <form onSubmit={handleValiderBL} className="p-4 md:p-6 space-y-6">
          {/* RÉSUMÉ DU DOSSIER DANS LA MODALE */}
          <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-inner">
            <div className="flex justify-between items-start mb-3 border-b border-slate-700 pb-2">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Client
                </p>
                <p className="text-xs font-bold uppercase text-emerald-400">
                  {bl.id_client?.nom}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  N° BL / Code
                </p>
                <p className="text-xs font-bold uppercase">
                  {bl.numBl}{" "}
                  <span className="text-slate-500">({bl.codeBl || "---"})</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className="size-7 bg-slate-800 rounded-lg flex items-center justify-center">
                  <Box size={14} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase">
                    Volume
                  </p>
                  <p className="text-[11px] font-bold">
                    {bl.nbrDeConteneur} Conteneur(s)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-7 bg-slate-800 rounded-lg flex items-center justify-center">
                  <CheckCircle2 size={14} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase">
                    N° Conteneur
                  </p>
                  <p className="text-[11px] font-bold truncate">
                    {bl.numDeConteneur || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* INDICATEURS FINANCIERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                Total Décaissé
              </p>
              <p className="text-lg font-black text-slate-700">
                {bl.totalSommePayer?.toLocaleString()} MRU
              </p>
            </div>
            <div
              className={`p-4 rounded-2xl border text-center ${
                beneficeTemp >= 0
                  ? "bg-emerald-50 border-emerald-100"
                  : "bg-red-50 border-red-100"
              }`}
            >
              <p
                className={`text-[9px] font-black uppercase mb-1 ${
                  beneficeTemp >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                Bénéfice Prévu
              </p>
              <p
                className={`text-lg font-black ${
                  beneficeTemp >= 0 ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {beneficeTemp.toLocaleString()} MRU
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
              Montant à facturer au client
            </label>
            <div className="relative">
              <input
                type="number"
                className="w-full p-4 md:p-5 bg-slate-50 rounded-2xl md:rounded-[1.5rem] text-xl md:text-2xl font-black outline-none border-2 border-transparent focus:border-emerald-500 transition-all"
                value={montantFacturer}
                onChange={(e) => setMontantFacturer(e.target.value)}
                placeholder="0"
                required
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-300">
                MRU
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !montantFacturer}
            className="w-full py-4 md:py-5 bg-emerald-600 text-white rounded-2xl md:rounded-[1.5rem] font-black uppercase text-xs shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {submitting ? "Chargement..." : "Enregistrer la facture"}
          </button>
        </form>
      </Modal>

      {/* SUPPRESSION */}
      {showDeleteConfirm && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          title="Annuler paiement"
        >
          <div className="p-6 text-center space-y-6">
            <AlertTriangle size={48} className="mx-auto text-amber-500" />
            <p className="text-sm font-bold text-slate-600">
              Voulez-vous vraiment annuler ce paiement ? Cette action est
              irréversible.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase order-2 sm:order-1"
              >
                Retour
              </button>
              <button
                onClick={confirmDeletePayment}
                className="flex-1 py-4 bg-[#EF233C] text-white rounded-2xl font-black text-xs uppercase order-1 sm:order-2"
              >
                Confirmer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* AJOUT CHARGE */}
      <Modal
        isOpen={showAddChargeModal}
        onClose={() => setShowAddChargeModal(false)}
        title="Nouvelle charge"
      >
        <form onSubmit={handleAddExtraCharge} className="p-4 md:p-6 space-y-4">
          <input
            autoFocus
            placeholder="Nom de la charge..."
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:border-slate-900 border-2 border-transparent"
            value={newChargeName}
            onChange={(e) => setNewChargeName(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-[#EF233C] transition-colors"
          >
            Ajouter à la liste
          </button>
        </form>
      </Modal>
    </div>
  );
};

const TabButton = ({ active, onClick, label, count, color }) => (
  <button
    onClick={onClick}
    className={`shrink-0 pb-4 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all relative flex items-center gap-2 ${
      active ? "text-slate-900" : "text-slate-400"
    }`}
  >
    {label}{" "}
    <span
      className={`px-2 py-0.5 rounded-full text-[9px] ${
        active ? `${color} text-white` : "bg-slate-100 text-slate-400"
      }`}
    >
      {count}
    </span>
    {active && (
      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#EF233C] rounded-t-full" />
    )}
  </button>
);

const LoadingState = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-6 text-center">
    <div className="size-12 border-4 border-[#EF233C] border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">
      Chargement du dossier...
    </p>
  </div>
);

export default BLDetails;
