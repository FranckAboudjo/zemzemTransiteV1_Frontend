import axios from "axios";

const options = {
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Crucial pour les cookies HttpOnly
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

const API = axios.create(options);

// --- Intercepteur de Requête ---
API.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// --- Intercepteur de Réponse ---
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, code } = error;

    if (response) {
      const { status } = response;

      // 1. Gestion spécifique 401 (Session expirée après 24h)
      if (status === 401) {
        // On ne redirige pas si l'utilisateur est déjà sur la page de login
        // pour éviter des boucles infinies de redirections
        if (!window.location.pathname.includes("/login")) {
          // Nettoyage complet des données locales
          localStorage.removeItem("_appTransit_user");

          // Option A : Redirection brutale (plus fiable pour vider l'état React)
          window.location.href = "/login?session=expired";
        }
      }

      // 2. Erreur 403 (Accès refusé mais session valide)
      if (status === 403) {
        console.error("Vous n'avez pas les droits nécessaires.");
      }

      // On renvoie l'objet data complet pour que toast.error(err.message) fonctionne
      return Promise.reject(response.data || { message: "Erreur serveur" });
    }

    // 3. Gestion du Timeout
    if (code === "ECONNABORTED") {
      return Promise.reject({
        message: "Délai d'attente dépassé (Timeout).",
        success: false,
      });
    }

    // 4. Erreur Réseau
    return Promise.reject({
      message: "Connexion au serveur impossible.",
      success: false,
    });
  }
);

export default API;
