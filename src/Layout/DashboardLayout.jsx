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

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [isInitialized, setIsInitialized] = useState(true);

  const activeNavItem =
    activeMenu || location.pathname.split("/")[1] || "dashboard";

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

  useEffect(() => {
    const fetchInitStatus = async () => {
      try {
        const response = await API.get(API_PATHS.INITIALISATION.CHECK_INIT);
        const initStatus = response.data.data?.isInit;
        setIsInitialized(initStatus);
        if (initStatus) {
          setCompanyName(
            response.data.data.company?.nomEntreprise || "Zemzem Group"
          );
        }
      } catch (error) {
        console.error("Erreur initialisation:", error);
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
      id: "depenses",
      label: "Dépenses",
      icon: Wallet,
      roles: ["admin", "superviseur"],
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
    <div className="flex h-screen bg-[#F4F7F9] font-body overflow-hidden text-slate-700">
      {/* SIDEBAR MOBILE OVERLAY */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#002B4D]/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#00355E] text-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* LOGO SECTION - Nouveau Style */}
          <div className="p-6 flex items-center justify-center border-b border-white/10 bg-[#002B4D]">
            <div className="relative group flex flex-col items-center">
              <div className="bg-white p-2 rounded-2xl shadow-xl mb-2">
                <img
                  src="/assets/logo.png"
                  alt="Zemzem Logo"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="text-center">
                <h1 className="text-lg font-black tracking-tighter text-white uppercase">
                  Zemzem<span className="text-[#8CC63F]">App</span>
                </h1>
                <p className="text-[9px] text-blue-200 font-bold tracking-widest uppercase opacity-70">
                  v1.0.1 • Logistics System
                </p>
              </div>
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-6 right-4 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            <p className="px-4 text-[10px] font-bold text-blue-300/50 uppercase tracking-[2px] mb-4">
              Navigation
            </p>
            {filteredMenu.map((item) => {
              const isActive = activeNavItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all group ${
                    isActive
                      ? "bg-[#8CC63F] text-[#00355E] shadow-lg font-bold"
                      : "text-blue-100 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon
                    size={18}
                    className={`${
                      isActive
                        ? "text-[#00355E]"
                        : "text-blue-300 group-hover:text-white"
                    }`}
                  />
                  <span className="text-[13px] tracking-wide">
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-[#00355E] rounded-full"></div>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-6 border-t border-white/10 bg-[#002B4D]/50">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-500/20 rounded-xl transition-all font-bold text-sm group"
            >
              <LogOut
                size={18}
                className="group-hover:-translate-x-1 transition-transform"
              />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white shadow-sm flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2.5 bg-slate-50 text-[#00355E] rounded-xl hover:bg-slate-100"
              >
                <Menu size={22} />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-[#00355E]">
                Bienvenue,{" "}
                <span className="text-[#4CAF50]">
                  {user?.prenoms || "Collaborateur"}
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Session {user?.role || "Utilisateur"}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isInitialized ? (
              <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="size-8 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600">
                  <Building2 size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-emerald-400 uppercase leading-none mb-0.5">
                    Entité
                  </span>
                  <span className="text-sm font-bold text-emerald-800 tracking-tight">
                    {companyName}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/initialization")}
                className="flex items-center gap-3 px-5 py-2.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl hover:bg-amber-600 hover:text-white transition-all group animate-pulse"
              >
                <AlertTriangle size={18} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Configuration requise
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 size-4 group-focus-within:text-[#005696]" />
              <input
                type="text"
                placeholder="Rechercher un BL, client..."
                className="bg-slate-50 border-slate-100 border-2 focus:border-[#005696] focus:bg-white rounded-xl py-2 pl-10 pr-4 text-sm outline-none transition-all w-48 lg:w-64 text-slate-600"
              />
            </div>

            <button className="relative p-2.5 text-slate-400 hover:text-[#005696] rounded-xl hover:bg-blue-50 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#8CC63F] rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-px bg-slate-100 mx-2"></div>
            <ProfileDropdown />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#F4F7F9]">
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
