import React, { useState, useEffect } from "react";
import api from "../utils/api";
import GlassCard from "./GlassCard";
import { useAuth } from "../context/AuthContext";
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
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
            BUSINESS AGENT CATALOG
          </h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
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
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Agent by Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input-icon py-2 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter size={14} />
            <span>Filter By:</span>
          </div>

          {/* Industry Filter */}
          <select
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
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
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
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
            <div className="text-center py-20 text-slate-400 text-xs flex flex-col items-center gap-2">
              <Activity className="animate-pulse text-cyan-400" size={32} />
              <span>Querying ledger databases...</span>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-xs">
              No business agents match search filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
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
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredBusinesses.map((biz) => {
                  let riskColor = "text-emerald-400 bg-emerald-950/20 border-emerald-500/20";
                  if (biz.risk_level > 65) {
                    riskColor = "text-rose-400 bg-rose-950/20 border-rose-500/20";
                  } else if (biz.risk_level > 30) {
                    riskColor = "text-amber-400 bg-amber-950/20 border-amber-500/20";
                  }
                  
                  let strategyName = biz.ai_strategy.replace("_", " ").title || biz.ai_strategy;
                  if (biz.ai_strategy === "aggressive_expansion") strategyName = "Aggressive Expansion";
                  else if (biz.ai_strategy === "cost_cutting") strategyName = "Cost Cutting";
                  else if (biz.ai_strategy === "r_and_d_focus") strategyName = "R&D Focus";
                  else if (biz.ai_strategy === "moderate_growth") strategyName = "Moderate Growth";

                  return (
                    <tr key={biz.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-200">{biz.name}</div>
                        <span className="text-[10px] text-slate-500">Age: {biz.age}m | ID: {biz.id}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-300">{biz.industry}</td>
                      <td className="py-4 px-4 text-slate-300">
                        <div>{biz.city}</div>
                        <span className="text-[10px] text-slate-500">{biz.country}</span>
                      </td>
                      <td className="py-4 px-4 text-right text-slate-200 font-mono font-bold">
                        {biz.employees}
                      </td>
                      <td className="py-4 px-4 text-right text-emerald-400 font-mono">
                        ${Math.round(biz.revenue).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right text-indigo-300 font-mono">
                        ${Math.round(biz.capital).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700/50 uppercase font-semibold">
                          {strategyName}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] border uppercase font-extrabold ${riskColor}`}>
                          {biz.risk_level.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(biz)}
                            className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 rounded-lg transition-colors cursor-pointer"
                            title="Edit Agent Stats"
                          >
                            <Edit2 size={13} />
                          </button>
                          {user?.role === "admin" && (
                            <button
                              onClick={() => handleDelete(biz.id)}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <GlassCard className="w-full max-w-xl max-h-[90vh] overflow-y-auto border-purple-500/20 relative" hoverEffect={false}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <Building2 className="text-cyan-400" size={24} />
              <h3 className="text-lg font-bold text-slate-200">
                {editingBiz ? `Edit Agent Parameters: ${name}` : "Configure New AI Agent"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Business Name</label>
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
                  <label className="text-slate-400 font-semibold uppercase">Market Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="glass-input py-2 text-xs"
                  >
                    {["Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Energy"].map(
                      (ind) => (
                        <option key={ind} value={ind} className="bg-slate-900">
                          {ind}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Operation Hub (City)</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="glass-input py-2 text-xs"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Employees */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Workforce size</label>
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
                  <label className="text-slate-400 font-semibold uppercase">Monthly Revenue ($)</label>
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
                  <label className="text-slate-400 font-semibold uppercase">Monthly Expenses ($)</label>
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
                  <label className="text-slate-400 font-semibold uppercase">Capital Reserve ($)</label>
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
                  <label className="text-slate-400 font-semibold uppercase">Base Growth Rate (Decimal)</label>
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
                  <label className="text-slate-400 font-semibold uppercase">AI Expansion Strategy</label>
                  <select
                    value={aiStrategy}
                    onChange={(e) => setAiStrategy(e.target.value)}
                    className="glass-input py-2 text-xs"
                  >
                    {STRATEGIES.map((strat) => (
                      <option key={strat} value={strat} className="bg-slate-900">
                        {strat.replace("_", " ").toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Risk Level */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Initial Risk level (0 - 100%)</label>
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
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default BusinessManagement;
export { CITIES };
