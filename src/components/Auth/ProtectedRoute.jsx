import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoutes = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Attendre que l'authentification soit chargée
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#FAF8FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EF233C]"></div>
      </div>
    );
  }

  // 2. Rediriger vers login si l'utilisateur n'est pas connecté
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Vérification des rôles (Autorisations)
  // Si l'utilisateur n'a pas le rôle requis, on le renvoie au dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si tout est OK, on affiche la route demandée
  return <Outlet />;
};

export default ProtectedRoutes;
