import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

// Forzamos la URL del servidor
const API_BASE = "https://consultorioback.marioalabi.com"; 

export const authClient = createAuthClient({
    baseURL: API_BASE,
    plugins: [adminClient()],
});