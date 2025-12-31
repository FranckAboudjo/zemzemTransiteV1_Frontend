import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Auth & Layout
import ProtectedRoutes from "./components/Auth/ProtectedRoute";
import PublicRoute from "./components/Auth/PublicRoute";
import LayoutWrapper from "./Layout/LayoutWrapper";

// Pages
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import AllUser from "./pages/users/AllUser";
import UserDetails from "./pages/users/UserDetails";
import AllClients from "./pages/clients/AllClients";
import Allbls from "./pages/bls/Allbls";
import BLDetails from "./pages/bls/BLDetails";
import SettingsPage from "./pages/parametres/SettingsPage";
import UnderConstruction from "./pages/UnderConstruction";
import InitializationPage from "./pages/InitializationPage";
import NotFound from "./pages/NotFound";
import ClientDetails from "./pages/clients/ClientDetails";
import Caisse from "./pages/transactions/Caisse";
import Profile from "./pages/users/Profile";
import Douane from "./pages/transactions/Douane";
import Factures from "./pages/documents/Factures";
import Archives from "./pages/documents/Archives";
import Liquidations from "./pages/transactions/Liquidations";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 1. ROUTE PUBLIQUE */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 2. ROUTES SOUS LAYOUT (Uniquement pour les connectés) */}
          <Route element={<ProtectedRoutes />}>
            <Route path="/initialization" element={<InitializationPage />} />

            <Route element={<LayoutWrapper />}>
              {/* --- Dashboard Commun --- */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* --- Routes ADMIN --- */}
              <Route element={<ProtectedRoutes allowedRoles={["admin"]} />}>
                <Route path="/douane" element={<Douane />} />
              </Route>

              {/* --- Routes SUPERVISEUR & ADMIN --- */}
              <Route
                element={
                  <ProtectedRoutes allowedRoles={["admin", "superviseur"]} />
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<AllUser />} />
                <Route path="/users/:id" element={<UserDetails />} />
                <Route path="/clients" element={<AllClients />} />
                <Route path="/clients/:id" element={<ClientDetails />} />
                <Route path="/caisse" element={<Caisse />} />
                <Route path="/liquidations" element={<Liquidations />} />
                <Route path="/facture" element={<UnderConstruction />} />
                <Route path="/archive" element={<Archives />} />
              </Route>

              {/* --- Routes AGENTS & TOUS --- */}
              <Route
                element={
                  <ProtectedRoutes
                    allowedRoles={["admin", "superviseur", "agent"]}
                  />
                }
              >
                <Route path="/bls" element={<Allbls />} />
                <Route path="/bls/:id" element={<BLDetails />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
