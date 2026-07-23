import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  TrendingUp, User, Lock, ShieldAlert, Sun, Moon,
  ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff, Check, X
} from "lucide-react";
import api from "../utils/api";

interface ForgotPasswordProps {
  navigateTo: (path: string) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ navigateTo }) => {
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();
  
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Password strength checklist states
  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const criteriaMetCount = [hasMinLen, hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
  
  const getStrengthText = () => {
    if (newPassword.length === 0) return "";
    if (criteriaMetCount === 5) return "Strong";
    if (criteriaMetCount >= 3) return "Medium";
    return "Weak";
  };

  const getStrengthColor = () => {
    const strength = getStrengthText();
    if (strength === "Strong") return "text-emerald-500";
    if (strength === "Medium") return "text-amber-500";
    return "text-rose-500";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (criteriaMetCount < 5) {
      setError("Please satisfy all password strength criteria.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", {
        username_or_email: usernameOrEmail,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      
      setSuccess("Password updated successfully! Logging you in...");
      
      const actualUsername = res.data.username || usernameOrEmail;
      await login(actualUsername, newPassword);

    } catch (err: any) {
      console.error("Error resetting password", err);
      let msg = "An unexpected error occurred.";
      if (err.response?.data?.detail) {
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
              Reset Password
            </p>
          </div>

          {success ? (
            <div className="mb-4 p-4 rounded-xl flex flex-col items-center justify-center text-center gap-3 text-xs"
              style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
              <CheckCircle2 size={32} className="text-emerald-500 animate-bounce" />
              <div className="font-bold text-sm">{success}</div>
              <p style={{ color: "var(--text-secondary)" }}>Redirecting you to the Sign In page...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl flex items-start gap-2 text-xs"
                  style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                  <ShieldAlert size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Username OR Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                  Username OR Registered Email
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                  <input
                    type="text"
                    required
                    placeholder="Enter your username or email"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="glass-input-icon"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                    New Password
                  </label>
                  {getStrengthText() && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${getStrengthColor()}`}>
                      {getStrengthText()}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="glass-input-icon"
                    style={{ paddingRight: "2.75rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg cursor-pointer transition-colors"
                    style={{ color: "var(--text-muted)", background: "transparent", border: "none" }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="glass-input-icon"
                    style={{ paddingRight: "2.75rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg cursor-pointer transition-colors"
                    style={{ color: "var(--text-muted)", background: "transparent", border: "none" }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password strength checklist */}
              <div className="p-3 rounded-xl space-y-1.5 text-[11px]" style={{ background: "var(--bg-hover)", border: "1px solid var(--border-color)" }}>
                <p className="font-semibold uppercase tracking-wider mb-2 text-[10px]" style={{ color: "var(--text-muted)" }}>Password Criteria</p>
                <div className="flex items-center gap-2">
                  {hasMinLen ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-rose-500" />}
                  <span style={{ color: hasMinLen ? "var(--text-primary)" : "var(--text-muted)" }}>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasUpper ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-rose-500" />}
                  <span style={{ color: hasUpper ? "var(--text-primary)" : "var(--text-muted)" }}>One uppercase letter (A-Z)</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasLower ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-rose-500" />}
                  <span style={{ color: hasLower ? "var(--text-primary)" : "var(--text-muted)" }}>One lowercase letter (a-z)</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasDigit ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-rose-500" />}
                  <span style={{ color: hasDigit ? "var(--text-primary)" : "var(--text-muted)" }}>One number (0-9)</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasSpecial ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-rose-500" />}
                  <span style={{ color: hasSpecial ? "var(--text-primary)" : "var(--text-muted)" }}>One special character (!@#$%^&*)</span>
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
                    Resetting Password...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
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
