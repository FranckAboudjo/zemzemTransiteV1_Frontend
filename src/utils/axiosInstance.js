import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

/**
 * Interceptor réponse
 * - 401 : session expirée → nettoyage + redirection
 * - timeout : message clair
 * - AUCUNE annulation globale
 */
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const { response, code } = error;

    // N'exécutez PAS la logique 401 pour les requêtes de login
    if (response?.status === 401) {
      // Si c'est la requête de login elle-même, ne pas rediriger
      if (
        originalRequest.url.includes("/login") ||
        originalRequest.url.includes("/auth/login")
      ) {
        return Promise.reject(error);
      }

      // Si on est déjà sur la page login, ne pas rediriger à nouveau
      if (window.location.pathname.includes("/login")) {
        return Promise.reject(error);
      }

      // Sinon, procéder à la déconnexion
      console.log("Session expirée, déconnexion...");
      localStorage.removeItem("_appTransit_user");

      // Évitez les boucles de redirection
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && !currentPath.includes("/login")) {
        // Utilisez un setTimeout pour éviter les conflits
        setTimeout(() => {
          window.location.replace("/login");
        }, 100);
      }

      return Promise.reject(error);
    }

    if (code === "ECONNABORTED" || error.message.includes("timeout")) {
      return Promise.reject({
        message: "Délai d'attente dépassé (Timeout).",
        success: false,
      });
    }

    return Promise.reject(response?.data || { message: "Erreur de connexion" });
  }
);

export default API;
