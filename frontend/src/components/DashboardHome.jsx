import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { useTheme } from "../context/ThemeContext";
import GlassCard from "./GlassCard";
import {
  TrendingUp,
  Building2,
  Users,
  DollarSign,
  AlertTriangle,
  Compass,
  Heart,
  ChevronRight,
  Loader2,
  Bell,
  Terminal,
  Download
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const DashboardHome = () => {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simDuration, setSimDuration] = useState(1);

  const fetchData = async () => {
    try {
      const statsRes = await api.get("/simulation/stats");
      setStats(statsRes.data);

      const historyRes = await api.get("/simulation/history");
      setHistory(historyRes.data);

      const notifRes = await api.get("/simulation/notifications");
      setNotifications(notifRes.data);

      const logsRes = await api.get("/simulation/logs");
      setLogs(logsRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await api.post("/simulation/run", { months: simDuration });
      await fetchData();
    } catch (err) {
      console.error("Error running simulation", err);
      alert(err.response?.data?.detail || "Simulation step failed");
    } finally {
      setSimulating(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/simulation/notifications/read-all");
      // refresh notifications
      const notifRes = await api.get("/simulation/notifications");
      setNotifications(notifRes.data);
    } catch (err) {
      console.error("Error marking read", err);
    }
  };

  const downloadPDFReport = () => {
    window.open(`${api.defaults.baseURL}/reports/export-pdf`, "_blank");
  };

  if (loadingStats) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
        <Loader2 className="animate-spin text-cyan-500" size={42} />
        <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Synchronizing simulation stream...</p>
      </div>
    );
  }

  // Format history for charts
  const chartData = history.map((item) => ({
    name: `M${item.step_number}`,
    revenue: Math.round(item.avg_revenue),
    employees: item.total_employees,
    businesses: item.total_businesses,
    startups: item.active_startups,
    collapseRisk: Math.round(item.collapse_risk),
    gdpGrowth: parseFloat(item.gdp_growth.toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      {/* Brand Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
            ECONOMIC TELEMETRY CORE
          </h2>
          <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>
            Real-time analysis of agent-based civilization behavior
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadPDFReport}
            className="glass-btn-secondary flex items-center gap-2 py-2.5 px-4 text-xs font-bold"
          >
            <Download size={14} />
            Export Report (PDF)
          </button>
        </div>
      </div>

      {/* Grid Cards 1-8 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Businesses */}
        <GlassCard className="flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-500 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Total Businesses</p>
            <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>{stats?.total_businesses}</h3>
          </div>
        </GlassCard>

        {/* Total Employees */}
        <GlassCard className="flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Total Workforce</p>
            <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>{stats?.total_employees.toLocaleString()}</h3>
          </div>
        </GlassCard>

        {/* Average Revenue */}
        <GlassCard className="flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Avg revenue</p>
            <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>
              ${stats?.avg_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h3>
          </div>
        </GlassCard>

        {/* Active Startups */}
        <GlassCard className="flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Active Startups</p>
            <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>{stats?.active_startups}</h3>
          </div>
        </GlassCard>

        {/* Economic Health Score */}
        <GlassCard className="flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-pink-500/10 border border-pink-500/20 text-pink-500 rounded-xl">
            <Heart size={24} />
          </div>
          <div className="w-full">
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Economic Health</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{stats?.economic_health_score.toFixed(1)}%</h3>
              <span className="text-[9px] text-pink-500 font-bold uppercase tracking-wider">
                {stats?.economic_health_score > 60 ? "Strong" : stats?.economic_health_score > 35 ? "Stable" : "Fragile"}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Business Migration Count */}
        <GlassCard className="flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl">
            <Compass size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Total Migration</p>
            <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>{stats?.migration_count}</h3>
          </div>
        </GlassCard>

        {/* Collapse Risk */}
        <GlassCard className="flex items-center gap-4 relative overflow-hidden border"
          style={stats?.collapse_risk > 60 ? {
            borderColor: theme === 'dark' ? 'rgba(244,63,94,0.3)' : '#fca5a5',
            background: theme === 'dark' ? 'rgba(244,63,94,0.1)' : '#fef2f2'
          } : {}}
        >
          <div className={`p-3 rounded-xl ${
            stats?.collapse_risk > 60 
              ? "bg-rose-500/20 text-rose-500 border border-rose-500/30 animate-pulse" 
              : "bg-amber-500/10 border border-amber-500/20 text-amber-500"
          }`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Collapse Risk</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black" style={stats?.collapse_risk > 60 ? { color: "#ef4444" } : { color: "var(--text-primary)" }}>
                {stats?.collapse_risk.toFixed(1)}%
              </h3>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                stats?.collapse_risk > 65 ? "text-rose-500" : stats?.collapse_risk > 30 ? "text-amber-500" : "text-emerald-500"
              }`}>
                {stats?.collapse_risk > 65 ? "Danger" : stats?.collapse_risk > 30 ? "Warning" : "Safe"}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* GDP Growth Estimate */}
        <GlassCard className="flex items-center gap-4 relative overflow-hidden">
          <div className={`p-3 rounded-xl border ${
            stats?.gdp_growth_estimate >= 0
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-rose-500/10 border-rose-500/20 text-rose-500"
          }`}>
            <TrendingUp size={24} className={stats?.gdp_growth_estimate < 0 ? "transform rotate-180" : ""} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>GDP Growth Est.</p>
            <h3 className="text-2xl font-black mt-1" style={{
              color: stats?.gdp_growth_estimate >= 0 ? "#10b981" : "#ef4444"
            }}>
              {stats?.gdp_growth_estimate >= 0 ? "+" : ""}
              {stats?.gdp_growth_estimate.toFixed(2)}%
            </h3>
          </div>
        </GlassCard>
      </div>

      {/* Simulator Stepper control & Notifications block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Advance Stepper */}
        <GlassCard className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <h4 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>Simulate Civilization Timeline</h4>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Advance the civilization engine timeline. Each business agent acts autonomously, deciding to hire, lay off, merge, spin off startups, or migrate between international tech hubs based on relative economic yields.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-6">
            {[
              { label: "1 Month", val: 1 },
              { label: "6 Months", val: 6 },
              { label: "1 Year", val: 12 },
              { label: "5 Years", val: 60 },
              { label: "10 Years", val: 120 },
            ].map((option) => (
              <button
                key={option.val}
                onClick={() => setSimDuration(option.val)}
                className="py-2 px-3 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer"
                style={simDuration === option.val ? {
                  background: theme === 'dark' ? "rgba(6,182,212,0.15)" : "rgba(37,99,235,0.12)",
                  borderColor: "var(--border-focus)",
                  color: "var(--border-focus)",
                  fontWeight: "bold"
                } : {
                  background: "var(--bg-hover)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-secondary)"
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="w-full glass-btn flex items-center justify-center gap-2 cursor-pointer"
          >
            {simulating ? (
              <>
                <Loader2 className="animate-spin text-white" size={18} />
                <span>Simulating Agents Behavior...</span>
              </>
            ) : (
              <>
                <TrendingUp size={18} />
                <span>Run Simulator ({simDuration} Month{simDuration > 1 ? "s" : ""})</span>
              </>
            )}
          </button>
        </GlassCard>

        {/* Notifications & Warning alerts panel */}
        <GlassCard className="flex flex-col h-[320px] overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: "var(--border-color)" }}>
            <div className="flex items-center gap-2">
              <Bell className="text-cyan-500" size={18} />
              <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>Alert Center</h4>
            </div>
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer hover:opacity-85"
              style={{ color: "var(--text-muted)" }}
            >
              Clear All
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <p className="text-center text-xs py-12" style={{ color: "var(--text-muted)" }}>No active system alerts.</p>
            ) : (
              notifications.map((notif) => {
                const getBadgeStyle = () => {
                  if (notif.type === "collapse_warning") {
                    return { background: "rgba(239,68,68,0.12)", color: "#ef4444", borderColor: "rgba(239,68,68,0.25)" };
                  } else if (notif.type === "startup_boom") {
                    return { background: "rgba(99,102,241,0.12)", color: "#6366f1", borderColor: "rgba(99,102,241,0.25)" };
                  } else if (notif.type === "employment_decline") {
                    return { background: "rgba(245,158,11,0.12)", color: "#f59e0b", borderColor: "rgba(245,158,11,0.25)" };
                  }
                  return { background: "var(--bg-badge)", color: "var(--text-secondary)", borderColor: "var(--border-color)" };
                };
                
                return (
                  <div
                    key={notif.id}
                    className="p-3 rounded-xl border flex gap-3 transition-opacity"
                    style={{
                      background: "var(--bg-hover)",
                      borderColor: "var(--border-color)",
                      opacity: notif.is_read ? 0.45 : 1
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] px-2 py-0.5 rounded-full border uppercase font-bold" style={getBadgeStyle()}>
                          {notif.type.replace("_", " ")}
                        </span>
                        <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{notif.title}</p>
                      <p className="text-[10px] leading-normal" style={{ color: "var(--text-secondary)" }}>{notif.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>
      </div>

      {/* Chart Telemetry Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & GDP chart */}
        <GlassCard>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-primary)" }}>
            Economic Growth & Revenue Trend
          </h4>
          <div className="h-64">
            {chartData.length === 0 ? (
              <p className="text-center text-xs py-24" style={{ color: "var(--text-muted)" }}>Not enough simulation data to plot.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} />
                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} />
                  <YAxis yAxisId="left" stroke={theme === 'dark' ? '#818cf8' : '#6366f1'} fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke={theme === 'dark' ? '#34d399' : '#10b981'} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? 'rgba(8,9,16,0.97)' : '#ffffff',
                      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
                      borderRadius: '12px',
                      color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Avg Revenue ($)"
                    stroke="#818cf8"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="gdpGrowth"
                    name="GDP Growth (%)"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Workforce & Startups chart */}
        <GlassCard>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-primary)" }}>
            Employment Growth & Active Startups
          </h4>
          <div className="h-64">
            {chartData.length === 0 ? (
              <p className="text-center text-xs py-24" style={{ color: "var(--text-muted)" }}>Not enough simulation data to plot.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEmp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} />
                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} />
                  <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? 'rgba(8,9,16,0.97)' : '#ffffff',
                      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
                      borderRadius: '12px',
                      color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="employees"
                    name="Total Employees"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#colorEmp)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="businesses"
                    name="Total Businesses"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Simulator Event logs terminal view */}
      <GlassCard className="flex flex-col h-[280px]">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b" style={{ borderColor: "var(--border-color)" }}>
          <Terminal className="text-purple-500 animate-pulse" size={18} />
          <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
            Agent Decision Logs (System Logs)
          </h4>
        </div>
        <div className="log-terminal flex-1 space-y-2.5">
          {logs.length === 0 ? (
            <p className="text-center py-16" style={{ color: "var(--text-faint)" }}>Terminal offline. Run simulation steps to listen for agent actions.</p>
          ) : (
            logs.map((log) => {
              let categoryColor = "text-purple-500";
              if (log.category === "bankruptcy") categoryColor = "text-rose-500 font-bold";
              else if (log.category === "migration") categoryColor = "text-amber-600 font-bold";
              else if (log.category === "merger") categoryColor = "text-indigo-500 font-bold";
              else if (log.category === "startup") categoryColor = "text-emerald-600 font-bold";

              return (
                <div key={log.id} className="flex gap-2.5 py-0.5 rounded transition-all">
                  <span style={{ color: "var(--text-muted)" }}>
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  <span className={`uppercase ${categoryColor}`}>
                    [{log.category}]
                  </span>
                  <span style={{ color: "var(--text-primary)" }}>{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default DashboardHome;
