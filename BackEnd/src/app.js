import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { auth } from "./config/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import patientRoutes from "./routes/patientRoutes.js";
import preclinicalRoutes from "./routes/preclinicalRoutes.js";
import consultationRoutes from "./routes/consultationRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
const app = express();

const allowedOrigins = process.env.APP_ALLOWED_ORIGINS
    ? process.env.APP_ALLOWED_ORIGINS.split(',')
    : ["http://localhost:5173"];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH","DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use("/api/patients", patientRoutes);
app.use("/api/preclinical", preclinicalRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/audit", auditRoutes);
app.get("/status", (req, res) => {
    res.json({
        status: "ok",
        message: "Clinic server active",
        timestamp: new Date().toISOString()
    });
});

app.use(errorHandler);

export default app;
