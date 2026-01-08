import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoutModal from "./LogoutModal";
import ProfileDropdown from "./ProfileDropdown";
import API from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

import {
  Briefcase,
  Users,
  LogOut,
  Menu,
  FolderArchive,
  X,
  LayoutDashboard,
  Settings,
  User,
  Ship,
  ChartPie,
  FileUp,
  BriefcaseBusiness,
  Search,
  Bell,
  AlertTriangle,
  Building2,
  Wallet,
} from "lucide-react";

const DashboardLayout = ({ children, activeMenu }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // --- ÉTATS ---
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // États pour l'initialisation
  const [companyName, setCompanyName] = useState("");
  const [isInitialized, setIsInitialized] = useState(true); // Évite le flash visuel au chargement

  const activeNavItem =
    activeMenu || location.pathname.split("/")[1] || "dashboard";

  // --- GESTION RESPONSIVE ---
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- VÉRIFICATION DU STATUT D'INITIALISATION ---
  useEffect(() => {
    const fetchInitStatus = async () => {
      try {
        const response = await API.get(API_PATHS.INITIALISATION.CHECK_INIT);

        // Extraction selon ton format : response.data.data.isInit
        const initStatus = response.data.data?.isInit;
        setIsInitialized(initStatus);

        if (initStatus) {
          // Extraction selon ton format : response.data.data.company.nomEntreprise
          setCompanyName(
            response.data.data.company?.nomEntreprise || "Aucune entreprise"
          );
        }
      } catch (error) {
        console.error(
          "Erreur lors de la vérification de l'initialisation:",
          error
        );
      }
    };
    fetchInitStatus();
  }, []);
  const handleNavigation = (itemId) => {
    navigate(`/${itemId}`);
    if (isMobile) setSidebarOpen(false);
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: LayoutDashboard,
      roles: ["admin"],
    },
    {
      id: "profile",
      label: "Mon Profil",
      icon: User,
      roles: ["admin", "superviseur", "agent"],
    },
    {
      id: "bls",
      label: "Bill of Lading",
      icon: Ship,
      roles: ["admin", "superviseur", "agent"],
    },
    {
      id: "clients",
      label: "Gestion Des Clients",
      icon: Users,
      roles: ["admin", "superviseur"],
    },
    {
      id: "users",
      label: "Gestion Des Agents",
      icon: Users,
      roles: ["admin", "superviseur"],
    },
    {
      id: "caisse",
      label: "Gestion de la Caisse",
      icon: Briefcase,
      roles: ["admin", "superviseur"],
    },
    {
      id: "depenses", // <--- Nouvel ID pour la route /depenses
      label: "Dépenses",
      icon: Wallet,
      roles: ["admin", "superviseur"], // Ajuste les rôles selon tes besoins
    },
    {
      id: "liquidations",
      label: "Liste des Liquidations",
      icon: FileUp,
      roles: ["admin", "superviseur"],
    },
    {
      id: "douane",
      label: "Credit Douane",
      icon: BriefcaseBusiness,
      roles: ["admin"],
    },
    {
      id: "facture",
      label: "Factures",
      icon: FileUp,
      roles: ["admin", "superviseur"],
    },

    {
      id: "archive",
      label: "Archive",
      icon: FolderArchive,
      roles: ["admin", "superviseur"],
    },

    { id: "settings", label: "Paramètres", icon: Settings, roles: ["admin"] },
  ];

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <div className="flex h-screen bg-[#FAF8FA] font-body overflow-hidden">
      {/* SIDEBAR MOBILE OVERLAY */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#202042]/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#202042] text-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#EF233C] rounded-lg flex items-center justify-center font-display font-bold text-lg">
                A
              </div>
              <h1 className="text-lg font-display text-white font-extrabold text-xl tracking-tighter">
                AppLogix <span className="text-xs text-gray-400">v1.0.1</span>
              </h1>
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
            <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-[2px] mb-4">
              Menu Principal
            </p>
            {filteredMenu.map((item) => {
              const isActive = activeNavItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all group ${
                    isActive
                      ? "bg-[#EF233C] text-white shadow-lg shadow-[#EF233C]/20"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon
                    size={18}
                    className={`${
                      isActive ? "text-white" : "group-hover:text-white"
                    }`}
                  />
                  <span className="text-[13.5px] font-medium tracking-wide">
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-glow"></div>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-6 border-t border-white/5 bg-black/10">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium text-sm group"
            >
              <LogOut
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2.5 bg-gray-50 text-[#202042] rounded-xl hover:bg-gray-100"
              >
                <Menu size={22} />
              </button>
            )}
            <div>
              <h2 className="text-xl font-display font-extrabold text-[#202042]">
                Bonjour,{" "}
                <span className="text-[#EF233C]">
                  {user?.prenoms || "Agent"}
                </span>
              </h2>
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                {user?.role || "Utilisateur"}
              </p>
            </div>
          </div>

          {/* SECTION : INFO INITIALISATION / ENTREPRISE (FORMAT CORRIGÉ) */}
          <div className="hidden md:flex items-center">
            {isInitialized ? (
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="size-8 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#202042]">
                  <Building2 size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">
                    Entreprise
                  </span>
                  <span className="text-sm font-bold text-[#202042] tracking-tight">
                    {companyName}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/initialization")}
                className="flex items-center gap-3 px-5 py-2.5 bg-red-50 border border-red-100 text-[#EF233C] rounded-2xl hover:bg-[#EF233C] hover:text-white transition-all group animate-pulse hover:animate-none"
              >
                <AlertTriangle size={18} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Initialisation Requise
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 size-4 group-focus-within:text-[#EF233C]" />
              <input
                type="text"
                placeholder="Recherche rapide..."
                className="bg-gray-50 border-transparent border-2 focus:border-[#EF233C] focus:bg-white rounded-xl py-2 pl-10 pr-4 text-sm outline-none transition-all w-48 lg:w-64"
              />
            </div>

            <button className="relative p-2.5 text-gray-400 hover:text-[#EF233C] rounded-xl hover:bg-red-50">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#EF233C] rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-px bg-gray-100 mx-2"></div>
            <ProfileDropdown />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#FAF8FA]">
          <div className="p-6 lg:p-10 max-w-[1600px] mx-auto animate-fadeIn">
            {children}
          </div>
        </main>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setIsLoggingOut(true);
          logout().finally(() => setIsLoggingOut(false));
        }}
        isLoading={isLoggingOut}
      />
    </div>
  );
};

export default DashboardLayout;
