import axios from "axios";

const options = {
  // Priorité à la variable d'env, sinon fallback sur l'URL de votre backend
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Indispensable pour l'envoi/réception des cookies JWT
  timeout: 10000, // Réduit à 10s (80s est trop long pour l'UX login)
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

const API = axios.create(options);

// --- Intercepteur de Requête ---
API.interceptors.request.use(
  (config) => {
    // Note : Le token est géré par les cookies (HttpOnly),
    // donc pas besoin d'injection manuelle dans les headers ici.
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Intercepteur de Réponse : Gestion des Erreurs Globales ---
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, code } = error;

    if (response) {
      const { status, data } = response;

      // 1. Gestion spécifique 401 (Non autorisé / Session expirée)
      if (status === 401) {
        // On évite de boucler si on est déjà sur la page de login
        if (!window.location.pathname.includes("login")) {
          console.warn("Session expirée. Nettoyage et redirection...");

          // Mise à jour des clés pour correspondre à votre AuthContext
          localStorage.removeItem("_appTransit_user");

          // Redirection forcée vers le login
          window.location.href = "/login";
        }
      }

      // 2. Erreur Serveur
      if (status === 500) {
        console.error("Erreur critique du serveur (500).");
      }

      // On renvoie l'erreur formatée pour que le catch du Login.jsx la reçoive
      return Promise.reject(data || { message: "Une erreur est survenue" });
    }

    // 3. Gestion du Timeout
    if (code === "ECONNABORTED") {
      return Promise.reject({
        message: "Le serveur est trop lent à répondre (Timeout).",
        success: false,
      });
    }

    // 4. Erreur Réseau (Serveur éteint)
    return Promise.reject({
      message: "Impossible de contacter le serveur. Vérifiez votre connexion.",
      success: false,
    });
  }
);

export default API;
