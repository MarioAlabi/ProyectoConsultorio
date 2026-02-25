import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import { db } from "./db.js";
import * as schema from "../models/schema.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const emailFrom = process.env.RESEND_EMAIL_FROM || "no-reply@example.com";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "mysql",
        schema: {
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts,
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
        max: 100,
    },
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            void resend.emails.send({
                from: emailFrom,
                to: user.email,
                subject: "Reset your password",
                text: `Click the link to reset your password: ${url}`,
            });
        },
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            void resend.emails.send({
                from: emailFrom,
                to: user.email,
                subject: "Verify your email address",
                text: `Click the link to verify your email: ${url}`,
            });
        },
        sendOnSignUp: true,
    },
    user: {
        additionalFields: {
            role: { type: "string" },
            username: { type: "string" }
        }
    },
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
});
