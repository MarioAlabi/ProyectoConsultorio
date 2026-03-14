import { Router } from "express";
import { createConsultationController } from "../controllers/consultationController.js";
import {  requireRole } from "../middleware/requireRole.js"; 
const router = Router();
router.post("/:preclinicalId", requireRole(["doctor"]), createConsultationController);

export default router;