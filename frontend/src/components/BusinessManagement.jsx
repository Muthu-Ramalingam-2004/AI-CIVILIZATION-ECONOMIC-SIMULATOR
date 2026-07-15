import React, { useState, useEffect } from "react";
import api from "../utils/api";
import GlassCard from "./GlassCard";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  Plus,
  Edit2,
  Trash2,
  Filter,
  X,
  Building2,
  Activity,
  ArrowUpDown,
  Search
} from "lucide-react";
import { INDUSTRIES, CITY_COORDS } from "./WorldMap";

// Cities derived from world map dataset – keeps dropdown in sync with map
const CITIES = Object.keys(CITY_COORDS).sort();

const STRATEGIES = ["aggressive_expansion", "cost_cutting", "moderate_growth", "r_and_d_focus"];

const BusinessManagement = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBiz, setEditingBiz] = useState(null);
  
  // Form State
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [city, setCity] = useState("New York");
  const [employees, setEmployees] = useState(10);
  const [revenue, setRevenue] = useState(15000.0);
  const [expenses, setExpenses] = useState(12000.0);
  const [capital, setCapital] = useState(50000.0);
  const [growthRate, setGrowthRate] = useState(0.05);
  const [aiStrategy, setAiStrategy] = useState("moderate_growth");
  const [riskLevel, setRiskLevel] = useState(10.0);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/businesses", {
        params: {
          industry: filterIndustry || undefined,
          city: filterCity || undefined,
        },
      });
      setBusinesses(res.data);
    } catch (err) {
      console.error("Error fetching businesses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [filterIndustry, filterCity]);

  const handleOpenAddModal = () => {
    setEditingBiz(null);
    setName("");
    setIndustry("Technology");
    setCity("New York");
    setEmployees(10);
    setRevenue(15000.0);
    setExpenses(12000.0);
    setCapital(50000.0);
    setGrowthRate(0.05);
    setAiStrategy("moderate_growth");
    setRiskLevel(10.0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (biz) => {
    setEditingBiz(biz);
    setName(biz.name);
    setIndustry(biz.industry);
    setCity(biz.city);
    setEmployees(biz.employees);
    setRevenue(biz.revenue);
    setExpenses(biz.expenses);
    setCapital(biz.capital);
    setGrowthRate(biz.growth_rate);
    setAiStrategy(biz.ai_strategy);
    setRiskLevel(biz.risk_level);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      industry,
      city,
      country: city === "London" ? "United Kingdom" : (city === "Tokyo" ? "Japan" : (city === "Berlin" ? "Germany" : (city === "Singapore" ? "Singapore" : (city === "Sydney" ? "Australia" : (city === "Bangalore" ? "India" : "United States"))))),
      employees: parseInt(employees),
      revenue: parseFloat(revenue),
      expenses: parseFloat(expenses),
      capital: parseFloat(capital),
      growth_rate: parseFloat(growthRate),
      ai_strategy: aiStrategy,
      risk_level: parseFloat(riskLevel),
    };

    try {
      if (editingBiz) {
        await api.put(`/businesses/${editingBiz.id}`, payload);
      } else {
        await api.post("/businesses", payload);
      }
      setIsModalOpen(false);
      fetchBusinesses();
    } catch (err) {
      console.error("Error saving business", err);
      alert(err.response?.data?.detail || "Failed to save business agent");
    }
  };

  const handleDelete = async (bizId) => {
    if (!window.confirm("Are you sure you want to decommission and delete this business agent from the simulation?")) {
      return;
    }
    try {
      await api.delete(`/businesses/${bizId}`);
      fetchBusinesses();
    } catch (err) {
      console.error("Error deleting business", err);
      alert(err.response?.data?.detail || "Failed to delete business agent");
    }
  };

  // Filter business by search
  const filteredBusinesses = businesses.filter((biz) =>
    biz.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
            BUSINESS AGENT CATALOG
          </h2>
          <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>
            Configure financial vectors and AI policies for economic agents
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="glass-btn flex items-center gap-2 py-2.5 px-4 text-xs font-bold self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          Add Business Agent
        </button>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
        <div className="relative flex-1 max-w-sm flex items-center">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search Agent by Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input-icon py-2 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <Filter size={14} />
            <span>Filter By:</span>
          </div>

          {/* Industry Filter */}
          <select
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
            className="glass-input !py-2 !px-3 text-xs outline-none w-auto"
          >
            <option value="">All Industries</option>
            {["Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Energy"].map(
              (ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              )
            )}
          </select>

          {/* City Filter */}
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="glass-input !py-2 !px-3 text-xs outline-none w-auto"
          >
            <option value="">All Cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      {/* Catalog Table Grid */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-20 text-xs flex flex-col items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <Activity className="animate-pulse text-cyan-500" size={32} />
              <span>Querying ledger databases...</span>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="text-center py-20 text-xs" style={{ color: "var(--text-muted)" }}>
              No business agents match search filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-[10px] uppercase font-bold tracking-wider" style={{ borderColor: "var(--border-color)", background: "var(--bg-table-header)", color: "var(--text-muted)" }}>
                  <th className="py-4 px-6">Name / Details</th>
                  <th className="py-4 px-4">Industry</th>
                  <th className="py-4 px-4">Location</th>
                  <th className="py-4 px-4 text-right">Workforce</th>
                  <th className="py-4 px-4 text-right">Revenue</th>
                  <th className="py-4 px-4 text-right">Capital</th>
                  <th className="py-4 px-4">AI Strategy</th>
                  <th className="py-4 px-4">Risk Level</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {filteredBusinesses.map((biz) => {
                  const getRiskStyle = (risk) => {
                    if (risk > 65) {
                      return { color: "#ef4444", background: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.25)" };
                    } else if (risk > 30) {
                      return { color: "#d97706", background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.25)" };
                    }
                    return { color: "#10b981", background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.25)" };
                  };
                  
                  let strategyName = biz.ai_strategy.replace("_", " ");
                  if (biz.ai_strategy === "aggressive_expansion") strategyName = "Aggressive Expansion";
                  else if (biz.ai_strategy === "cost_cutting") strategyName = "Cost Cutting";
                  else if (biz.ai_strategy === "r_and_d_focus") strategyName = "R&D Focus";
                  else if (biz.ai_strategy === "moderate_growth") strategyName = "Moderate Growth";

                  return (
                    <tr key={biz.id} className="border-b transition-colors" style={{ borderColor: "var(--border-color)" }}>
                      <td className="py-4 px-6">
                        <div className="font-bold" style={{ color: "var(--text-primary)" }}>{biz.name}</div>
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Age: {biz.age}m | ID: {biz.id}</span>
                      </td>
                      <td className="py-4 px-4" style={{ color: "var(--text-secondary)" }}>{biz.industry}</td>
                      <td className="py-4 px-4" style={{ color: "var(--text-secondary)" }}>
                        <div>{biz.city}</div>
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{biz.country}</span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                        {biz.employees}
                      </td>
                      <td className="py-4 px-4 text-right text-emerald-600 font-mono font-semibold">
                        ${Math.round(biz.revenue).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-semibold" style={{ color: "var(--color-info)" }}>
                        ${Math.round(biz.capital).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className="badge badge-slate">
                          {strategyName}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] border uppercase font-extrabold" style={getRiskStyle(biz.risk_level)}>
                          {biz.risk_level.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(biz)}
                            className="p-2 rounded-lg transition-colors cursor-pointer border hover:opacity-85"
                            style={{ background: "rgba(6,182,212,0.12)", borderColor: "rgba(6,182,212,0.25)", color: "#0891b2" }}
                            title="Edit Agent Stats"
                          >
                            <Edit2 size={13} />
                          </button>
                          {user?.role === "admin" && (
                            <button
                              onClick={() => handleDelete(biz.id)}
                              className="p-2 rounded-lg transition-colors cursor-pointer border hover:opacity-85"
                              style={{ background: "rgba(244,63,94,0.12)", borderColor: "rgba(244,63,94,0.25)", color: "#e11d48" }}
                              title="Decommission Agent"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {/* Add / Edit Agent Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card !max-w-xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <Building2 className="text-cyan-500" size={24} />
              <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {editingBiz ? `Edit Agent Parameters: ${name}` : "Configure New AI Agent"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Business Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input py-2 text-xs"
                    placeholder="Cyberdyne Systems"
                  />
                </div>

                {/* Industry */}
                <div className="space-y-1">
                  <label className="font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Market Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="glass-input py-2 text-xs"
                  >
                    {["Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Energy"].map(
                      (ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Operation Hub (City)</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="glass-input py-2 text-xs"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Employees */}
                <div className="space-y-1">
                  <label className="font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Workforce size</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={employees}
                    onChange={(e) => setEmployees(e.target.value)}
                    className="glass-input py-2 text-xs"
                  />
                </div>

                {/* Revenue */}
                <div className="space-y-1">
                  <label className="font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Monthly Revenue ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    className="glass-input py-2 text-xs"
                  />
                </div>

                {/* Expenses */}
                <div className="space-y-1">
                  <label className="font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Monthly Expenses ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    className="glass-input py-2 text-xs"
                  />
                </div>

                {/* Capital */}
                <div className="space-y-1">
                  <label className="font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Capital Reserve ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={capital}
                    onChange={(e) => setCapital(e.target.value)}
                    className="glass-input py-2 text-xs"
                  />
                </div>

                {/* Growth Rate */}
                <div className="space-y-1">
                  <label className="font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Base Growth Rate (Decimal)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={growthRate}
                    onChange={(e) => setGrowthRate(e.target.value)}
                    className="glass-input py-2 text-xs"
                    placeholder="0.05"
                  />
                </div>

                {/* AI Strategy */}
                <div className="space-y-1">
                  <label className="font-semibold uppercase" style={{ color: "var(--text-muted)" }}>AI Expansion Strategy</label>
                  <select
                    value={aiStrategy}
                    onChange={(e) => setAiStrategy(e.target.value)}
                    className="glass-input py-2 text-xs"
                  >
                    {STRATEGIES.map((strat) => (
                      <option key={strat} value={strat}>
                        {strat.replace("_", " ").toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Risk Level */}
                <div className="space-y-1">
                  <label className="font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Initial Risk level (0 - 100%)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value)}
                    className="glass-input py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="glass-btn-secondary py-2 px-4 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="glass-btn py-2 px-6 text-xs cursor-pointer">
                  {editingBiz ? "Update Agent" : "Deploy Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessManagement;
export { CITIES };
