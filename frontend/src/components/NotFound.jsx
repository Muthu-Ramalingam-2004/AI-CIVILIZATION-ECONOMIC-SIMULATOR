import React from "react";
import { useTheme } from "../context/ThemeContext";
import { TrendingUp, ShieldAlert, ArrowLeft } from "lucide-react";

const NotFound = ({ navigateTo }) => {
  const { theme } = useTheme();

  const handleGoBack = () => {
    if (navigateTo) {
      navigateTo("/dashboard");
    } else {
      window.location.href = "/";
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

      {/* Main Card */}
      <div className="w-full max-w-[480px] relative z-10 text-center">
        <div
          className="glass-panel p-10 relative overflow-hidden"
          style={{ boxShadow: "var(--shadow-glass)" }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center mb-4"
              style={{ boxShadow: "0 0 30px rgba(124,58,237,0.45)" }}>
              <TrendingUp className="text-white" size={34} />
            </div>
            <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              CIVILIZATION SIM
            </h1>
          </div>

          <div className="flex items-center justify-center gap-2 text-rose-500 mb-4">
            <ShieldAlert size={28} />
            <span className="text-5xl font-black">404</span>
          </div>

          <h2 className="text-lg font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-primary)" }}>
            Page Not Found
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
            The simulation state you are trying to access does not exist or has been archived. Please verify the URL.
          </p>

          <button
            onClick={handleGoBack}
            className="glass-btn inline-flex items-center gap-2 py-3 px-6 cursor-pointer"
          >
            <ArrowLeft size={16} />
            Return to Civilization
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
