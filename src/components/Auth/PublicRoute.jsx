import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Composant PublicRoute
 * Empêche un utilisateur connecté d'accéder aux pages comme le Login.
 * Style adapté au thème Atlantic Transit (Urbanist + Montserrat).
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // 1. ÉTAT DE CHARGEMENT : Spinner stylisé avec la couleur Primary (#002455)
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#faf8fa]">
        {/* Spinner avec la couleur --color-primary définie dans votre CSS */}
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
          {/* Optionnel : Un petit point fixe au centre pour le style */}
          <div className="absolute w-2 h-2 bg-primary rounded-full" />
        </div>
        <p className="mt-4 text-secondary font-display font-medium animate-pulse">
          Vérification de session...
        </p>
      </div>
    );
  }

  // 2. REDIRECTION : Si authentifié, on redirige vers le tableau de bord
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. AFFICHAGE : Sinon, on rend le composant enfant (ex: page Login)
  return children;
};

export default PublicRoute;
