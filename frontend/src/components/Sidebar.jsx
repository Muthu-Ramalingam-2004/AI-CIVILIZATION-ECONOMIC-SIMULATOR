import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  Map,
  Lightbulb,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  User
} from "lucide-react";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "businesses", label: "Businesses", icon: Building2 },
    { id: "predictions", label: "AI Predictions", icon: TrendingUp },
    { id: "map", label: "World Map", icon: Map },
    { id: "recommendations", label: "Recommendations", icon: Lightbulb },
    ...(user?.role === "admin"
      ? [{ id: "admin", label: "Admin Panel", icon: ShieldAlert }]
      : []),
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900/80 border border-white/10 rounded-lg text-slate-200 cursor-pointer"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 z-40 transition-transform duration-300 transform lg:transform-none glass-panel rounded-none border-y-0 border-l-0 flex flex-col justify-between p-4 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center shadow-neon-purple">
              <TrendingUp className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                ECONOMIC
              </h1>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">
                Civilization Sim
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-400 border-l-4 border-cyan-500 font-bold"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-cyan-400" : ""} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile section */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center gap-3 px-2 py-3 mb-3 bg-white/5 rounded-xl border border-white/5">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300">
              <User size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-100 truncate">
                {user?.username}
              </p>
              <span className="text-[10px] bg-cyan-900/50 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
