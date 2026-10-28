import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

const API_BASE = import.meta.env.VITE_API_URL !== undefined 
    ? import.meta.env.VITE_API_URL 
    : (import.meta.env.DEV ? "http://localhost:3000" : "");

export const authClient = createAuthClient({
    ...(API_BASE ? { baseURL: API_BASE } : {}),
    plugins: [adminClient()],
});