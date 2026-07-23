import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
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
import ForgotPassword from "./components/ForgotPassword";
import NotFound from "./components/NotFound";

const TAB_TO_PATH = {
  dashboard: "/dashboard",
  businesses: "/businesses",
  predictions: "/predictions",
  map: "/map",
  recommendations: "/recommendations",
  admin: "/admin/dashboard",
  admin_users: "/admin/users",
  admin_businesses: "/admin/businesses",
  admin_simulation: "/admin/simulation",
  admin_map: "/admin/map",
  admin_analytics: "/admin/analytics",
  admin_recommend: "/admin/recommendations",
  admin_settings: "/admin/settings",
};

const PATH_TO_TAB = {
  "/dashboard": "dashboard",
  "/businesses": "businesses",
  "/predictions": "predictions",
  "/map": "map",
  "/recommendations": "recommendations",
  "/admin/dashboard": "admin",
  "/admin/users": "admin_users",
  "/admin/businesses": "admin_businesses",
  "/admin/simulation": "admin_simulation",
  "/admin/map": "admin_map",
  "/admin/analytics": "admin_analytics",
  "/admin/recommendations": "admin_recommend",
  "/admin/settings": "admin_settings",
};

function App() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTabState] = useState("dashboard");

  // Sync activeTab highlight with the current pathname
  useEffect(() => {
    const currentPath = location.pathname;
    if (PATH_TO_TAB[currentPath]) {
      setActiveTabState(PATH_TO_TAB[currentPath]);
    } else if (currentPath.startsWith("/admin")) {
      // If path is just /admin or /admin/, redirect to dashboard
      if (currentPath === "/admin" || currentPath === "/admin/") {
        navigate("/admin/dashboard", { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  const handleTabChange = (tabId) => {
    const path = TAB_TO_PATH[tabId];
    if (path) {
      navigate(path);
    }
  };

  // Loading guard for Auth initialization
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Wrapper for Auth Protected Route
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return children;
  };

  // Wrapper for Admin Only Route
  const AdminProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    if (user.role !== "admin") {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  return (
    <Routes>
      {/* Public auth routes */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"} replace />
          ) : (
            <Login navigateTo={navigate} />
          )
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword navigateTo={navigate} />} />
      <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />} />

      {/* User protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to={user?.role === "admin" ? "/admin/dashboard" : "/dashboard"} replace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout activeTab={activeTab} setActiveTab={handleTabChange} theme={theme}>
              <DashboardHome />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/businesses"
        element={
          <ProtectedRoute>
            <Layout activeTab={activeTab} setActiveTab={handleTabChange} theme={theme}>
              <BusinessManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/predictions"
        element={
          <ProtectedRoute>
            <Layout activeTab={activeTab} setActiveTab={handleTabChange} theme={theme}>
              <PredictionDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <Layout activeTab={activeTab} setActiveTab={handleTabChange} theme={theme}>
              <WorldMap />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recommendations"
        element={
          <ProtectedRoute>
            <Layout activeTab={activeTab} setActiveTab={handleTabChange} theme={theme}>
              <Recommendations />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin protected routes */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminProtectedRoute>
            <Layout activeTab={activeTab} setActiveTab={handleTabChange} theme={theme}>
              <AdminPanel initialTab="dashboard" />
            </Layout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminProtectedRoute>
            <Layout activeTab={activeTab} setActiveTab={handleTabChange} theme={theme}>
              <AdminPanel initialTab="users" />
            </Layout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/businesses"
        element={
          <AdminProtectedRoute>
            <Layout activeTab={activeTab} setActiveTab={handleTabChange} theme={theme}>
              <AdminPanel initialTab="businesses" />
            </Layout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/simulation"
        element={
          <AdminProtectedRoute>
            <Layout activeTab={activeTab} setActiveTab={handleTabChange} theme={theme}>
              <AdminPanel initialTab="simulation" />
            </Layout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/map"
        element={
          <AdminProtectedRoute>
            <Layout activeTab={activeTab} setActiveTab={handleTabChange} theme={theme}>
              <AdminPanel initialTab="map" />
            </Layout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <AdminProtectedRoute>
            <Layout activeTab={activeTab} setActiveTab={handleTabChange} theme={theme}>
              <AdminPanel initialTab="analytics" />
            </Layout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/recommendations"
        element={
          <AdminProtectedRoute>
            <Layout activeTab={activeTab} setActiveTab={handleTabChange} theme={theme}>
              <AdminPanel initialTab="recommendations" />
            </Layout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminProtectedRoute>
            <Layout activeTab={activeTab} setActiveTab={handleTabChange} theme={theme}>
              <AdminPanel initialTab="settings" />
            </Layout>
          </AdminProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFound navigateTo={navigate} />} />
    </Routes>
  );
}

const Layout = ({ children, activeTab, setActiveTab, theme }) => {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row" data-theme={theme}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main
        className="flex-1 overflow-y-auto w-full px-4 py-6 md:px-8 md:py-6 pt-20 lg:pt-6"
        style={{ maxWidth: "1440px", margin: "0 auto" }}
      >
        {children}
      </main>
    </div>
  );
};

export default App;
