import React, { useState, useEffect } from "react";
import { Loader2, User, Phone, UserCircle, Save, XCircle } from "lucide-react";

const UpdateUserForm = ({ user, onSubmit, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState({
    nom: "",
    prenoms: "",
    username: "",
    contact: "",
    role: "",
  });

  // Initialisation des données avec l'utilisateur existant
  useEffect(() => {
    if (user) {
      setData({
        nom: user.nom || "",
        prenoms: user.prenoms || "",
        username: user.username || "",
        contact: user.contact || "",
        role: user.role?.toLowerCase() || "agent",
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // On passe les données à la fonction onSubmit définie dans AllUsers
      await onSubmit(data);
    } catch (err) {
      // Utilisation de err.message comme demandé pour capter les erreurs serveur
      console.error("Erreur de mise à jour:");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* SÉLECTEUR DE RÔLE (STYLE ONGLETS) */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">
          Modifier Niveau d'Accès
        </label>
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
          {["agent", "superviseur", "admin"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setData({ ...data, role })}
              className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                data.role === role
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* NOM ET PRÉNOMS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">
            Nom
          </label>
          <div className="relative">
            <User
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={16}
            />
            <input
              required
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-[#EF233C] transition-all"
              value={data.nom}
              onChange={(e) =>
                setData({ ...data, nom: e.target.value.toUpperCase() })
              }
              placeholder="NOM"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">
            Prénoms
          </label>
          <input
            required
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#EF233C] transition-all"
            value={data.prenoms}
            onChange={(e) => setData({ ...data, prenoms: e.target.value })}
            placeholder="Prénoms"
          />
        </div>
      </div>

      {/* USERNAME ET CONTACT */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">
            Nom d'utilisateur
          </label>
          <div className="relative">
            <UserCircle
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={16}
            />
            <input
              required
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#EF233C] transition-all"
              value={data.username}
              onChange={(e) => setData({ ...data, username: e.target.value })}
              placeholder="Ex: baya_admin"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">
            Contact (Uniquement chiffres)
          </label>
          <div className="relative">
            <Phone
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={16}
            />
            <input
              required
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#EF233C] transition-all"
              value={data.contact}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) {
                  // Validation chiffres uniquement en temps réel
                  setData({ ...data, contact: val });
                }
              }}
              placeholder="Numéro"
            />
          </div>
        </div>
      </div>

      {/* MESSAGE D'INFORMATION (Optionnel) */}
      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tight leading-tight">
          Note: Pour des raisons de sécurité, le mot de passe ne peut être
          modifié ici. Utilisez l'option "Réinitialiser" dans les actions
          rapides.
        </p>
      </div>

      {/* BOUTONS D'ACTION */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <XCircle size={14} />
          Annuler
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-[2] py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-200 hover:bg-black transition-all active:scale-95 disabled:opacity-70"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <Save size={14} />
              Mettre à jour le profil
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default UpdateUserForm;
