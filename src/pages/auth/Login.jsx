import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  User,
  Lock,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { API_PATHS } from "../../utils/apiPaths";
import { useAuth } from "../../context/AuthContext";
import { validateUsername, validatePassword } from "../../utils/helper";
import API from "../../utils/axiosInstance";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    password: "",
  });
  const [touched, setTouched] = useState({ username: false, password: false });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (name === "username")
      setFieldErrors((p) => ({ ...p, username: validateUsername(value) }));
    if (name === "password")
      setFieldErrors((p) => ({ ...p, password: validatePassword(value) }));
  };

  const isFormValid = () => {
    return (
      !validateUsername(formData.username) &&
      !validatePassword(formData.password) &&
      formData.username &&
      formData.password
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setIsLoading(true);
    setError("");

    try {
      const loginRes = await API.post(API_PATHS.AUTH.LOGIN, formData);
      if (loginRes.data.success) {
        const userData = loginRes.data.data;
        if (userData.restriction === true) {
          setSuccess("Vérification sécurisée...");
          setTimeout(() => navigate("/restrictions"), 800);
          return;
        }
        login(userData);
        setSuccess("Connexion établie...");
        setTimeout(() => {
          userData.role === "agent" || userData.role === "superviseur"
            ? navigate("/profile")
            : navigate("/dashboard");
        }, 1000);
      }
    } catch (err) {
      setError(err.message || "Identifiants incorrects ou accès refusé");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-body bg-[#F4F7F9] antialiased">
      {/* SECTION GAUCHE : IDENTITÉ VISUELLE */}
      <div className="hidden lg:flex flex-1 bg-[#00355E] relative items-center justify-center overflow-hidden p-16">
        {/* Cercles décoratifs soft */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#8CC63F] rounded-full opacity-[0.03] blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-blue-400 rounded-full opacity-[0.05] blur-3xl"></div>

        <div className="relative z-10 max-w-lg text-center lg:text-left">
          <div className="flex items-center gap-4 mb-16 justify-center lg:justify-start">
            <div className="bg-white p-2 rounded-xl shadow-2xl shadow-black/20">
              <img
                src="/assets/logo.png"
                alt="Zemzem Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="h-10 w-px bg-white/20 mx-1"></div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
              Zemzem<span className="text-[#8CC63F]">App</span>
            </h1>
          </div>

          <h2 className="text-6xl font-black text-white leading-[1.1] mb-8 tracking-tighter">
            Maîtrisez votre <br />
            <span className="text-[#8CC63F]">Logistique.</span>
          </h2>

          <p className="text-blue-100/70 text-xl font-medium leading-relaxed mb-10">
            La plateforme de gestion intégrée pour les professionnels du transit
            et du transport.
          </p>

          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-[#8CC63F] rounded-3xl opacity-20 blur-2xl group-hover:opacity-40 transition-opacity"></div>
            <img
              src="/assets/cargo.png"
              alt="Cargo Ship"
              className="relative z-10 w-full max-w-sm object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>

        {/* Badge de version */}
        <div className="absolute bottom-10 left-16 flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
          <div className="w-2 h-2 bg-[#8CC63F] rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-white/50 uppercase tracking-widest text-xs">
            v1.0.1 • Système Sécurisé
          </span>
        </div>
      </div>

      {/* SECTION DROITE : FORMULAIRE */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-24 bg-white relative">
        <div className="w-full max-w-[440px]">
          <div className="mb-12 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full mb-6">
              <ShieldCheck size={14} className="text-[#00355E]" />
              <span className="text-[10px] font-bold text-[#00355E] uppercase tracking-wider">
                Portail d'accès privé
              </span>
            </div>
            <h3 className="text-4xl font-black text-[#00355E] mb-3 tracking-tight">
              Ravi de vous revoir !
            </h3>
            <p className="text-slate-400 font-medium">
              Entrez vos identifiants pour accéder à votre espace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Champ Username */}
            <div className="space-y-2">
              <label className="text-xs font-black text-[#00355E] uppercase tracking-widest ml-1">
                Utilisateur
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#8CC63F] transition-colors">
                  <User size={20} />
                </div>
                <input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Ex: john_doe"
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-semibold text-[#00355E] ${
                    fieldErrors.username && touched.username
                      ? "border-red-100 bg-red-50 text-red-600"
                      : "border-slate-50 focus:border-[#8CC63F] focus:bg-white focus:shadow-xl focus:shadow-[#8CC63F]/5"
                  }`}
                />
              </div>
            </div>

            {/* Champ Password */}
            <div className="space-y-2">
              <label className="text-xs font-black text-[#00355E] uppercase tracking-widest ml-1">
                Mot de passe
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#8CC63F] transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-14 py-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-semibold text-[#00355E] ${
                    fieldErrors.password && touched.password
                      ? "border-red-100 bg-red-50 text-red-600"
                      : "border-slate-50 focus:border-[#8CC63F] focus:bg-white focus:shadow-xl focus:shadow-[#8CC63F]/5"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#00355E] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Notifications */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3 animate-shake">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold rounded-2xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                {success}
              </div>
            )}

            {/* Bouton Submit */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="w-full py-5 bg-[#00355E] hover:bg-[#002B4D] disabled:bg-slate-100 disabled:text-slate-300 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-900/20 flex justify-center items-center gap-3 group relative overflow-hidden"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <span className="relative z-10 uppercase tracking-widest text-sm">
                    Se connecter
                  </span>
                  <ChevronRight className="relative z-10 size-5 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#8CC63F] to-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
            En vous connectant, vous acceptez les conditions <br /> de sécurité
            de Zemzem Group.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
