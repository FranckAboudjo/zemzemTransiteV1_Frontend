// AuthContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import API from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const normalizeUser = (userData) => {
    if (!userData) return null;
    return { ...userData, _id: userData._id || userData.id };
  };

  // On utilise useCallback pour pouvoir l'appeler dans l'intercepteur plus tard
  const logout = useCallback(async () => {
    try {
      // Vérifiez si votre backend attend un POST ou un GET
      // Si la route n'existe pas encore, cette ligne génère la 404
      await API.post(API_PATHS.AUTH.LOGOUT);
    } catch (error) {
      // On log l'erreur mais on ne bloque pas l'utilisateur
      console.warn(
        "Le serveur n'a pas pu traiter la déconnexion (route inexistante ?)"
      );
    } finally {
      // Nettoyage local obligatoire
      localStorage.removeItem("_appTransit_user");
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = "/login";
    }
  }, []);

  const checkAuthStatus = async () => {
    const userStr = localStorage.getItem("_appTransit_user");

    if (userStr) {
      const rawUser = JSON.parse(userStr);
      setUser(normalizeUser(rawUser));
      setIsAuthenticated(true);

      // On vérifie quand même la session en arrière-plan sans bloquer
      try {
        await API.get(API_PATHS.AUTH.ME);
      } catch (error) {
        console.error("Session invalide sur le serveur");
        logout(); // Déconnecte seulement si le serveur confirme que la session est morte
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuthStatus();
  }, [logout]);

  const login = (userData) => {
    const normalized = normalizeUser(userData);
    localStorage.setItem("_appTransit_user", JSON.stringify(normalized));
    setUser(normalized);
    setIsAuthenticated(true);
  };

  const value = { user, loading, isAuthenticated, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return context;
};
