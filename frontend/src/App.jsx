import React, { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import DashboardHome from "./components/DashboardHome";
import BusinessManagement from "./components/BusinessManagement";
import PredictionDashboard from "./components/PredictionDashboard";
import WorldMap from "./components/WorldMap";
import Recommendations from "./components/Recommendations";
import AdminPanel from "./components/AdminPanel";

/* Map admin sub-routes to AdminPanel tab ids */
const ADMIN_TAB_MAP = {
  admin:              "dashboard",
  admin_users:        "users",
  admin_businesses:   "businesses",
  admin_simulation:   "simulation",
  admin_map:          "map",
  admin_analytics:    "analytics",
  admin_recommend:    "recommendations",
  admin_settings:     "settings",
};

function App() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");

  /* When user logs in, set sensible default tab */
  useEffect(() => {
    if (user?.role === "admin") {
      setActiveTab("admin");
    } else {
      setActiveTab("dashboard");
    }
  }, [user?.role]);

  const renderContent = () => {
    /* Admin routes */
    if (user?.role === "admin" && ADMIN_TAB_MAP[activeTab] !== undefined) {
      return <AdminPanel initialTab={ADMIN_TAB_MAP[activeTab]} />;
    }

    /* User routes */
    switch (activeTab) {
      case "dashboard":       return <DashboardHome />;
      case "businesses":      return <BusinessManagement />;
      case "predictions":     return <PredictionDashboard />;
      case "map":             return <WorldMap />;
      case "recommendations": return <Recommendations />;
      default:                return <DashboardHome />;
    }
  };

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen" data-theme={theme}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main
        className="flex-1 overflow-y-auto"
        style={{ padding: "1.5rem 2rem", maxWidth: "1440px", margin: "0 auto", width: "100%" }}
      >
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
