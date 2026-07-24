import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../utils/api";
import GlassCard from "./GlassCard";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  ShieldAlert, Users, Terminal, RefreshCw, UserCheck, UserX,
  Loader2, Trash2, LayoutDashboard, Building2, Bot, Globe,
  PlayCircle, Settings, Search, Plus, Edit2, X, Save,
  CheckCircle2, AlertTriangle, Activity, Server, Database,
  Map as MapIcon, BarChart3, Lightbulb, Sun, Moon, Wifi, WifiOff,
  TrendingUp, DollarSign, Users2, Heart,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const INDUSTRIES = [
  "Tech","Finance","Manufacturing","Retail","Healthcare",
  "Energy","Agriculture","Transportation","Entertainment","Education",
];
const AI_STRATEGIES = [
  "moderate_growth","aggressive_expansion","cost_cutting","r_and_d_focus",
];

/* ─────────────────────────────────────────────
   Shared micro-components
───────────────────────────────────────────── */

function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 className="section-title">{title}</h2>
        <p className="section-sub">{subtitle}</p>
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

function Spinner({ size = 28 }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <Loader2 style={{ color: "var(--color-info)" }} size={size} className="animate-spin" />
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading…</p>
    </div>
  );
}

function EmptyRow({ cols, msg = "No data found." }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center py-12" style={{ color: "var(--text-faint)" }}>{msg}</td>
    </tr>
  );
}

function SearchBar({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="relative flex-1 max-w-xs">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="glass-input pl-9 py-2.5 text-sm w-full"
      />
    </div>
  );
}

function ActionBtn({ icon: Icon, color, onClick, title }) {
  const map = {
    cyan:   "rgba(6,182,212,0.12)   rgba(6,182,212,0.22)   rgba(6,182,212,0.30)   #06b6d4",
    rose:   "rgba(239,68,68,0.12)   rgba(239,68,68,0.22)   rgba(239,68,68,0.30)   #ef4444",
    amber:  "rgba(245,158,11,0.12)  rgba(245,158,11,0.22)  rgba(245,158,11,0.30)  #f59e0b",
    emerald:"rgba(16,185,129,0.12)  rgba(16,185,129,0.22)  rgba(16,185,129,0.30)  #10b981",
    purple: "rgba(168,85,247,0.12)  rgba(168,85,247,0.22)  rgba(168,85,247,0.30)  #a855f7",
  };
  const parts = (map[color] || map.cyan).split(/\s+/);
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg cursor-pointer transition-all"
      style={{ background: parts[0], border: `1px solid ${parts[2]}`, color: parts[3] }}
      onMouseEnter={(e) => (e.currentTarget.style.background = parts[1])}
      onMouseLeave={(e) => (e.currentTarget.style.background = parts[0])}
    >
      <Icon size={13} />
    </button>
  );
}

