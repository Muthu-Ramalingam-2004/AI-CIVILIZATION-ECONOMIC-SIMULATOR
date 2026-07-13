import React, { useState, useEffect } from "react";
import api from "../utils/api";
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
        <Loader2 className="animate-spin text-cyan-400" size={42} />
        <p className="text-slate-400 text-sm font-semibold">Synchronizing simulation stream...</p>
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
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
            ECONOMIC TELEMETRY CORE
          </h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
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
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Businesses</p>
            <h3 className="text-2xl font-black mt-1 text-slate-100">{stats?.total_businesses}</h3>
          </div>
        </GlassCard>

        {/* Total Employees */}
        <GlassCard className="flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Workforce</p>
            <h3 className="text-2xl font-black mt-1 text-slate-100">{stats?.total_employees.toLocaleString()}</h3>
          </div>
        </GlassCard>

        {/* Average Revenue */}
        <GlassCard className="flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Avg revenue</p>
            <h3 className="text-2xl font-black mt-1 text-slate-100">
              ${stats?.avg_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h3>
          </div>
        </GlassCard>

        {/* Active Startups */}
        <GlassCard className="flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Active Startups</p>
            <h3 className="text-2xl font-black mt-1 text-slate-100">{stats?.active_startups}</h3>
          </div>
        </GlassCard>

        {/* Economic Health Score */}
        <GlassCard className="flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
            <Heart size={24} />
          </div>
          <div className="w-full">
            <p className="text-xs text-slate-400 font-semibold uppercase">Economic Health</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-slate-100">{stats?.economic_health_score.toFixed(1)}%</h3>
              <span className="text-[9px] text-pink-400 font-bold uppercase tracking-wider">
                {stats?.economic_health_score > 60 ? "Strong" : stats?.economic_health_score > 35 ? "Stable" : "Fragile"}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Business Migration Count */}
        <GlassCard className="flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Compass size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Migration</p>
            <h3 className="text-2xl font-black mt-1 text-slate-100">{stats?.migration_count}</h3>
          </div>
        </GlassCard>

        {/* Collapse Risk */}
        <GlassCard className={`flex items-center gap-4 relative overflow-hidden border ${
          stats?.collapse_risk > 60 ? "border-rose-500/30 bg-rose-950/10" : ""
        }`}>
          <div className={`p-3 rounded-xl ${
            stats?.collapse_risk > 60 
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse" 
              : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
          }`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Collapse Risk</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className={`text-2xl font-black ${stats?.collapse_risk > 60 ? "text-rose-400" : "text-slate-100"}`}>
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
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}>
            <TrendingUp size={24} className={stats?.gdp_growth_estimate < 0 ? "transform rotate-180" : ""} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">GDP Growth Est.</p>
            <h3 className={`text-2xl font-black mt-1 ${
              stats?.gdp_growth_estimate >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}>
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
            <h4 className="text-lg font-bold text-slate-200 mb-2">Simulate Civilization Timeline</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
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
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                  simDuration === option.val
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 font-bold"
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"
                }`}
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
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
            <div className="flex items-center gap-2">
              <Bell className="text-cyan-400" size={18} />
              <h4 className="text-sm font-extrabold uppercase text-slate-200 tracking-wider">Alert Center</h4>
            </div>
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] text-slate-500 hover:text-cyan-400 font-bold uppercase transition-all duration-200 cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <p className="text-center text-slate-500 text-xs py-12">No active system alerts.</p>
            ) : (
              notifications.map((notif) => {
                let badgeColor = "bg-slate-800 text-slate-400 border-slate-700/50";
                if (notif.type === "collapse_warning") {
                  badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                } else if (notif.type === "startup_boom") {
                  badgeColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                } else if (notif.type === "employment_decline") {
                  badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                }
                
                return (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border bg-white/5 border-white/5 flex gap-3 transition-opacity ${
                      notif.is_read ? "opacity-40" : "opacity-100"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-extrabold ${badgeColor}`}>
                          {notif.type.replace("_", " ")}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-200 mb-0.5">{notif.title}</p>
                      <p className="text-[10px] text-slate-400 leading-normal">{notif.message}</p>
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
          <h4 className="text-sm font-extrabold uppercase text-slate-300 tracking-wider mb-4">
            Economic Growth & Revenue Trend
          </h4>
          <div className="h-64">
            {chartData.length === 0 ? (
              <p className="text-center text-slate-500 text-xs py-24">Not enough simulation data to plot.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#818cf8" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="#34d399" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 11, 16, 0.95)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      color: "#f1f5f9",
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
          <h4 className="text-sm font-extrabold uppercase text-slate-300 tracking-wider mb-4">
            Employment Growth & Active Startups
          </h4>
          <div className="h-64">
            {chartData.length === 0 ? (
              <p className="text-center text-slate-500 text-xs py-24">Not enough simulation data to plot.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEmp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 11, 16, 0.95)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      color: "#f1f5f9",
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
        <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-3">
          <Terminal className="text-purple-400 animate-pulse" size={18} />
          <h4 className="text-sm font-extrabold uppercase text-slate-200 tracking-wider">
            Agent Decision Logs (System Logs)
          </h4>
        </div>
        <div className="flex-1 bg-black/60 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-cyan-500 overflow-y-auto space-y-2.5">
          {logs.length === 0 ? (
            <p className="text-slate-600 text-center py-16">Terminal offline. Run simulation steps to listen for agent actions.</p>
          ) : (
            logs.map((log) => {
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

export default DashboardHome;
