import axios from "axios";

const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.")
    ) {
      return `${window.location.protocol}//${hostname}:8000/api/v1`;
    }
  }
  return (
    import.meta.env.VITE_API_URL ||
    "https://ai-civilization-economic-simulator.onrender.com/api/v1"
  );
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem("auth");
    console.log("=== API Request Interceptor ===");
    console.log("Request URL:", config.url);
    console.log("authData from localStorage:", authData);
    if (authData) {
      try {
        const { token } = JSON.parse(authData);
        console.log("Parsed token:", token);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log("Header Authorization set to:", config.headers.Authorization);
        } else {
          console.warn("Token is empty or falsy inside authData");
        }
      } catch (e) {
        console.error("Error parsing auth token", e);
      }
    } else {
      console.warn("No authData found in localStorage");
    }
    console.log("Request Headers:", { ...config.headers });
    console.log("===============================");
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration/validation failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized access! Clearing token session.");
      localStorage.removeItem("auth");
      // If we are not on the login page already, redirect
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
