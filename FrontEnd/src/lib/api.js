import axios from "axios";

//const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://consultorioback.marioalabi.com";

export const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);
