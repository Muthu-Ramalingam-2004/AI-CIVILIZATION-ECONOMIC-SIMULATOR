import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if auth token exists in localStorage
    const savedAuth = localStorage.getItem("auth");
    if (savedAuth) {
      try {
        const { username, role, token } = JSON.parse(savedAuth);
        setUser({ username, role });
        setToken(token);
      } catch (e) {
        console.error("Failed to parse auth from localStorage", e);
        localStorage.removeItem("auth");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // FastAPI OAuth2PasswordRequestForm expects form-urlencoded payload
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);

    const response = await api.post("/auth/login", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const { access_token, role } = response.data;
    const authSession = { username, role, token: access_token };
    
    localStorage.setItem("auth", JSON.stringify(authSession));
    setUser({ username, role });
    setToken(access_token);
    return response.data;
  };

  const register = async (username, email, password) => {
    const response = await api.post("/auth/register", {
      username,
      email,
      password,
    });
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Failed to log out from backend", e);
    } finally {
      localStorage.removeItem("auth");
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
