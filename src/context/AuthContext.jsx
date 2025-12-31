import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import API from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [socket, setSocket] = useState(null);

  // --- LOGIQUE SOCKET.IO ---
  const connectSocket = useCallback(
    (userId) => {
      if (socket || !userId) return; // Sécurité si userId est null

      const socketUrl =
        import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

      const newSocket = io(socketUrl, {
        withCredentials: true,
        transports: ["websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
      });

      newSocket.on("connect", () => {
        console.log("🚀 Socket connecté:", newSocket.id);
        newSocket.emit("join_room", userId);
      });

      newSocket.on("connect_error", (err) => {
        console.error("❌ Erreur Socket.io:", err.message);
      });

      setSocket(newSocket);
    },
    [socket]
  );

  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [socket]);

  // --- NORMALISATION DE L'UTILISATEUR ---
  // Cette fonction s'assure que l'utilisateur possède toujours un _id
  const normalizeUser = (userData) => {
    if (!userData) return null;
    return {
      ...userData,
      _id: userData._id || userData.id, // Map 'id' vers '_id' si nécessaire
    };
  };

  // --- LOGIQUE AUTHENTIFICATION ---
  const checkAuthStatus = async () => {
    const userStr = localStorage.getItem("_appTransit_user");
    if (userStr) {
      try {
        const rawUser = JSON.parse(userStr);
        const storedUser = normalizeUser(rawUser); // NORMALISATION

        setUser(storedUser);
        setIsAuthenticated(true);
        connectSocket(storedUser._id);
      } catch (error) {
        logout();
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuthStatus();
    return () => disconnectSocket();
  }, []);

  const login = (userData) => {
    const normalized = normalizeUser(userData); // NORMALISATION
    localStorage.setItem("_appTransit_user", JSON.stringify(normalized));
    setUser(normalized);
    setIsAuthenticated(true);
    connectSocket(normalized._id);
  };

  const logout = async () => {
    try {
      await API.get(API_PATHS.AUTH.LOGOUT);
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    } finally {
      disconnectSocket();
      localStorage.removeItem("_appTransit_user");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = { user, loading, isAuthenticated, socket, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return context;
};
