import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db.js";
import * as schema from "../models/schema.js";
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "mysql",
        schema: {
            user: schema.usuarios,
            session: schema.sesiones,
            account: schema.cuentas,
            rateLimit: schema.rateLimit,
        }
    }),
    session: {
        expiresIn: 60 * 60 * 12, 
        updateAge: 60 * 60 * 1,  
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60
        }
    },
    rateLimit: {
        enabled: true,
        storage: "database", 
        window: 60,          
        max: 100,            // Máximo 100 peticiones por minuto 
    },
    emailAndPassword: { enabled: true },
    user: {
        additionalFields: {
            rol: { type: "string" },
            nombreUsuario: { type: "string" }
        }
    },
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
});