import { Router } from "express";
import { createConsultationController, getConsultationController } from "../controllers/consultationController.js";
import {  requireRole } from "../middleware/requireRole.js"; 
const router = Router();
router.post("/:preclinicalId", requireRole(["doctor"]), createConsultationController);
router.get("/:preclinicalId", requireRole(["doctor", "assistant"]), getConsultationController);
export default router;