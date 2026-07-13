import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { TrendingUp, Mail, Lock, User, ShieldAlert } from "lucide-react";
import GlassCard from "./GlassCard";

const Login = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        if (!email) {
          throw new Error("Email is required");
        }
        await register(username, email, password);
        setSuccess("Registration successful! Switching to login...");
        setTimeout(() => {
          setIsRegister(false);
          setPassword("");
          setSuccess("");
        }, 1500);
      } else {
        await login(username, password);
      }
    } catch (err) {
      let errMsg = "An unexpected error occurred.";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errMsg = detail.map(d => d.msg || JSON.stringify(d)).join(", ");
        } else if (typeof detail === "string") {
          errMsg = detail;
        } else {
          errMsg = JSON.stringify(detail);
        }
      } else if (err.message) {
        if (err.message === "Network Error") {
          errMsg = "Unable to connect to the simulation server. Please verify the backend is running on port 8000.";
        } else {
          errMsg = err.message;
        }
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <GlassCard className="relative overflow-hidden border-purple-500/20" hoverEffect={false}>
          {/* Glowing backlights */}
          <div className="absolute -top-16 -left-16 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-cyan-600/30 rounded-full blur-3xl pointer-events-none" />

          {/* Logo brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center shadow-neon-purple mb-4">
              <TrendingUp className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              CIVILIZATION SIM
            </h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
              AI Economic Agent Simulator
            </p>
          </div>

          <h3 className="text-xl font-bold text-center text-slate-200 mb-6">
            {isRegister ? "Create Portal Access" : "Gateway Authentication"}
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Username
              </label>
              <div className="relative flex items-center">
                <User size={18} className="absolute left-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="agent_smith"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input-icon"
                />
              </div>
            </div>

            {/* Email Field (Register Only) */}
            {isRegister && (
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail size={18} className="absolute left-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="smith@matrix.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input-icon"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Access Password
              </label>
              <div className="relative flex items-center">
                <Lock size={18} className="absolute left-4 text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input-icon"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="w-full glass-btn mt-6">
              {loading
                ? "Processing Telemetry..."
                : isRegister
                ? "Request Access"
                : "Initialize Session"}
            </button>
          </form>

          {/* Toggle register mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
                setSuccess("");
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline cursor-pointer"
            >
              {isRegister
                ? "Already registered? Login gateway"
                : "Need new simulation access? Register here"}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Login;
