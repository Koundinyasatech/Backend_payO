import axios from "axios";

const API_BASE = "https://shadily-hazard-widget.ngrok-free.dev";

// Axios Instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Request Interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("payo_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("payo_token");
      localStorage.removeItem("payo_admin");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
