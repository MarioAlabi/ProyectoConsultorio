import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";
import {errorHandler} from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import cors from "cors";
const app = express();
app.use(cors({
    origin: "http://localhost:5173", 
    credentials: true,               
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use("/api/auth", toNodeHandler(auth));
app.use("/api/con/auth", authRoutes);
app.get("/status", (req, res) => {
    res.json({ 
        status: "ok", 
        message: "Servidor del Consultorio Activo",
        timestamp: new Date().toISOString()
    });
});
app.use(errorHandler);
export default app;