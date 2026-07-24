import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedAuth = localStorage.getItem("auth");
    if (savedAuth) {
      try {
        const { token } = JSON.parse(savedAuth);
        setToken(token);
        // Fetch detailed profile from backend
        api.get("/auth/users/me", {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          setUser(response.data);
          if (response.data.theme) {
            document.documentElement.setAttribute("data-theme", response.data.theme);
            localStorage.setItem("theme", response.data.theme);
          }
        }).catch(err => {
          console.error("Failed to fetch current user details", err);
          // Fallback to local session if backend is offline
          const parsed = JSON.parse(savedAuth);
          setUser({ username: parsed.username, role: parsed.role });
        }).finally(() => {
          setLoading(false);
        });
        return;
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

    const { access_token } = response.data;
    
    // Fetch full user profile details using the newly acquired token
    const userResponse = await api.get("/auth/users/me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const fullUser = userResponse.data;
    const authSession = { username: fullUser.username, role: fullUser.role, token: access_token };
    
    localStorage.setItem("auth", JSON.stringify(authSession));
    setUser(fullUser);
    setToken(access_token);
    
    if (fullUser.theme) {
      document.documentElement.setAttribute("data-theme", fullUser.theme);
      localStorage.setItem("theme", fullUser.theme);
    }
    
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

  const updateProfile = (updatedUser, newToken = null) => {
    setUser(updatedUser);
    if (newToken) {
      setToken(newToken);
      const savedAuth = localStorage.getItem("auth");
      if (savedAuth) {
        try {
          const parsed = JSON.parse(savedAuth);
          parsed.token = newToken;
          parsed.username = updatedUser.username;
          parsed.role = updatedUser.role;
          localStorage.setItem("auth", JSON.stringify(parsed));
        } catch (e) {
          console.error("Failed to update auth in localStorage", e);
        }
      }
    } else {
      const savedAuth = localStorage.getItem("auth");
      if (savedAuth) {
        try {
          const parsed = JSON.parse(savedAuth);
          parsed.username = updatedUser.username;
          parsed.role = updatedUser.role;
          localStorage.setItem("auth", JSON.stringify(parsed));
        } catch (e) {
          console.error("Failed to update auth in localStorage", e);
        }
      }
    }
    if (updatedUser.theme) {
      document.documentElement.setAttribute("data-theme", updatedUser.theme);
      localStorage.setItem("theme", updatedUser.theme);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
