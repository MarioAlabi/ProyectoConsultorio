import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import fileUpload from "express-fileupload";
import express from "express";
import { auth } from "./config/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import patientRoutes from "./routes/patientRoutes.js";
import preclinicalRoutes from "./routes/preclinicalRoutes.js";
import consultationRoutes from "./routes/consultationRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import insurerRoutes from "./routes/insurerRoutes.js";
import mantenimientoRoutes from './routes/mantenimientoroutes.js';
import settingsRoutes from "./routes/settingsRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import documentTemplateRoutes from "./routes/documentTemplateRoutes.js";
import generatedDocumentRoutes from "./routes/generatedDocumentRoutes.js";

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(fileUpload({
    createParentPath: true
}));


app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api/patients", patientRoutes);
app.use("/api/preclinical", preclinicalRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/insurers", insurerRoutes);
app.use('/api/admin', mantenimientoRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/document-templates", documentTemplateRoutes);
app.use("/api/generated-documents", generatedDocumentRoutes);

app.get("/status", (req, res) => {
    res.json({
        status: "ok",
        message: "Clinic server active",
        timestamp: new Date().toISOString()
    });
});

app.use(errorHandler);

export default app;
