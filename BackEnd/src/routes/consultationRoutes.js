import { Router } from "express";
import {
    createConsultationController,
    getClinicalHistoryController,
    getConsultationController,
    getInsurerConsultationReportController,
    getDiagnosticsReportController,
    getDiagnosisCatalogController,
} from "../controllers/consultationController.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

// Rutas específicas ANTES de las dinámicas /:preclinicalId para evitar colisiones.
router.get("/reports/by-insurer", requireRole(["doctor", "admin"]), getInsurerConsultationReportController);
router.get("/reports/diagnostics", requireRole(["doctor", "admin"]), getDiagnosticsReportController);
router.get("/reports/diagnosis-catalog", requireRole(["doctor", "admin"]), getDiagnosisCatalogController);
router.get("/patient/:patientId/history", requireRole(["doctor", "assistant"]), getClinicalHistoryController);
router.post("/:preclinicalId", requireRole(["doctor"]), createConsultationController);
router.get("/:preclinicalId", requireRole(["doctor", "assistant"]), getConsultationController);
export default router;
