import { Router } from "express";
import { createConsultationController, getClinicalHistoryController, getConsultationController } from "../controllers/consultationController.js";
import {  requireRole } from "../middleware/requireRole.js"; 
const router = Router();

// Ruta especifica para historial antes del parametro dinamico.
router.get("/patient/:patientId/history", requireRole(["doctor", "assistant"]), getClinicalHistoryController);
router.post("/:preclinicalId", requireRole(["doctor"]), createConsultationController);
router.get("/:preclinicalId", requireRole(["doctor", "assistant"]), getConsultationController);
export default router;
