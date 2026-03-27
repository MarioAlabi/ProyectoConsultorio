import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      setTimeout(() => {
        isRedirecting = false;
        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }, 100);
    }
    return Promise.reject(error);
  }
);
