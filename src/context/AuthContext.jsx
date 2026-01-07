import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import API from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const normalizeUser = (userData) => {
    if (!userData) return null;
    return { ...userData, _id: userData._id || userData.id };
  };

  /**
   * LOGOUT
   * - Nettoyage local uniquement
   * - La redirection est centralisée ici
   */
  const logout = useCallback(async () => {
    try {
      await API.post(API_PATHS.AUTH.LOGOUT, {}, { timeout: 2000 });
    } catch {
      // silencieux
    } finally {
      localStorage.removeItem("_appTransit_user");
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);

      if (!window.location.pathname.includes("/login")) {
        window.location.replace("/login");
      }
    }
  }, []);

  /**
   * CHECK AUTH AU BOOT
   * - AUCUN appel API
   * - On fait confiance au cookie + interceptor
   */
  const checkAuthStatus = useCallback(() => {
    const userStr = localStorage.getItem("_appTransit_user");

    if (!userStr) {
      setLoading(false);
      return;
    }

    try {
      const normalized = normalizeUser(JSON.parse(userStr));
      setUser(normalized);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem("_appTransit_user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  /**
   * LOGIN
   * - appelé après succès API /login
   */
  const login = (userData) => {
    const normalized = normalizeUser(userData);
    localStorage.setItem("_appTransit_user", JSON.stringify(normalized));
    setUser(normalized);
    setIsAuthenticated(true);
    setLoading(false);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};
