import React, { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import DashboardHome from "./components/DashboardHome";
import BusinessManagement from "./components/BusinessManagement";
import PredictionDashboard from "./components/PredictionDashboard";
import WorldMap from "./components/WorldMap";
import Recommendations from "./components/Recommendations";
import AdminPanel from "./components/AdminPanel";

function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Router switch based on active Sidebar tab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardHome />;
      case "businesses":
        return <BusinessManagement />;
      case "predictions":
        return <PredictionDashboard />;
      case "map":
        return <WorldMap />;
      case "recommendations":
        return <Recommendations />;
      case "admin":
        return user?.role === "admin" ? <AdminPanel /> : <DashboardHome />;
      default:
        return <DashboardHome />;
    }
  };

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Panel Content Area */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-[1440px] mx-auto w-full">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
