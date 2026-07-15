import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard, Building2, TrendingUp, Map, Lightbulb,
  ShieldAlert, LogOut, Menu, X, User, Sun, Moon,
  Users, Activity, BarChart3, Settings, Globe,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Nav items split by role
───────────────────────────────────────────── */
const USER_MENU = [
  { id: "dashboard",       label: "Dashboard",       icon: LayoutDashboard },
  { id: "businesses",      label: "Businesses",      icon: Building2        },
  { id: "predictions",     label: "AI Predictions",  icon: TrendingUp       },
  { id: "map",             label: "World Map",        icon: Map              },
  { id: "recommendations", label: "Recommendations", icon: Lightbulb        },
];

const ADMIN_MENU = [
  { id: "admin",    label: "Dashboard",   icon: LayoutDashboard },
  { id: "admin_users",       label: "Users",       icon: Users            },
  { id: "admin_businesses",  label: "Businesses",  icon: Building2        },
  { id: "admin_simulation",  label: "Simulation",  icon: Activity         },
  { id: "admin_map",         label: "World Map",   icon: Globe            },
  { id: "admin_analytics",   label: "Analytics",   icon: BarChart3        },
  { id: "admin_recommend",   label: "Recommendations", icon: Lightbulb    },
  { id: "admin_settings",    label: "Settings",    icon: Settings         },
];

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const menuItems = isAdmin ? ADMIN_MENU : USER_MENU;

  const handleNavClick = (id) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg cursor-pointer"
        style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-color)", color: "var(--text-primary)" }}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          sidebar-root fixed lg:sticky top-0 left-0 h-screen w-64 z-40
          flex flex-col justify-between
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* === TOP: Logo + Nav === */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand */}
          <div className="flex items-center gap-3 px-5 py-5 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border-color)" }}>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #0891b2)",
                boxShadow: "0 0 18px rgba(124,58,237,0.45)",
              }}
            >
              <TrendingUp className="text-white" size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-xs tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 leading-none">
                ECONOMIC SIM
              </h1>
              <p className="text-[10px] font-semibold uppercase mt-0.5" style={{ color: "var(--text-faint)" }}>
                {isAdmin ? "Admin Console" : "Civilization"}
              </p>
            </div>
          </div>

          {/* Role badge */}
          {isAdmin && (
            <div className="mx-4 mt-3 mb-1 flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: "rgba(168,85,247,0.10)", border: "1px solid rgba(168,85,247,0.20)" }}>
              <ShieldAlert size={13} className="text-purple-400 flex-shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Administrator</span>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* === BOTTOM: Theme + Profile + Logout === */}
        <div className="px-3 pb-4 pt-3 space-y-2 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border-color)" }}>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer text-xs font-semibold transition-all"
            style={{
              background: "var(--bg-hover)",
              border: "1px solid var(--border-color)",
              color: "var(--text-muted)",
            }}
          >
            <span className="flex items-center gap-2">
              {theme === "dark"
                ? <><Sun size={14} className="text-amber-400" /><span style={{ color: "var(--text-secondary)" }}>Light Mode</span></>
                : <><Moon size={14} className="text-indigo-500" /><span style={{ color: "var(--text-secondary)" }}>Dark Mode</span></>
              }
            </span>
            <span className={`relative w-9 h-5 rounded-full flex items-center transition-colors duration-300 ${theme === "dark" ? "bg-slate-700" : "bg-indigo-500"}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${theme === "dark" ? "translate-x-0" : "translate-x-4"}`} />
            </span>
          </button>

          {/* User card */}
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: "var(--bg-hover)", border: "1px solid var(--border-color)" }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{
                background: isAdmin
                  ? "linear-gradient(135deg,rgba(168,85,247,0.3),rgba(124,58,237,0.3))"
                  : "linear-gradient(135deg,rgba(6,182,212,0.25),rgba(37,99,235,0.25))",
                border: "1.5px solid var(--border-color)",
                color: isAdmin ? "#a855f7" : "#06b6d4",
              }}
            >
              {user?.username?.[0]?.toUpperCase() || <User size={16} />}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {user?.username}
              </p>
              <span className={`badge ${isAdmin ? "badge-purple" : "badge-cyan"}`}>
                {user?.role}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.20)",
              color: "#ef4444",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
          >
            <LogOut size={15} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
