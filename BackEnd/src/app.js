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
import aiClinicalRoutes from "./routes/aiClinicalRoutes.js";

const app = express();

// 1. Limpiamos espacios en blanco por si hubo un dedazo en el .env
const allowedOrigins = process.env.APP_ALLOWED_ORIGINS
    ? process.env.APP_ALLOWED_ORIGINS.split(',').map(url => url.trim())
    : ["http://localhost:5173", "https://consultoriofront.marioalabi.com"];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir peticiones sin origin (como Postman) o si el origin está en nuestra lista
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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

// Generación ad-hoc de documentos con IA + Puppeteer (flujo de Mario):
// - POST /api/documents/generate-draft
// - POST /api/documents/render-pdf
app.use("/api/documents", documentRoutes);

// Plantillas reutilizables de constancia/incapacidad y sus documentos emitidos:
// - CRUD de plantillas        → /api/document-templates
// - Emisión + historial       → /api/generated-documents
app.use("/api/document-templates", documentTemplateRoutes);
app.use("/api/generated-documents", generatedDocumentRoutes);

// Asistente clínico IA (ICD-10, resumen, anamnesis, receta, antecedentes, reportes):
app.use("/api/ai", aiClinicalRoutes);

app.get("/status", (req, res) => {
    res.json({
        status: "ok",
        message: "Clinic server active",
        timestamp: new Date().toISOString()
    });
});

app.use(errorHandler);

export default app;
