import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  TrendingUp, Mail, Lock, User, ShieldAlert,
  Sun, Moon, UserCircle2, ShieldCheck, Eye, EyeOff
} from "lucide-react";

const Login = () => {
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [role, setRole] = useState("user");  // "user" | "admin"
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* Auto-fill admin credentials hint */
  const handleRoleSelect = (r) => {
    setRole(r);
    setError("");
    setShowPassword(false);
    if (r === "admin" && mode === "login") {
      setUsername("admin");
    } else if (r === "user" && username === "admin") {
      setUsername("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (!email) throw new Error("Email is required");
        await register(username, email, password);
        setSuccess("Registration successful! You can now log in.");
        setTimeout(() => {
          setMode("login");
          setPassword("");
          setSuccess("");
        }, 1600);
      } else {
        const data = await login(username, password);
        // Role mismatch guard
        if (role === "admin" && data?.role !== "admin") {
          throw new Error("This account does not have admin privileges.");
        }
      }
    } catch (err) {
      let msg = "An unexpected error occurred.";
      if (err.response?.data?.detail) {
        const d = err.response.data.detail;
        msg = Array.isArray(d) ? d.map((x) => x.msg || JSON.stringify(x)).join(", ")
            : typeof d === "string" ? d
            : JSON.stringify(d);
      } else if (err.message) {
        msg = err.message === "Network Error"
          ? "Cannot connect to server. Ensure the backend is running on port 8000."
          : err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.5) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)" }} />
      </div>

      {/* Theme toggle (top-right) */}
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 p-2.5 rounded-xl cursor-pointer z-10 transition-all"
        style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-color)", color: "var(--text-muted)" }}
        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {theme === "dark" ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-500" />}
      </button>

      {/* Login Card */}
      <div className="w-full max-w-[420px] relative z-10">
        <div
          className="glass-panel p-8 relative overflow-hidden"
          style={{ boxShadow: "var(--shadow-glass)" }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center mb-4"
              style={{ boxShadow: "0 0 30px rgba(124,58,237,0.45)" }}>
              <TrendingUp className="text-white" size={34} />
            </div>
            <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              CIVILIZATION SIM
            </h1>
            <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>
              AI Economic Agent Simulator
            </p>
          </div>

          {/* Tab: Login / Register */}
          <div className="flex rounded-xl p-0.5 mb-6" style={{ background: "var(--bg-hover)", border: "1px solid var(--border-color)" }}>
            {[
              { key: "login", label: "Sign In" },
              { key: "register", label: "Register" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setMode(t.key); setError(""); setSuccess(""); setShowPassword(false); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  mode === t.key
                    ? "text-white bg-gradient-to-r from-purple-600 to-cyan-600 shadow-sm"
                    : ""
                }`}
                style={mode !== t.key ? { color: "var(--text-muted)" } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Role Selector (login only) */}
          {mode === "login" && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Login As
              </p>
              <div className="role-selector">
                <button
                  type="button"
                  onClick={() => handleRoleSelect("user")}
                  className={`role-option ${role === "user" ? "selected" : ""}`}
                >
                  <UserCircle2 size={22} />
                  User
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect("admin")}
                  className={`role-option ${role === "admin" ? "admin-selected" : ""}`}
                >
                  <ShieldCheck size={22} />
                  Admin
                </button>
              </div>
              {role === "admin" && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-1"
                  style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", color: "#a855f7" }}>
                  <ShieldAlert size={13} />
                  Default admin: <strong>admin</strong> / <strong>admin123</strong>
                </div>
              )}
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-xs"
              style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
              <ShieldAlert size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl text-xs"
              style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                Username
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                <input
                  type="text"
                  required
                  placeholder={role === "admin" ? "admin" : "your_username"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input-icon"
                />
              </div>
            </div>

            {/* Email (register) */}
            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input-icon"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input-icon"
                  style={{ paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg cursor-pointer transition-colors text-slate-400 hover:text-slate-200 flex items-center justify-center"
                  style={{ color: "var(--text-muted)", background: "transparent", border: "none" }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glass-btn w-full mt-2 py-3"
            >
              {loading
                ? "Authenticating…"
                : mode === "register"
                ? "Create Account"
                : role === "admin"
                ? "Admin Login"
                : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
