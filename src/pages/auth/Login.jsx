import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, User, Lock, ChevronRight } from "lucide-react";
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

  // --- LOGIQUE DE CONNEXION AVEC VÉRIFICATION DE RESTRICTION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setIsLoading(true);
    setError("");

    try {
      const loginRes = await API.post(API_PATHS.AUTH.LOGIN, formData);

      if (loginRes.data.success) {
        const userData = loginRes.data.data; // 1. Vérification immédiate de la restriction

        if (userData.restriction === true) {
          setSuccess("Vérification du compte...");
          setTimeout(() => {
            navigate("/restrictions"); // Redirection vers votre page de blocage
          }, 800);
          return; // On stoppe l'exécution ici
        } // 2. Si pas de restriction, on continue normalement

        login(userData);
        setSuccess("Authentification réussie...");

        setTimeout(() => {
          if (userData.role === "agent" || userData.role === "superviseur") {
            navigate("/profile");
          } else {
            navigate("/dashboard");
          }
        }, 1000);
      }
    } catch (err) {
      setError(err.message || "Identifiants incorrects ou erreur serveur");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-display bg-[#FAF8FA] antialiased">
      {/* SECTION GAUCHE VISUELLE */}
      <div className="hidden lg:flex flex-1 bg-[#202042] relative items-center justify-center overflow-hidden p-12">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#EF233C] rounded-full opacity-10 blur-3xl"></div>
        <div className="relative z-10 max-w-lg text-white text-center lg:text-left">
          <div className="flex items-center gap-2 mb-12 justify-center lg:justify-start">
            <div className="w-10 h-10 bg-[#EF233C] rounded-lg flex items-center justify-center font-bold text-xl">
              A
            </div>
            <h1 className="text-lg font-display text-white font-extrabold text-xl tracking-tighter">
              AppLogix <span className="text-xs text-gray-400">v1.0.1</span>
            </h1>
          </div>
          <h2 className="text-5xl font-bold text-white font-montserrat leading-tight mb-6">
            Toutes vos opérations au{" "}
            <span className="text-[#EF233C]">même endroit.</span>
          </h2>
          <p className="text-gray-300 text-lg font-light">
            Gérez vos BLs, vos clients et vos flux financiers avec performance.
          </p>
          <div className="pt-8 flex justify-center">
            <div className="relative w-72 h-72">
              <div className="absolute inset-0 bg-[#EF233C] rounded-full opacity-20 animate-pulse"></div>
              <img
                src="/assets/cargo.png"
                alt="Cargo"
                className="relative z-10 w-full h-full object-contain filter drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION DROITE FORMULAIRE */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-24 bg-white">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-3xl font-bold text-[#202042] font-montserrat mb-2">
              Bon retour !
            </h3>
            <p className="text-gray-500">
              Veuillez entrer vos accès pour continuer.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#202042] ml-1">
                Nom d'utilisateur
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EF233C] transition-colors size-5" />
                <input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="exemple_user"
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 rounded-xl outline-none transition-all ${
                    fieldErrors.username && touched.username
                      ? "border-red-400 bg-red-50"
                      : "border-gray-100 focus:border-[#EF233C] focus:bg-white"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#202042] ml-1">
                Mot de passe
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EF233C] transition-colors size-5" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 rounded-xl outline-none transition-all ${
                    fieldErrors.password && touched.password
                      ? "border-red-400 bg-red-50"
                      : "border-gray-100 focus:border-[#EF233C] focus:bg-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#202042]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm animate-shake">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="w-full py-4 bg-[#EF233C] hover:bg-[#D91E36] disabled:bg-gray-300 text-white font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Se connecter{" "}
                  <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
