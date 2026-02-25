import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { auth } from "./config/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({
    origin: process.env.APP_ALLOWED_ORIGINS || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/status", (req, res) => {
    res.json({
        status: "ok",
        message: "Clinic server active",
        timestamp: new Date().toISOString()
    });
});

app.use(errorHandler);

export default app;
