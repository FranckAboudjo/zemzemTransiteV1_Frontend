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

const BLDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
  });

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

  // --- LOGIQUE DE FILTRAGE ET CALCULS ---

  const chargesAPayer = bl.chargesFixes?.filter((c) => !c.paye) || [];

  // CORRECTION : Le superviseur voit TOUTES les charges dans la liste,
  // la restriction de visibilité se fait uniquement sur le montant dans le tableau.
  const chargesPayees = bl.chargesFixes?.filter((c) => c.paye) || [];

  // Calcul du bénéfice en temps réel pour le modal
  const beneficeTemp = montantFacturer
    ? Number(montantFacturer) - (bl.totalSommePayer || 0)
    : 0;

  // Calcul du total décaissé affiché (Dépend du rôle)
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
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8 animate-fadeIn text-slate-900">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER ACTIONS */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-[#EF233C] font-bold text-xs uppercase transition-colors"
          >
            <ArrowLeft size={16} /> Retour
          </button>

          {userRole === "admin" && (
            <div className="flex gap-3">
              {bl.montantFacturer === 0 &&
                bl.totalChargePayer === bl.totalCharge && (
                  <button
                    onClick={() => setShowValidationModal(true)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-emerald-700 transition-all"
                  >
                    <FileCheck size={18} /> Valider & Facturer
                  </button>
                )}
              {bl.montantFacturer > 0 && (
                <button
                  onClick={() => setShowValidationModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-blue-700 transition-all"
                >
                  <Edit3 size={18} /> Modifier la Facturation
                </button>
              )}
            </div>
          )}
        </div>

        {/* INFO CARD */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase">
                BL #{bl.numBl}
              </h1>
              <div className="space-y-1 mt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <User size={12} className="text-[#EF233C]" />{" "}
                  {bl.id_client?.nom}
                </p>
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-2">
                  <Box size={10} /> {bl.nbrDeConteneur} Conteneur(s) |{" "}
                  {bl.contenance} | N° {bl.numDeConteneur}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-8">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase">
                Décaissé
              </p>
              <p className="text-xl font-black text-slate-900">
                {totalAutorise.toLocaleString()}{" "}
                <span className="text-[10px]">MRU</span>
              </p>
            </div>
            {userRole === "admin" && bl.montantFacturer > 0 && (
              <div className="text-right bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-600 uppercase">
                  Bénéfice
                </p>
                <p className="text-xl font-black text-emerald-700">
                  {bl.benefice?.toLocaleString()}{" "}
                  <span className="text-[10px]">MRU</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-8 border-b border-slate-200 px-4">
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
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400">
              <tr>
                <th className="px-8 py-4">Désignation</th>
                <th className="px-8 py-4">Payeur</th>
                <th className="px-8 py-4 text-right">Montant</th>
                <th className="px-8 py-4 text-right">Action</th>
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
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-slate-800 uppercase">
                          {charge.nom}
                        </p>
                        <p className="text-[10px] text-slate-400 italic">
                          {charge.description}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-[11px] font-bold text-slate-600 uppercase">
                        {charge.nomPayeur || "---"}
                      </td>
                      <td className="px-8 py-4 text-right font-black text-slate-900">
                        {(() => {
                          // Logique d'affichage du montant
                          if (userRole === "admin")
                            return `${charge.montant?.toLocaleString()} MRU`;
                          if (userRole === "superviseur") {
                            if (estAuteur || roleDuPayeur === "agent")
                              return `${charge.montant?.toLocaleString()} MRU`;
                          }
                          if (userRole === "agent" && estAuteur)
                            return `${charge.montant?.toLocaleString()} MRU`;

                          return (
                            <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black uppercase flex items-center justify-end gap-1">
                              <Lock size={10} /> Privé
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-8 py-4 text-right">
                        {!charge.paye ? (
                          <button
                            onClick={() => handleOpenPayment(charge)}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-[#EF233C] transition-colors"
                          >
                            Régler
                          </button>
                        ) : (
                          <div className="flex justify-end gap-3 items-center">
                            {userRole === "admin" && bl.etatBl !== "payée" && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(charge)}
                                  className="text-blue-500 hover:scale-110 transition-transform"
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  onClick={() =>
                                    setShowDeleteConfirm(charge._id)
                                  }
                                  className="text-[#EF233C] hover:scale-110 transition-transform"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
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

      {/* MODAL RÈGLEMENT */}
      <Modal
        isOpen={!!selectedCharge}
        onClose={() => setSelectedCharge(null)}
        title={`${isEditing ? "Modifier" : "Régler"} : ${selectedCharge?.nom}`}
      >
        <form onSubmit={handlePayment} className="p-6 space-y-4">
          {(() => {
            const isLiq = selectedCharge?.nom
              ?.toLowerCase()
              .includes("liquidation");
            const isAutre = selectedCharge?.nom
              ?.toLowerCase()
              .includes("autre");
            const isAdmin = userRole === "admin" || userRole === "superviseur";
            return (
              <>
                <div
                  className={`grid ${
                    isLiq && isAdmin ? "grid-cols-2" : "grid-cols-1"
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
                      // Empêche les nombres négatifs si nécessaire
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
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-[#EF233C] transition-all disabled:opacity-50"
                >
                  {submitting ? "Traitement..." : "Confirmer le règlement"}
                </button>
              </>
            );
          })()}
        </form>
      </Modal>

      {/* MODAL FACTURATION */}
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Facturation"
      >
        <form onSubmit={handleValiderBL} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                Total Décaissé
              </p>
              <p className="text-lg font-black text-slate-700">
                {bl.totalSommePayer?.toLocaleString()} MRU
              </p>
            </div>
            <div
              className={`p-4 rounded-2xl border text-center transition-colors ${
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
                className="w-full p-5 bg-slate-50 rounded-[1.5rem] text-2xl font-black outline-none border-2 border-transparent focus:border-emerald-500"
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
            className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors"
          >
            {submitting ? "Chargement..." : "Enregistrer la facture"}
          </button>
        </form>
      </Modal>

      {/* MODAL SUPPRESSION */}
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
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase"
              >
                Retour
              </button>
              <button
                onClick={confirmDeletePayment}
                className="flex-1 py-4 bg-[#EF233C] text-white rounded-2xl font-black text-xs uppercase"
              >
                Confirmer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL AJOUT CHARGE */}
      <Modal
        isOpen={showAddChargeModal}
        onClose={() => setShowAddChargeModal(false)}
        title="Nouvelle charge"
      >
        <form onSubmit={handleAddExtraCharge} className="p-6 space-y-4">
          <input
            autoFocus
            placeholder="Nom de la charge (ex: Gardiennage)..."
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

// --- COMPOSANTS INTERNES ---

const TabButton = ({ active, onClick, label, count, color }) => (
  <button
    onClick={onClick}
    className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative flex items-center gap-2 ${
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
  <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
    <div className="size-12 border-4 border-[#EF233C] border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">
      Chargement du dossier...
    </p>
  </div>
);

export default BLDetails;
