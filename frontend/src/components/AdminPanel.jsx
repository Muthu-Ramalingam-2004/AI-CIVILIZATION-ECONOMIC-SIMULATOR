import React, { useState, useEffect } from "react";
import api from "../utils/api";
import GlassCard from "./GlassCard";
import { useAuth } from "../context/AuthContext";
import {
  ShieldAlert,
  Users,
  Terminal,
  RefreshCw,
  UserCheck,
  UserX,
  Loader2,
  Trash2
} from "lucide-react";

const AdminPanel = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logFilter, setLogFilter] = useState("");
  const [resetting, setResetting] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/auth/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.get("/simulation/logs");
      setLogs(res.data);
    } catch (err) {
      console.error("Error fetching logs", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchUsers();
      fetchLogs();
    }
  }, [currentUser]);

  const handleToggleRole = async (userId, currentRole) => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`Are you sure you want to change this user's role to '${nextRole.toUpperCase()}'?`)) {
      return;
    }
    try {
      await api.put(`/auth/users/${userId}/role`, null, {
        params: { role: nextRole },
      });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update user role");
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = !currentStatus;
    if (!window.confirm(`Are you sure you want to ${nextStatus ? "activate" : "deactivate"} this user account?`)) {
      return;
    }
    try {
      await api.put(`/auth/users/${userId}/status`, null, {
        params: { is_active: nextStatus },
      });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update user status");
    }
  };

  const handleResetSim = async () => {
    if (
      !window.confirm(
        "WARNING: This will wipe all current businesses, simulation history data, alerts, and system logs, then reload the default economic seed. This action is irreversible. Proceed?"
      )
    ) {
      return;
    }
    setResetting(true);
    try {
      await api.post("/simulation/reset");
      alert("Simulation database has been fully reset to seeds.");
      fetchUsers();
      fetchLogs();
    } catch (err) {
      console.error("Error resetting database", err);
      alert(err.response?.data?.detail || "Failed to reset database");
    } finally {
      setResetting(false);
    }
  };

  // Filter logs locally
  const filteredLogs = logs.filter((log) => {
    if (!logFilter) return true;
    return (
      log.message.toLowerCase().includes(logFilter.toLowerCase()) ||
      log.level.toLowerCase() === logFilter.toLowerCase() ||
      log.category.toLowerCase() === logFilter.toLowerCase()
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 flex items-center gap-2">
          <ShieldAlert className="text-rose-500" />
          ADMIN CORE TERMINAL
        </h2>
        <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
          Authorized panel for database overrides, logs inspection, and user authorization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reset Database Overrides card */}
        <GlassCard className="lg:col-span-1 flex flex-col justify-between border-rose-500/20">
          <div>
            <div className="flex items-center gap-2.5 mb-4 text-rose-400">
              <Trash2 size={18} />
              <h3 className="font-extrabold uppercase tracking-wider text-xs">Database Controls</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Hard reset the economic workspace. Resets all AI agent coordinates, financial histories, notifications queue, and action tickers. Wipes PostgreSQL/SQLite databases and runs initial system seeder.
            </p>
          </div>

          <button
            onClick={handleResetSim}
            disabled={resetting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-glass hover:shadow-neon-purple transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {resetting ? (
              <>
                <RefreshCw className="animate-spin" size={14} />
                Clearing Database...
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                Hard Reset Database
              </>
            )}
          </button>
        </GlassCard>

        {/* User Account Authorization Ledger */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-4 text-cyan-400 border-b border-white/5 pb-2">
            <Users size={18} />
            <h3 className="font-extrabold uppercase tracking-wider text-xs">Portal Access Ledger</h3>
          </div>

          {loadingUsers ? (
            <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-1.5">
              <Loader2 className="animate-spin text-cyan-400" size={24} />
              <span>Querying users registry...</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-200">{u.username}</p>
                    <p className="text-[10px] text-slate-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      u.role === "admin" ? "bg-purple-950/20 text-purple-400 border border-purple-500/20" : "bg-slate-800 text-slate-400"
                    }`}>
                      {u.role}
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      u.is_active ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/20" : "bg-rose-950/20 text-rose-400 border border-rose-500/20"
                    }`}>
                      {u.is_active ? "Active" : "Banned"}
                    </span>

                    {/* Actions */}
                    {u.username !== currentUser.username && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleToggleRole(u.id, u.role)}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-slate-300 transition-colors cursor-pointer"
                          title="Toggle Admin Rights"
                        >
                          Toggle Role
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u.id, u.is_active)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            u.is_active
                              ? "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-400"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400"
                          }`}
                          title={u.is_active ? "Ban User" : "Activate User"}
                        >
                          {u.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Comprehensive System Log Terminal */}
      <GlassCard className="flex flex-col h-[320px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 mb-3 gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="text-purple-400" size={18} />
            <h4 className="text-sm font-extrabold uppercase text-slate-200 tracking-wider">
              Comprehensive Log Inspector
            </h4>
          </div>

          <div className="flex gap-2">
            {["", "INFO", "WARNING", "simulation", "migration", "merger", "bankruptcy", "auth"].map((cat) => (
              <button
                key={cat}
                onClick={() => setLogFilter(cat)}
                className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                  logFilter === cat
                    ? "bg-purple-500/20 border-purple-500 text-purple-400"
                    : "bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300"
                }`}
              >
                {cat || "All"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-black/60 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-cyan-500 overflow-y-auto space-y-2.5">
          {loadingLogs ? (
            <div className="text-center py-16 text-slate-600">Querying ledger logs...</div>
          ) : filteredLogs.length === 0 ? (
            <p className="text-slate-600 text-center py-16">No logs match this filter.</p>
          ) : (
            filteredLogs.map((log) => {
              let categoryColor = "text-purple-400";
              if (log.category === "bankruptcy") categoryColor = "text-rose-500 font-bold";
              else if (log.category === "migration") categoryColor = "text-amber-400";
              else if (log.category === "merger") categoryColor = "text-indigo-400 font-bold";
              else if (log.category === "startup") categoryColor = "text-emerald-400";

              return (
                <div key={log.id} className="flex gap-2.5 hover:bg-white/5 py-0.5 rounded transition-all">
                  <span className="text-slate-600">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  <span className={`uppercase font-bold ${categoryColor}`}>
                    [{log.category}]
                  </span>
                  <span className="text-slate-300">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default AdminPanel;
