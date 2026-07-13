import React, { useState, useEffect } from "react";
import api from "../utils/api";
import GlassCard from "./GlassCard";
import {
  TrendingUp,
  BrainCircuit,
  AlertTriangle,
  HelpCircle,
  Loader2,
  ShieldCheck,
  Percent
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const PredictionDashboard = () => {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const res = await api.get("/predictions");
        setPredictions(res.data);
      } catch (err) {
        console.error("Error fetching predictions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
        <Loader2 className="animate-spin text-cyan-400" size={42} />
        <p className="text-slate-400 text-sm font-semibold">Training ML prediction models...</p>
      </div>
    );
  }

  const { forecast, feature_importance, data_points_trained } = predictions || {};

  // Formulate data structure for charts
  const forecastChartData = forecast?.steps?.map((step, idx) => ({
    name: `M${step}`,
    businesses: Math.round(forecast.total_businesses?.[idx] || 0),
    employees: Math.round(forecast.total_employees?.[idx] || 0),
    avgRevenue: Math.round(forecast.avg_revenue?.[idx] || 0),
    activeStartups: Math.round(forecast.active_startups?.[idx] || 0),
    collapseRisk: parseFloat((forecast.collapse_risk?.[idx] || 0).toFixed(1)),
    gdpGrowth: parseFloat((forecast.gdp_growth?.[idx] || 0).toFixed(2)),
    unemployment: parseFloat((forecast.unemployment_rate?.[idx] || 0).toFixed(2)),
  })) || [];

  // Calculate projected trend percentages
  const calculateChange = (arr) => {
    if (!arr || arr.length < 2) return { val: 0, direction: "neutral" };
    const start = arr[0];
    const end = arr[arr.length - 1];
    const pct = ((end - start) / max(start, 1.0)) * 100.0;
    return {
      val: Math.abs(pct).toFixed(1),
      direction: pct > 0 ? "up" : (pct < 0 ? "down" : "neutral"),
      raw: pct
    };
  };

  const max = (a, b) => (a > b ? a : b);

  const bizChange = calculateChange(forecast?.total_businesses);
  const employeeChange = calculateChange(forecast?.total_employees);
  const revenueChange = calculateChange(forecast?.avg_revenue);
  const riskChange = calculateChange(forecast?.collapse_risk);

  return (
    <div className="space-y-6">
      {/* Brand Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 flex items-center gap-2">
            <BrainCircuit className="text-cyan-400" />
            AI PREDICTION ENGINE
          </h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
            Machine Learning projections trained on agent-based telemetry (Trained on {data_points_trained} step-points)
          </p>
        </div>
      </div>

      {/* Projection Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Biz Project */}
        <GlassCard>
          <p className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Projected Business Volume</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-xl font-black text-slate-100">
              {forecastChartData[forecastChartData.length - 1]?.businesses || 0} units
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
              bizChange.direction === "up" 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}>
              {bizChange.direction === "up" ? "▲" : "▼"} {bizChange.val}%
            </span>
          </div>
          <p className="text-[9px] text-slate-400 mt-2">12-Month Projected Growth</p>
        </GlassCard>

        {/* Workforce Project */}
        <GlassCard>
          <p className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Projected Employment</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-xl font-black text-slate-100">
              {forecastChartData[forecastChartData.length - 1]?.employees?.toLocaleString() || 0} jobs
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
              employeeChange.direction === "up" 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}>
              {employeeChange.direction === "up" ? "▲" : "▼"} {employeeChange.val}%
            </span>
          </div>
          <p className="text-[9px] text-slate-400 mt-2">12-Month Workforce Delta</p>
        </GlassCard>

        {/* Avg Revenue Project */}
        <GlassCard>
          <p className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Projected Avg revenue</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-xl font-black text-slate-100">
              ${(forecastChartData[forecastChartData.length - 1]?.avgRevenue || 0).toLocaleString()}
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
              revenueChange.direction === "up" 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}>
              {revenueChange.direction === "up" ? "▲" : "▼"} {revenueChange.val}%
            </span>
          </div>
          <p className="text-[9px] text-slate-400 mt-2">Revenue Trend forecast</p>
        </GlassCard>

        {/* Collapse Risk forecast */}
        <GlassCard>
          <p className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Projected Collapse Risk</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-xl font-black text-slate-100">
              {(forecastChartData[forecastChartData.length - 1]?.collapseRisk || 0).toFixed(1)}%
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
              riskChange.raw <= 0 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}>
              {riskChange.raw <= 0 ? "▼" : "▲"} {riskChange.val}%
            </span>
          </div>
          <p className="text-[9px] text-slate-400 mt-2">System Stability index</p>
        </GlassCard>
      </div>

      {/* Main Charts block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collapse Risk Forecast (AreaChart) */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-rose-500" size={16} />
            <h4 className="text-sm font-extrabold uppercase text-slate-300 tracking-wider">
              System Collapse Risk Forecast (Next 12 Months)
            </h4>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastChartData}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
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
                  dataKey="collapseRisk"
                  name="Projected Collapse Risk"
                  stroke="#f43f5e"
                  fillOpacity={1}
                  fill="url(#colorRisk)"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="unemployment"
                  name="Projected Unemployment"
                  stroke="#eab308"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* AI Collapse Risk Drivers (Feature Importances) */}
        <GlassCard className="flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-4">
            <BrainCircuit className="text-purple-400" size={16} />
            <h4 className="text-sm font-extrabold uppercase text-slate-300 tracking-wider">
              AI Risk Drivers (Features)
            </h4>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
            Decision weights extracted from the Random Forest Regressor indicating which economic attributes drive the collapse risk indicator.
          </p>

          <div className="flex-1 space-y-4">
            {feature_importance?.map((feat, idx) => {
              const colors = ["bg-cyan-500", "bg-purple-500", "bg-indigo-500", "bg-amber-500", "bg-pink-500", "bg-teal-500"];
              const color = colors[idx % colors.length];
              
              return (
                <div key={feat.feature} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-300">{feat.feature}</span>
                    <span className="text-cyan-400 font-mono">{(feat.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${feat.importance * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Second Row Projections (GDP Growth and Startups) */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-emerald-500" size={16} />
          <h4 className="text-sm font-extrabold uppercase text-slate-300 tracking-wider">
            GDP Growth Rate & Startup Incubation Projections (12m)
          </h4>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis yAxisId="left" stroke="#10b981" fontSize={11} unit="%" />
              <YAxis yAxisId="right" orientation="right" stroke="#6366f1" fontSize={11} />
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
                dataKey="gdpGrowth"
                name="GDP Growth Rate"
                stroke="#10b981"
                strokeWidth={2}
                dot={true}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="activeStartups"
                name="New Spawned Startups"
                stroke="#6366f1"
                strokeWidth={2}
                dot={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
};

export default PredictionDashboard;
