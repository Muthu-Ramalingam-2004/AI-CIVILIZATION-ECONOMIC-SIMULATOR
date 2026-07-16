import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { TrendingUp, Mail, ShieldAlert, Sun, Moon, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import api from "../utils/api";

interface ForgotPasswordProps {
  navigateTo: (path: string) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ navigateTo }) => {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setSuccess(res.data?.message || "Password reset email sent.");
    } catch (err: any) {
      console.error("Error requesting password reset", err);
      let msg = "An unexpected error occurred.";
      if (err.response?.status === 404) {
        msg = "No account found with this email.";
      } else if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err.message) {
        msg = err.message;
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

      {/* Main Card */}
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
              Forgot Password
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-xs"
              style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
              <ShieldAlert size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 rounded-xl flex items-start gap-2 text-xs"
              style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                  Registered Email Address
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

              <button
                type="submit"
                disabled={loading}
                className="glass-btn w-full mt-2 py-3"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-white" />
                    Sending request...
                  </span>
                ) : (
                  "Send Reset Email"
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
                Please check your inbox for instructions on setting your new password.
              </p>
            </div>
          )}

          {/* Go back link */}
          <div className="mt-6 text-center border-t pt-4" style={{ borderColor: "var(--border-color)" }}>
            <button
              onClick={() => navigateTo("/login")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer hover:underline"
              style={{ color: "var(--text-muted)", background: "transparent", border: "none" }}
            >
              <ArrowLeft size={13} />
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
