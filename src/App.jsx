import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// --- COMPOSANTS DE CONTRÔLE D'ACCÈS ---
import ProtectedRoutes from "./components/Auth/ProtectedRoute";
import PublicRoute from "./components/Auth/PublicRoute";
import LayoutWrapper from "./Layout/LayoutWrapper";

// --- PAGES ---
// Authentification
import Login from "./pages/auth/Login";
import Restricted from "./pages/Restricted";

// Dashboard & Profil
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/users/Profile";
import SettingsPage from "./pages/parametres/SettingsPage";

// Utilisateurs & Clients
import AllUser from "./pages/users/AllUser";
import UserDetails from "./pages/users/UserDetails";
import AllClients from "./pages/clients/AllClients";
import ClientDetails from "./pages/clients/ClientDetails";

// Logistique & Documents
import Allbls from "./pages/bls/Allbls";
import BLDetails from "./pages/bls/BLDetails";
import Factures from "./pages/documents/Factures";
import Archives from "./pages/documents/Archives";

// Transactions & Finances
import Caisse from "./pages/transactions/Caisse";
import Douane from "./pages/transactions/Douane";
import Liquidations from "./pages/transactions/Liquidations";

// Utilitaires
import InitializationPage from "./pages/InitializationPage";
import UnderConstruction from "./pages/UnderConstruction";
import NotFound from "./pages/NotFound";
import Depenses from "./pages/depenses/Depenses";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ==========================================================
              1. ROUTES PUBLIQUES (Accessibles sans connexion)
              ========================================================== */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route path="/restrictions" element={<Restricted />} />
          {/* Redirection automatique vers le dashboard si l'utilisateur arrive sur la racine */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* ==========================================================
              2. ROUTES PRIVÉES (Nécessitent une connexion)
              ========================================================== */}
          <Route element={<ProtectedRoutes />}>
            {/* Page d'initialisation de l'entreprise (Souvent Admin) */}
            <Route path="/initialization" element={<InitializationPage />} />
            {/* --- WRAPPER AVEC SIDEBAR & NAVBAR --- */}
            <Route element={<LayoutWrapper />}>
              {/* --- ACCÈS TOUT UTILISATEUR CONNECTÉ --- */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* --- ACCÈS EXCLUSIF : ADMIN --- */}
              <Route element={<ProtectedRoutes allowedRoles={["admin"]} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/douane" element={<Douane />} />
              </Route>

              {/* --- ACCÈS : ADMIN & SUPERVISEUR --- */}
              <Route
                element={
                  <ProtectedRoutes allowedRoles={["admin", "superviseur"]} />
                }
              >
                {/* Gestion Humaine */}
                <Route path="/users" element={<AllUser />} />
                <Route path="/users/:id" element={<UserDetails />} />
                <Route path="/clients" element={<AllClients />} />
                <Route path="/clients/:id" element={<ClientDetails />} />

                {/* Gestion Financière */}
                <Route path="/caisse" element={<Caisse />} />
                <Route path="/liquidations" element={<Liquidations />} />
                <Route path="/depenses" element={<Depenses />} />

                {/* Documents & Suivi */}
                <Route path="/facture" element={<UnderConstruction />} />
                <Route path="/archive" element={<Archives />} />
              </Route>

              {/* --- ACCÈS : AGENT, SUPERVISEUR & ADMIN --- */}
              <Route
                element={
                  <ProtectedRoutes
                    allowedRoles={["admin", "superviseur", "agent"]}
                  />
                }
              >
                {/* Opérations de terrain / BL */}
                <Route path="/bls" element={<Allbls />} />
                <Route path="/bls/:id" element={<BLDetails />} />
              </Route>
            </Route>{" "}
            {/* Fin LayoutWrapper */}
          </Route>{" "}
          {/* Fin ProtectedRoutes global */}
          {/* ==========================================================
              3. GESTION DES ERREURS
              ========================================================== */}
          <Route path="*" element={<Restricted />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
