import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Mail,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import API from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { toast } from "react-hot-toast";

const InitializationPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomEntreprise: "",
    nomResponsable: "",
    dateCreationEntreprise: "",
    descriptionActivite: "",
    adresse: "",
    email: "",
    contact: "",
    pays: "Mauritanie",
    capitalDepart: 0,
    creditDouane: 0, // Ajouté
    useCaisseCompany: true,
    nombreEmployes: 0,
  });

  // --- LOGIQUE DE VALIDATION ---
  const isStepValid = () => {
    switch (step) {
      case 1:
        return (
          formData.nomEntreprise.trim() !== "" &&
          formData.nomResponsable.trim() !== "" &&
          formData.dateCreationEntreprise !== ""
        );
      case 2:
        return (
          formData.adresse.trim() !== "" &&
          formData.email.trim() !== "" &&
          formData.contact.trim() !== "" &&
          formData.pays.trim() !== ""
        );
      case 3:
        return (
          formData.capitalDepart !== "" &&
          Number(formData.capitalDepart) >= 0 &&
          formData.creditDouane !== "" &&
          Number(formData.creditDouane) >= 0 // Validation crédit douane
        );
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      setStep((prev) => prev + 1);
    } else {
      toast.error("Veuillez remplir tous les champs obligatoires");
    }
  };

  const handlePrev = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (!isStepValid()) {
      toast.error("Veuillez vérifier les informations financières");
      return;
    }

    setLoading(true);
    try {
      await API.post(API_PATHS.INITIALISATION.INIT, formData);
      toast.success("Application initialisée avec succès !");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur d'initialisation");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: "Entreprise", icon: Building2 },
    { id: 2, label: "Contact", icon: Mail },
    { id: 3, label: "Finance", icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8FA] flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Barre Latérale Gauche */}
        <div className="w-full md:w-80 bg-[#202042] p-10 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-[#EF233C] rounded-2xl flex items-center justify-center mb-8 font-bold text-2xl">
              A
            </div>
            <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">
              Configuration
            </h2>
            <p className="text-gray-400 text-sm">
              Initialisez les paramètres de base d'Atlantic Transit.
            </p>
          </div>

          <div className="space-y-6">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-4 transition-all ${
                  step >= s.id ? "opacity-100" : "opacity-30"
                }`}
              >
                <div
                  className={`size-10 rounded-xl flex items-center justify-center border-2 ${
                    step === s.id
                      ? "bg-[#EF233C] border-[#EF233C]"
                      : "border-gray-500"
                  }`}
                >
                  {step > s.id ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <s.icon size={20} />
                  )}
                </div>
                <span className="font-bold text-sm uppercase tracking-widest">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-tight">
            Atlantic Transit System <br /> v1.0.0
          </div>
        </div>

        {/* Formulaire Content */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center">
          {/* ÉTAPE 1 : INFORMATION ENTREPRISE */}
          {step === 1 && (
            <div className="animate-fadeIn space-y-6">
              <header className="mb-8">
                <h3 className="text-3xl font-black text-[#202042]">
                  L'Entreprise
                </h3>
                <p className="text-gray-400 font-medium">
                  Identité de votre structure (Champs requis *)
                </p>
              </header>
              <div className="space-y-4 uppercase">
                <Input
                  className="uppercase"
                  label="Nom de l'entreprise *"
                  value={formData.nomEntreprise}
                  onChange={(v) =>
                    setFormData({ ...formData, nomEntreprise: v })
                  }
                />
                <Input
                  label="Nom du Responsable *"
                  className="uppercase"
                  value={formData.nomResponsable}
                  onChange={(v) =>
                    setFormData({ ...formData, nomResponsable: v })
                  }
                />
                <Input
                  label="Date de création *"
                  type="date"
                  value={formData.dateCreationEntreprise}
                  onChange={(v) =>
                    setFormData({ ...formData, dateCreationEntreprise: v })
                  }
                />
                <div className="relative group">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">
                    Description (Optionnel)
                  </label>
                  <textarea
                    placeholder="Description de l'activité"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#EF233C] outline-none"
                    rows="3"
                    value={formData.descriptionActivite}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        descriptionActivite: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : CONTACTS */}
          {step === 2 && (
            <div className="animate-fadeIn space-y-6">
              <header className="mb-8">
                <h3 className="text-3xl font-black text-[#202042]">
                  Contact & Localisation
                </h3>
                <p className="text-gray-400 font-medium">
                  Tous les champs sont requis *
                </p>
              </header>
              <div className="space-y-4 uppercase">
                <Input
                  label="Adresse physique *"
                  value={formData.adresse}
                  onChange={(v) => setFormData({ ...formData, adresse: v })}
                />
                <Input
                  label="Email professionnel *"
                  type="email"
                  value={formData.email}
                  onChange={(v) => setFormData({ ...formData, email: v })}
                />
                <Input
                  label="Contact téléphonique *"
                  value={formData.contact}
                  onChange={(v) => setFormData({ ...formData, contact: v })}
                />
                <Input
                  label="Pays *"
                  value={formData.pays}
                  onChange={(v) => setFormData({ ...formData, pays: v })}
                />
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : FINANCE */}
          {step === 3 && (
            <div className="animate-fadeIn space-y-6">
              <header className="mb-8">
                <h3 className="text-3xl font-black text-[#202042]">
                  Paramètres Financiers
                </h3>
                <p className="text-gray-400 font-medium">
                  Initialisation des soldes *
                </p>
              </header>
              <div className="space-y-4">
                {/* Capital Départ */}
                <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                  <label className="block text-[10px] font-black text-[#EF233C] uppercase mb-2">
                    Solde caisse (MRU) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="w-full bg-transparent text-3xl font-black text-[#202042] outline-none"
                    value={formData.capitalDepart}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capitalDepart: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Crédit Douane Ajouté */}
                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                  <label className="block text-[10px] font-black text-blue-500 uppercase mb-2">
                    Crédit Douane Initial (MRU) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="w-full bg-transparent text-3xl font-black text-[#202042] outline-none"
                    value={formData.creditDouane}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        creditDouane: e.target.value,
                      })
                    }
                  />
                </div>

                <label className="flex items-center gap-4 p-6 bg-gray-50 rounded-3xl cursor-pointer group transition-all hover:bg-white hover:shadow-lg">
                  <input
                    disabled
                    type="checkbox"
                    className="size-6 rounded-lg text-[#EF233C] focus:ring-[#EF233C] border-gray-300"
                    checked={formData.useCaisseCompany}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        useCaisseCompany: e.target.checked,
                      })
                    }
                  />
                  <div>
                    <span className="block font-black text-[#202042] uppercase text-xs">
                      Activer la Caisse Centrale
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Permet de gérer les flux de trésorerie internes.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* NAVIGATION BUTTONS */}
          <div className="mt-12 flex items-center justify-between">
            {step > 1 && (
              <button
                onClick={handlePrev}
                className="px-8 py-4 font-bold text-gray-400 hover:text-[#202042] transition-colors"
              >
                Retour
              </button>
            )}
            <div className="ml-auto flex gap-4">
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-black uppercase text-xs transition-all shadow-lg ${
                    isStepValid()
                      ? "bg-[#202042] text-white hover:bg-black"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Suivant <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !isStepValid()}
                  className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-black uppercase text-xs transition-all shadow-lg ${
                    isStepValid() && !loading
                      ? "bg-[#EF233C] text-white hover:scale-105 shadow-red-200"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Finaliser l'installation"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, type = "text", value, onChange }) => (
  <div className="relative group">
    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">
      {label}
    </label>
    <input
      type={type}
      required
      className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#202042] focus:ring-2 focus:ring-[#EF233C] outline-none transition-all group-hover:bg-gray-100"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default InitializationPage;
