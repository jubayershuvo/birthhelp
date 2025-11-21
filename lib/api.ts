import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL, // your external API
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include token only for protected routes
API.interceptors.request.use(
  (config) => {
    // Do not attach token for login or register
    if (config.url?.includes("/login")) {
      return config;
    }

    const token = localStorage.getItem("token");

    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 on protected route, remove token and redirect
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