function StatusPill({ active }) {
  return (
    <span className={`badge ${active ? "badge-emerald" : "badge-rose"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-rose-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RolePill({ role }) {
  return <span className={`badge ${role === "admin" ? "badge-purple" : "badge-slate"}`}>{role}</span>;
}

function IndustryPill({ label }) {
  const map = { Tech:"badge-cyan", Finance:"badge-emerald", Manufacturing:"badge-amber",
    Retail:"badge-indigo", Healthcare:"badge-purple", Energy:"badge-rose",
  };
  return <span className={`badge ${map[label] || "badge-slate"}`}>{label}</span>;
}

function StrategyPill({ label }) {
  const map = { aggressive_expansion:"badge-rose", cost_cutting:"badge-amber",
    moderate_growth:"badge-cyan", r_and_d_focus:"badge-purple" };
  return <span className={`badge ${map[label] || "badge-slate"}`}>{label?.replace(/_/g," ")}</span>;
}

function ErrorBanner({ msg }) {
  if (!msg) return null;
  return (
    <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-xs"
      style={{ background:"rgba(239,68,68,0.10)", border:"1px solid rgba(239,68,68,0.25)", color:"#ef4444" }}>
      <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODAL
───────────────────────────────────────────── */
function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: wide ? "680px" : "520px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg cursor-pointer transition-all"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
          ><X size={17} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TInput({ ...props }) {
  return <input {...props} className="glass-input text-sm" />;
}

function TSelect({ children, ...props }) {
  return (
    <select {...props} className="glass-input text-sm">
      {children}
    </select>
  );
}

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color = "purple", suffix = "" }) {
  const colorMap = {
    purple: { bg:"rgba(168,85,247,0.10)", border:"rgba(168,85,247,0.25)", text:"#a855f7" },
    cyan:   { bg:"rgba(6,182,212,0.10)",  border:"rgba(6,182,212,0.25)",  text:"#06b6d4" },
    emerald:{ bg:"rgba(16,185,129,0.10)", border:"rgba(16,185,129,0.25)", text:"#10b981" },
    rose:   { bg:"rgba(239,68,68,0.10)",  border:"rgba(239,68,68,0.25)",  text:"#ef4444" },
    amber:  { bg:"rgba(245,158,11,0.10)", border:"rgba(245,158,11,0.25)", text:"#f59e0b" },
    indigo: { bg:"rgba(99,102,241,0.10)", border:"rgba(99,102,241,0.25)", text:"#6366f1" },
    blue:   { bg:"rgba(59,130,246,0.10)", border:"rgba(59,130,246,0.25)", text:"#3b82f6" },
  };
  const c = colorMap[color] || colorMap.purple;
  return (
    <GlassCard className="glass-panel-hover flex items-center gap-4">
      <div className="stat-card-icon" style={{ background: c.bg, borderColor: c.border, color: c.text }}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-2xl font-black mt-0.5 truncate" style={{ color: "var(--text-primary)" }}>
          {value != null ? `${value}${suffix}` : "—"}
        </p>
      </div>
    </GlassCard>
  );
}

/* ─────────────────────────────────────────────
   TAB 1 — DASHBOARD
───────────────────────────────────────────── */
function AdminDashboard({ stats, loading }) {
  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      <SectionHeader title="Admin Dashboard" subtitle="Platform-wide overview" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="Total Users"       value={stats?.total_users}       color="purple" />
        <StatCard icon={Building2}  label="Total Businesses"  value={stats?.total_businesses}  color="cyan"   />
        <StatCard icon={Bot}        label="AI Agents"         value={stats?.total_ai_agents}   color="indigo" />
        <StatCard icon={Activity}   label="Simulations"       value={stats?.total_simulations} color="emerald"/>
        <StatCard icon={Globe}      label="Countries"         value={stats?.total_countries}   color="amber"  />
        <StatCard icon={MapIcon}    label="Cities"            value={stats?.total_cities}      color="blue"   />
        <StatCard icon={DollarSign} label="Avg Revenue"       value={stats?.avg_revenue != null ? `$${Math.round(stats.avg_revenue).toLocaleString()}` : null} color="emerald" />
        <StatCard icon={Users2}     label="Total Workforce"   value={stats?.total_employees?.toLocaleString()} color="cyan" />
        <StatCard icon={Heart}      label="Eco Health"        value={stats?.economic_health != null ? stats.economic_health.toFixed(1) : null} suffix="%" color="rose" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 2 — USER MANAGEMENT
───────────────────────────────────────────── */
function UserManagementTab({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ username: "", email: "", password: "" });
  const [addError, setAddError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get("/auth/users"); setUsers(r.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRole = async (u) => {
    const next = u.role === "admin" ? "user" : "admin";
    if (!window.confirm(`Change ${u.username}'s role to ${next.toUpperCase()}?`)) return;
    try { await api.put(`/auth/users/${u.id}/role`, null, { params: { role: next } }); fetchUsers(); }
    catch (e) { alert(e.response?.data?.detail || "Failed"); }
  };

  const handleStatus = async (u) => {
    const next = !u.is_active;
    if (!window.confirm(`${next ? "Activate" : "Deactivate"} ${u.username}?`)) return;
    try { await api.put(`/auth/users/${u.id}/status`, null, { params: { is_active: next } }); fetchUsers(); }
    catch (e) { alert(e.response?.data?.detail || "Failed"); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Permanently delete user "${u.username}"? This cannot be undone.`)) return;
    try { await api.delete(`/auth/users/${u.id}`); fetchUsers(); }
    catch (e) { alert(e.response?.data?.detail || "Delete failed"); }
  };

  const handleAdd = async () => {
    setSaving(true); setAddError("");
    try {
      await api.post("/auth/users", addForm);
      setShowAdd(false);
      setAddForm({ username: "", email: "", password: "" });
      fetchUsers();
    } catch (e) { setAddError(e.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <SectionHeader title="User Management" subtitle="Manage platform user accounts">
        <SearchBar value={search} onChange={setSearch} placeholder="Search users…" />
        <button onClick={() => setShowAdd(true)} className="glass-btn text-sm py-2.5 px-4">
          <Plus size={15} /> Add User
        </button>
      </SectionHeader>

      <GlassCard className="p-0 overflow-hidden">
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="theme-table">
              <thead>
                <tr>{["#","User","Email","Role","Status","Actions"].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <EmptyRow cols={6} msg="No users found." />
                  : filtered.map(u => (
                  <tr key={u.id}>
                    <td className="text-xs" style={{ color: "var(--text-faint)" }}>{u.id}</td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                          style={{
                            background: u.role === "admin" ? "rgba(168,85,247,0.20)" : "rgba(6,182,212,0.15)",
                            color: u.role === "admin" ? "#a855f7" : "#06b6d4",
                          }}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{u.username}</p>
                          {u.username === currentUser?.username && <span className="badge badge-cyan">YOU</span>}
                        </div>
                      </div>
                    </td>
                    <td className="text-xs" style={{ color: "var(--text-muted)" }}>{u.email}</td>
                    <td><RolePill role={u.role} /></td>
                    <td><StatusPill active={u.is_active} /></td>
                    <td>
                      {u.username !== currentUser?.username ? (
                        <div className="flex gap-1.5">
                          <ActionBtn icon={u.role === "admin" ? UserX : UserCheck} color="purple" onClick={() => handleRole(u)} title="Toggle Role" />
                          <ActionBtn icon={u.is_active ? UserX : UserCheck} color={u.is_active ? "amber" : "emerald"} onClick={() => handleStatus(u)} title={u.is_active ? "Deactivate" : "Activate"} />
                          <ActionBtn icon={Trash2} color="rose" onClick={() => handleDelete(u)} title="Delete User" />
                        </div>
                      ) : <span className="text-xs" style={{ color: "var(--text-faint)" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New User">
        <ErrorBanner msg={addError} />
        <div className="space-y-4">
          <Field label="Username"><TInput value={addForm.username} onChange={e => setAddForm({...addForm, username: e.target.value})} placeholder="johndoe" /></Field>
          <Field label="Email"><TInput type="email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} placeholder="john@example.com" /></Field>
          <Field label="Password"><TInput type="password" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} placeholder="min 6 chars" /></Field>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={() => setShowAdd(false)} className="glass-btn-secondary px-5 py-2.5 rounded-xl text-sm">Cancel</button>
          <button onClick={handleAdd} disabled={saving} className="glass-btn py-2.5 px-5 text-sm">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? "Saving…" : "Create User"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 3 — BUSINESS MANAGEMENT
───────────────────────────────────────────── */
function defaultBizForm() {
  return { name: "", industry: "Tech", city: "", country: "", employees: 50,
    revenue: 100000, expenses: 80000, growth_rate: 0.05,
    ai_strategy: "moderate_growth", risk_level: 10, capital: 50000 };
}

function BusinessManagementTab() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(defaultBizForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchBiz = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get("/businesses/", { params: { active_only: false } }); setBusinesses(r.data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBiz(); }, [fetchBiz]);

  const openAdd = () => { setEditTarget(null); setForm(defaultBizForm()); setError(""); setShowModal(true); };
  const openEdit = (b) => {
    setEditTarget(b);
    setForm({ name:b.name, industry:b.industry, city:b.city, country:b.country,
      employees:b.employees, revenue:b.revenue, expenses:b.expenses,
      growth_rate:b.growth_rate, ai_strategy:b.ai_strategy, risk_level:b.risk_level, capital:b.capital });
    setError(""); setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      if (editTarget) await api.put(`/businesses/${editTarget.id}`, form);
      else await api.post("/businesses/", form);
      setShowModal(false); fetchBiz();
    } catch (e) { setError(e.response?.data?.detail || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete "${b.name}"?`)) return;
    try { await api.delete(`/businesses/${b.id}`); fetchBiz(); }
    catch (e) { alert(e.response?.data?.detail || "Failed"); }
  };

  const filtered = businesses.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.city.toLowerCase().includes(search.toLowerCase()) ||
    b.industry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <SectionHeader title="Business Management" subtitle="Create, update and delete simulation businesses">
        <SearchBar value={search} onChange={setSearch} placeholder="Search businesses…" />
        <button onClick={openAdd} className="glass-btn text-sm py-2.5 px-4">
          <Plus size={15} /> Create Business
        </button>
      </SectionHeader>

      <GlassCard className="p-0 overflow-hidden">
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="theme-table">
              <thead>
                <tr>{["Name","Industry","City","Country","Employees","Revenue","Strategy","Status","Actions"].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <EmptyRow cols={9} />
                  : filtered.map(b => (
                  <tr key={b.id}>
                    <td className="font-semibold" style={{ color: "var(--text-primary)" }}>{b.name}</td>
                    <td><IndustryPill label={b.industry} /></td>
                    <td style={{ color: "var(--text-secondary)" }}>{b.city}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{b.country}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{b.employees.toLocaleString()}</td>
                    <td style={{ color: "var(--text-secondary)" }}>${b.revenue.toLocaleString(undefined,{maximumFractionDigits:0})}</td>
                    <td><StrategyPill label={b.ai_strategy} /></td>
                    <td><StatusPill active={b.is_active} /></td>
                    <td>
                      <div className="flex gap-1.5">
                        <ActionBtn icon={Edit2} color="cyan" onClick={() => openEdit(b)} title="Edit" />
                        <ActionBtn icon={Trash2} color="rose" onClick={() => handleDelete(b)} title="Delete" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editTarget ? "Edit Business" : "Create Business"} wide>
        <ErrorBanner msg={error} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name"><TInput value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Acme Corp" /></Field>
          <Field label="Industry">
            <TSelect value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})}>
              {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
            </TSelect>
          </Field>
          <Field label="City"><TInput value={form.city} onChange={e=>setForm({...form,city:e.target.value})} /></Field>
          <Field label="Country"><TInput value={form.country} onChange={e=>setForm({...form,country:e.target.value})} /></Field>
          <Field label="Employees"><TInput type="number" value={form.employees} onChange={e=>setForm({...form,employees:+e.target.value})} /></Field>
          <Field label="Capital ($)"><TInput type="number" value={form.capital} onChange={e=>setForm({...form,capital:+e.target.value})} /></Field>
          <Field label="Revenue ($)"><TInput type="number" value={form.revenue} onChange={e=>setForm({...form,revenue:+e.target.value})} /></Field>
          <Field label="Expenses ($)"><TInput type="number" value={form.expenses} onChange={e=>setForm({...form,expenses:+e.target.value})} /></Field>
          <Field label="Growth Rate"><TInput type="number" step="0.01" value={form.growth_rate} onChange={e=>setForm({...form,growth_rate:+e.target.value})} /></Field>
          <Field label="Risk Level (0-100)"><TInput type="number" value={form.risk_level} onChange={e=>setForm({...form,risk_level:+e.target.value})} /></Field>
          <Field label="AI Strategy" className="sm:col-span-2">
            <TSelect value={form.ai_strategy} onChange={e=>setForm({...form,ai_strategy:e.target.value})}>
              {AI_STRATEGIES.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
            </TSelect>
          </Field>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={()=>setShowModal(false)} className="glass-btn-secondary px-5 py-2.5 rounded-xl text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="glass-btn py-2.5 px-5 text-sm">
            {saving?<Loader2 size={13} className="animate-spin"/>:<Save size={13}/>}
            {saving?"Saving…":"Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 4 — SIMULATION CONTROL
───────────────────────────────────────────── */
function SimulationTab() {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [simDuration, setSimDuration] = useState(1);
  const [simulating, setSimulating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [logFilter, setLogFilter] = useState("");
  const [msg, setMsg] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try { const r = await api.get("/simulation/logs", { params:{ limit:200 } }); setLogs(r.data); }
    catch { /* silent */ } finally { setLoadingLogs(false); }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const showMsg = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleRun = async () => {
    setSimulating(true);
    try {
      const r = await api.post("/simulation/run", { months: simDuration });
      showMsg(`✅ ${r.data.message}`);
      fetchLogs();
    } catch (e) { showMsg(`❌ ${e.response?.data?.detail || "Failed"}`, false); }
    finally { setSimulating(false); }
  };

  const handleReset = async () => {
    if (!window.confirm("WARNING: Hard reset wipes ALL simulation data and reseeds. This is irreversible. Continue?")) return;
    setResetting(true);
    try {
      await api.post("/simulation/reset");
      showMsg("✅ Simulation reset and reseeded.");
      fetchLogs();
    } catch (e) { showMsg(`❌ ${e.response?.data?.detail || "Failed"}`, false); }
    finally { setResetting(false); }
  };

  const filteredLogs = logFilter
    ? logs.filter(l =>
        l.message.toLowerCase().includes(logFilter.toLowerCase()) ||
        l.category?.toLowerCase() === logFilter.toLowerCase())
    : logs;

  return (
    <div className="space-y-6">
      <SectionHeader title="Simulation Control" subtitle="Start, reset and monitor the simulation engine" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Run */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4" style={{ color: "var(--color-success)" }}>
            <PlayCircle size={18} />
            <h3 className="text-xs font-bold uppercase tracking-widest">Run Simulation</h3>
          </div>
          <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
            Advance the civilization timeline and trigger agent AI decisions.
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[{l:"1 Mo",v:1},{l:"6 Mo",v:6},{l:"1 Yr",v:12},{l:"5 Yr",v:60},{l:"10 Yr",v:120}].map(o => (
              <button key={o.v} onClick={() => setSimDuration(o.v)}
                className="py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
                style={{
                  background: simDuration === o.v ? "rgba(16,185,129,0.15)" : "var(--bg-hover)",
                  border: `1px solid ${simDuration === o.v ? "rgba(16,185,129,0.5)" : "var(--border-color)"}`,
                  color: simDuration === o.v ? "#10b981" : "var(--text-muted)",
                }}
              >{o.l}</button>
            ))}
          </div>
          <button onClick={handleRun} disabled={simulating}
            className="w-full glass-btn py-3 text-sm justify-center"
            style={{ background: "linear-gradient(135deg,#059669,#0891b2)" }}
          >
            {simulating ? <><Loader2 size={14} className="animate-spin" />Simulating…</> : <><PlayCircle size={14} />Run {simDuration} Month{simDuration>1?"s":""}</>}
          </button>
        </GlassCard>

        {/* Reset */}
        <GlassCard style={{ borderColor: "rgba(239,68,68,0.20)" }}>
          <div className="flex items-center gap-2 mb-4" style={{ color: "#ef4444" }}>
            <Database size={18} />
            <h3 className="text-xs font-bold uppercase tracking-widest">Database Controls</h3>
          </div>
          <p className="text-xs mb-6 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Hard reset: wipes all businesses, history, logs, and notifications, then runs the initial data seeder.
            <span className="font-bold text-rose-400"> This action is irreversible.</span>
          </p>
          <button onClick={handleReset} disabled={resetting}
            className="w-full glass-btn py-3 text-sm justify-center"
            style={{ background: "linear-gradient(135deg,#dc2626,#d97706)" }}
          >
            {resetting ? <><Loader2 size={14} className="animate-spin" />Resetting…</> : <><RefreshCw size={14} />Hard Reset Database</>}
          </button>
        </GlassCard>
      </div>

      {msg && (
        <div className="p-3 rounded-xl text-sm font-medium border"
          style={{
            background: msg.ok ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
            borderColor: msg.ok ? "rgba(16,185,129,0.30)" : "rgba(239,68,68,0.30)",
            color: msg.ok ? "#10b981" : "#ef4444",
          }}>
          {msg.text}
        </div>
      )}

      {/* Logs */}
      <GlassCard className="flex flex-col" style={{ height: "380px" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 gap-2"
          style={{ borderBottom: "1px solid var(--border-color)" }}>
          <div className="flex items-center gap-2">
            <Terminal style={{ color: "#a855f7" }} size={17} />
            <h4 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-primary)" }}>
              Simulation Logs
            </h4>
          </div>
          <div className="flex gap-1.5 flex-wrap items-center">
            {["","simulation","migration","merger","bankruptcy","auth"].map(cat => (
              <button key={cat} onClick={() => setLogFilter(cat)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-all"
                style={{
                  background: logFilter === cat ? "rgba(168,85,247,0.20)" : "var(--bg-hover)",
                  border: `1px solid ${logFilter === cat ? "rgba(168,85,247,0.50)" : "var(--border-color)"}`,
                  color: logFilter === cat ? "#a855f7" : "var(--text-faint)",
                }}
              >{cat || "All"}</button>
            ))}
            <button onClick={fetchLogs} title="Refresh" style={{ color: "var(--text-muted)" }} className="cursor-pointer">
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
        <div className="flex-1 log-terminal overflow-y-auto space-y-1.5" style={{ color: "#22d3ee" }}>
          {loadingLogs ? (
            <p className="text-center py-8" style={{ color: "var(--text-faint)" }}>Loading logs…</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center py-8" style={{ color: "var(--text-faint)" }}>No logs match this filter.</p>
          ) : filteredLogs.map(log => {
            let cc = "#a855f7";
            if (log.category === "bankruptcy") cc = "#ef4444";
            else if (log.category === "migration") cc = "#f59e0b";
            else if (log.category === "merger") cc = "#6366f1";
            else if (log.category === "startup") cc = "#10b981";
            else if (log.category === "auth") cc = "#06b6d4";
            return (
              <div key={log.id} className="flex gap-2 hover:bg-white/5 py-0.5 rounded">
                <span style={{ color: "var(--text-faint)" }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span style={{ color: cc }} className="font-bold uppercase">[{log.category}]</span>
                <span style={{ color: "var(--text-secondary)" }}>{log.message}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 5 — WORLD MAP MANAGEMENT
───────────────────────────────────────────── */
function WorldMapTab() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState("cities");
  const [custom, setCustom] = useState(() => {
    try { return JSON.parse(localStorage.getItem("admin_map_entries") || "[]"); } catch { return []; }
  });
  const [showModal, setShowModal] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [mapForm, setMapForm] = useState({ type:"city", name:"", country:"", latitude:"", longitude:"" });

  useEffect(() => {
    api.get("/businesses/", { params:{ active_only:false } })
      .then(r => setBusinesses(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = (entries) => { setCustom(entries); localStorage.setItem("admin_map_entries", JSON.stringify(entries)); };

  const bizCities = [...new Map(businesses.map(b => [b.city, { name:b.city, country:b.country, count:businesses.filter(x=>x.city===b.city).length }])).values()];
  const bizCountries = [...new Map(businesses.map(b => [b.country, { name:b.country, cities:[...new Set(businesses.filter(x=>x.country===b.country).map(x=>x.city))].length, count:businesses.filter(x=>x.country===b.country).length }])).values()];

  const customCities    = custom.filter(e => e.type === "city");
  const customCountries = custom.filter(e => e.type === "country");

  const allCities    = [...bizCities,    ...customCities.map((e,i) => ({ ...e, _custom:true, _idx:custom.indexOf(e) }))];
  const allCountries = [...bizCountries, ...customCountries.map(e => ({ ...e, cities:0, count:0, _custom:true, _idx:custom.indexOf(e) }))];

  const handleSave = () => {
    const entries = [...custom];
    if (editIdx !== null) entries[editIdx] = mapForm; else entries.push(mapForm);
    save(entries); setShowModal(false);
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="World Map Management" subtitle="Cities and countries in the simulation" />
      <div className="flex gap-2">
        {["cities","countries"].map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase cursor-pointer transition-all border ${subTab===t?"bg-purple-500/20 border-purple-500/50 text-purple-400":"glass-btn-secondary"}`}
            style={subTab!==t?{border:"1px solid var(--border-color)"}:{}}
          >{t}</button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <GlassCard className="p-0 overflow-hidden">
          <div className="flex justify-end px-4 pt-4">
            <button onClick={() => { setEditIdx(null); setMapForm({type:subTab==="cities"?"city":"country",name:"",country:"",latitude:"",longitude:""}); setShowModal(true); }}
              className="glass-btn text-sm py-2 px-4">
              <Plus size={14} /> Add {subTab === "cities" ? "City" : "Country"}
            </button>
          </div>
          <div className="overflow-x-auto mt-2">
            <table className="theme-table">
              <thead>
                <tr>
                  {subTab === "cities"
                    ? ["City","Country","Businesses","Source","Actions"].map(h=><th key={h}>{h}</th>)
                    : ["Country","Cities","Businesses","Source","Actions"].map(h=><th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(subTab==="cities"?allCities:allCountries).map((row,i) => (
                  <tr key={i}>
                    <td className="font-semibold" style={{color:"var(--text-primary)"}}>{row.name}</td>
                    {subTab==="cities"?<td style={{color:"var(--text-secondary)"}}>{row.country}</td>:<td style={{color:"var(--text-secondary)"}}>{row.cities}</td>}
                    <td style={{color:"var(--text-secondary)"}}>{row.count}</td>
                    <td>{row._custom
                      ? <span className="badge badge-amber">Custom</span>
                      : <span className="badge badge-emerald">Simulation</span>}
                    </td>
                    <td>{row._custom && (
                      <div className="flex gap-1.5">
                        <ActionBtn icon={Edit2} color="cyan" onClick={() => { setEditIdx(row._idx); setMapForm(custom[row._idx]); setShowModal(true); }} title="Edit" />
                        <ActionBtn icon={Trash2} color="rose" onClick={() => { if(window.confirm("Remove?")) save(custom.filter((_,k)=>k!==row._idx)); }} title="Delete" />
                      </div>
                    )}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={`${editIdx!==null?"Edit":"Add"} ${mapForm.type==="city"?"City":"Country"}`}>
        <div className="space-y-4">
          <Field label="Name"><TInput value={mapForm.name} onChange={e=>setMapForm({...mapForm,name:e.target.value})} /></Field>
          {mapForm.type==="city" && <Field label="Country"><TInput value={mapForm.country} onChange={e=>setMapForm({...mapForm,country:e.target.value})} /></Field>}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude"><TInput type="number" value={mapForm.latitude} onChange={e=>setMapForm({...mapForm,latitude:e.target.value})} /></Field>
            <Field label="Longitude"><TInput type="number" value={mapForm.longitude} onChange={e=>setMapForm({...mapForm,longitude:e.target.value})} /></Field>
          </div>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={()=>setShowModal(false)} className="glass-btn-secondary px-5 py-2.5 rounded-xl text-sm">Cancel</button>
          <button onClick={handleSave} className="glass-btn py-2.5 px-5 text-sm"><Save size={13}/> Save</button>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 6 — ANALYTICS
───────────────────────────────────────────── */
function AnalyticsTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    api.get("/simulation/history")
      .then(r => setHistory(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chartData = history.map(h => ({
    name: `M${h.step_number}`,
    revenue:   Math.round(h.avg_revenue),
    employees: h.total_employees,
    businesses:h.total_businesses,
    startups:  h.active_startups,
    collapse:  Math.round(h.collapse_risk),
    gdp:       parseFloat(h.gdp_growth?.toFixed(2) || 0),
    migration: h.migration_count,
  }));

  const DARK_TOOLTIP = { backgroundColor:"rgba(8,9,16,0.97)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"12px", color:"#f1f5f9" };
  const LIGHT_TOOLTIP = { backgroundColor:"#ffffff", border:"1px solid rgba(0,0,0,0.10)", borderRadius:"12px", color:"#0f172a" };
  const tooltipStyle = theme === "dark" ? DARK_TOOLTIP : LIGHT_TOOLTIP;
  const gridColor = theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const axisColor = theme === "dark" ? "#475569" : "#94a3b8";

  if (loading) return <Spinner />;

  const noData = chartData.length === 0;

  const ChartWrapper = ({ children }) => (
    <div className="h-52">
      {noData
        ? <div className="h-full flex items-center justify-center text-xs" style={{color:"var(--text-faint)"}}>Run simulations to generate chart data.</div>
        : <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>}
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionHeader title="Analytics" subtitle="Economic performance charts and trends" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{color:"var(--text-muted)"}}>Revenue & GDP Growth</h4>
          <ChartWrapper>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={11} />
              <YAxis yAxisId="l" stroke="var(--chart-color-1)" fontSize={10} />
              <YAxis yAxisId="r" orientation="right" stroke="var(--chart-color-2)" fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{fontSize:11}} />
              <Line yAxisId="l" type="monotone" dataKey="revenue" name="Avg Revenue ($)" stroke="var(--chart-color-1)" strokeWidth={2} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="gdp" name="GDP Growth (%)" stroke="var(--chart-color-2)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartWrapper>
        </GlassCard>

        <GlassCard>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{color:"var(--text-muted)"}}>Employment & Businesses</h4>
          <ChartWrapper>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="empGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--chart-gradient-1)" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="var(--chart-gradient-1)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={11} />
              <YAxis stroke={axisColor} fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{fontSize:11}} />
              <Area type="monotone" dataKey="employees" name="Employees" stroke="var(--chart-color-3)" fill="url(#empGrad)" strokeWidth={2} />
              <Line type="monotone" dataKey="businesses" name="Businesses" stroke="var(--chart-color-4)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ChartWrapper>
        </GlassCard>

        <GlassCard>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{color:"var(--text-muted)"}}>Migration Events</h4>
          <ChartWrapper>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={11} />
              <YAxis stroke={axisColor} fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="migration" name="Migration" fill="var(--chart-color-5)" radius={[4,4,0,0]} />
            </BarChart>
          </ChartWrapper>
        </GlassCard>

        <GlassCard>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{color:"var(--text-muted)"}}>Collapse Risk & Startups</h4>
          <ChartWrapper>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={11} />
              <YAxis stroke={axisColor} fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{fontSize:11}} />
              <Line type="monotone" dataKey="collapse" name="Collapse Risk (%)" stroke="var(--chart-color-4)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="startups" name="Active Startups" stroke="var(--chart-color-2)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartWrapper>
        </GlassCard>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 7 — RECOMMENDATIONS
───────────────────────────────────────────── */
function RecommendationsTab() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/simulation/notifications")
      .then(r => setRecs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const typeColor = { collapse_warning:"rose", startup_boom:"indigo", employment_decline:"amber" };

  return (
    <div className="space-y-4">
      <SectionHeader title="Recommendations" subtitle="AI-generated business and economic suggestions" />
      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recs.length === 0
            ? <GlassCard><p className="text-center py-8 text-xs" style={{color:"var(--text-faint)"}}>No recommendations yet. Run simulations to generate AI insights.</p></GlassCard>
            : recs.map(r => {
              const color = typeColor[r.type] || "slate";
              return (
                <GlassCard key={r.id} className="glass-panel-hover">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className={`badge badge-${color}`}>{r.type?.replace(/_/g," ")}</span>
                    <span className="text-[10px]" style={{color:"var(--text-faint)"}}>
                      {new Date(r.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-bold mb-1" style={{color:"var(--text-primary)"}}>{r.title}</p>
                  <p className="text-xs leading-relaxed" style={{color:"var(--text-muted)"}}>{r.message}</p>
                  <div className={`mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase`}
                    style={{color: r.is_read ? "var(--text-faint)" : "var(--color-info)"}}>
                    <span className={`w-1.5 h-1.5 rounded-full ${r.is_read?"bg-slate-500":"bg-cyan-400"}`} />
                    {r.is_read ? "Read" : "New"}
                  </div>
                </GlassCard>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 8 — SYSTEM SETTINGS
───────────────────────────────────────────── */
function SettingsTab() {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [apiStatus, setApiStatus] = useState(null);
  const [checkingApi, setCheckingApi] = useState(false);

  const [simDefaults, setSimDefaults] = useState(() => {
    try { return JSON.parse(localStorage.getItem("admin_sim_defaults") || "null") || { defaultMonths:1, maxAgents:100, seedData:true }; }
    catch { return { defaultMonths:1, maxAgents:100, seedData:true }; }
  });
  const [mapSettings, setMapSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("admin_map_settings") || "null") || { showGrid:true, showLabels:true, projection:"mercator" }; }
    catch { return { showGrid:true, showLabels:true, projection:"mercator" }; }
  });
  const [saved, setSaved] = useState(false);

  const checkApi = async () => {
    setCheckingApi(true);
    try {
      const r = await api.get("/simulation/stats");
      setApiStatus({ ok: true, msg: "Backend API is healthy ✅" });
    } catch {
      setApiStatus({ ok: false, msg: "Backend API unreachable ❌" });
    } finally { setCheckingApi(false); }
  };

  useEffect(() => { checkApi(); }, []);

  const handleSave = () => {
    localStorage.setItem("admin_sim_defaults", JSON.stringify(simDefaults));
    localStorage.setItem("admin_map_settings", JSON.stringify(mapSettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full flex items-center transition-colors cursor-pointer border-none ${value?"bg-cyan-500":"bg-slate-600"}`}>
      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${value?"translate-x-5":"translate-x-0"}`} />
    </button>
  );

  return (
    <div className="space-y-6">
      <SectionHeader title="System Settings" subtitle="Platform configuration and health" />

      {/* API Status */}
      <GlassCard>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{color:"var(--text-primary)"}}>
          <Server size={15} style={{color:"var(--color-info)"}} /> API & Backend Health
        </h3>
        <div className="flex items-center gap-4 flex-wrap">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border ${
            apiStatus?.ok
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
              : apiStatus?.ok === false
              ? "bg-rose-500/10 border-rose-500/25 text-rose-400"
              : "bg-slate-500/10 border-slate-500/20 text-slate-400"
          }`}>
            {apiStatus?.ok ? <Wifi size={15}/> : <WifiOff size={15}/>}
            {apiStatus?.msg || "Checking…"}
          </div>
          <button onClick={checkApi} disabled={checkingApi}
            className="glass-btn-secondary px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
            {checkingApi ? <Loader2 size={13} className="animate-spin"/> : <RefreshCw size={13}/>}
            Recheck
          </button>
        </div>
      </GlassCard>

      {/* Theme */}
      <GlassCard>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{color:"var(--text-primary)"}}>
          Theme Settings
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "light", label: "☀ Light" },
            { id: "dark", label: "🌙 Dark" },
            { id: "ocean", label: "🌊 Ocean" },
            { id: "nature", label: "🌿 Nature" }
          ].map(t => (
            <button key={t.id} onClick={async () => {
              if (theme !== t.id) {
                setTheme(t.id);
                if (user) {
                  try {
                    await api.put("/auth/users/me/theme", { theme: t.id });
                    updateProfile({ ...user, theme: t.id });
                  } catch (err) {
                    console.error("Failed to save theme in settings tab:", err);
                  }
                }
              }
            }}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold cursor-pointer transition-all"
              style={{
                background: theme===t.id ? "var(--bg-hover)" : "transparent",
                border: `1.5px solid ${theme===t.id ? "var(--border-focus)" : "var(--border-color)"}`,
                color: theme===t.id ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs mt-3" style={{color:"var(--text-faint)"}}>
          Theme is persisted and applies across all pages instantly.
        </p>
      </GlassCard>

      {/* Simulation Defaults */}
      <GlassCard>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-5 flex items-center gap-2" style={{color:"var(--text-primary)"}}>
          <Activity size={15} style={{color:"var(--color-info)"}} /> Default Simulation Values
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Default Duration (months)">
            <TSelect value={simDefaults.defaultMonths} onChange={e=>setSimDefaults({...simDefaults,defaultMonths:+e.target.value})}>
              {[1,6,12,60,120].map(v=><option key={v} value={v}>{v}</option>)}
            </TSelect>
          </Field>
          <Field label="Max Agents">
            <TInput type="number" value={simDefaults.maxAgents} onChange={e=>setSimDefaults({...simDefaults,maxAgents:+e.target.value})} />
          </Field>
          <Field label="Auto-seed on Reset">
            <div className="flex items-center gap-3 mt-1">
              <Toggle value={simDefaults.seedData} onChange={v=>setSimDefaults({...simDefaults,seedData:v})} />
              <span className="text-sm" style={{color:"var(--text-muted)"}}>{simDefaults.seedData?"Enabled":"Disabled"}</span>
            </div>
          </Field>
        </div>
      </GlassCard>

      {/* Map Settings */}
      <GlassCard>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-5 flex items-center gap-2" style={{color:"var(--text-primary)"}}>
          <Globe size={15} className="text-emerald-400" /> Map Settings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Projection">
            <TSelect value={mapSettings.projection} onChange={e=>setMapSettings({...mapSettings,projection:e.target.value})}>
              {["mercator","orthographic","equirectangular"].map(p=><option key={p}>{p}</option>)}
            </TSelect>
          </Field>
          <Field label="Show Grid Lines">
            <div className="flex items-center gap-3 mt-1">
              <Toggle value={mapSettings.showGrid} onChange={v=>setMapSettings({...mapSettings,showGrid:v})} />
              <span className="text-sm" style={{color:"var(--text-muted)"}}>{mapSettings.showGrid?"On":"Off"}</span>
            </div>
          </Field>
          <Field label="Show City Labels">
            <div className="flex items-center gap-3 mt-1">
              <Toggle value={mapSettings.showLabels} onChange={v=>setMapSettings({...mapSettings,showLabels:v})} />
              <span className="text-sm" style={{color:"var(--text-muted)"}}>{mapSettings.showLabels?"On":"Off"}</span>
            </div>
          </Field>
        </div>
      </GlassCard>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="glass-btn py-2.5 px-6 text-sm">
          <Save size={14}/> Save Settings
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold" style={{color:"#10b981"}}>
            <CheckCircle2 size={15}/> Saved!
          </span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN ADMIN PANEL
───────────────────────────────────────────── */
const TABS = [
  { id:"dashboard",     label:"Dashboard",       icon:LayoutDashboard },
  { id:"users",         label:"Users",           icon:Users           },
  { id:"businesses",    label:"Businesses",      icon:Building2       },
  { id:"simulation",    label:"Simulation",      icon:Activity        },
  { id:"map",           label:"World Map",       icon:Globe           },
  { id:"analytics",     label:"Analytics",       icon:BarChart3       },
  { id:"recommendations",label:"Recommendations",icon:Lightbulb      },
  { id:"settings",      label:"Settings",        icon:Settings        },
];

const AdminPanel = ({ initialTab = "dashboard" }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  /* Sync tab when parent changes initialTab (sidebar click) */
  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);

  useEffect(() => {
    const load = async () => {
      try {
        const [bizRes, usersRes, histRes, statsRes] = await Promise.allSettled([
          api.get("/businesses/", { params:{ active_only:false } }),
          api.get("/auth/users"),
          api.get("/simulation/history"),
          api.get("/simulation/stats"),
        ]);
        const biz  = bizRes.status  === "fulfilled" ? bizRes.value.data  : [];
        const users= usersRes.status=== "fulfilled" ? usersRes.value.data: [];
        const hist = histRes.status === "fulfilled" ? histRes.value.data : [];
        const simStats = statsRes.status === "fulfilled" ? statsRes.value.data : null;

        setStats({
          total_users:        users.length,
          total_businesses:   biz.length,
          total_ai_agents:    biz.length,
          total_simulations:  hist.length,
          total_countries:    new Set(biz.map(b => b.country)).size,
          total_cities:       new Set(biz.map(b => b.city)).size,
          avg_revenue:        simStats?.avg_revenue,
          total_employees:    simStats?.total_employees,
          economic_health:    simStats?.economic_health_score,
        });
      } catch { /* silent */ } finally { setStatsLoading(false); }
    };
    load();
  }, []);

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <ShieldAlert size={52} style={{ color: "#ef4444" }} />
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Access Denied</p>
        <p style={{ color: "var(--text-muted)" }}>Administrator privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background:"linear-gradient(135deg,#dc2626,#7c3aed)", boxShadow:"0 0 20px rgba(124,58,237,0.4)" }}
        >
          <ShieldAlert size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
            ADMIN CONTROL CENTER
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Logged in as <strong className="text-purple-500 font-bold">{currentUser?.username}</strong>
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="admin-tabbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {activeTab === "dashboard"       && <AdminDashboard stats={stats} loading={statsLoading} />}
        {activeTab === "users"           && <UserManagementTab currentUser={currentUser} />}
        {activeTab === "businesses"      && <BusinessManagementTab />}
        {activeTab === "simulation"      && <SimulationTab />}
        {activeTab === "map"             && <WorldMapTab />}
        {activeTab === "analytics"       && <AnalyticsTab />}
        {activeTab === "recommendations" && <RecommendationsTab />}
        {activeTab === "settings"        && <SettingsTab />}
      </div>
    </div>
  );
};

export default AdminPanel;
