import { Router } from "express";
import {
    suggestIcd10Controller,
    summarizePatientController,
    draftAnamnesisController,
    checkPrescriptionSafetyController,
    extractHistoryController,
    analyzeReportController,
} from "../controllers/aiClinicalController.js";
import { isAuth } from "../middleware/isAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

const canClinical = [ROLES.DOCTOR, ROLES.ADMIN];
const canReadOnly = [ROLES.DOCTOR, ROLES.ADMIN, ROLES.ASSISTANT];

router.post("/suggest-icd10", isAuth, requireRole(canClinical), suggestIcd10Controller);
router.get("/patient/:patientId/summary", isAuth, requireRole(canReadOnly), summarizePatientController);
router.post("/draft-anamnesis", isAuth, requireRole(canClinical), draftAnamnesisController);
router.post("/check-prescription", isAuth, requireRole(canClinical), checkPrescriptionSafetyController);
router.post("/extract-history", isAuth, requireRole(canReadOnly), extractHistoryController);
router.post("/analyze-report", isAuth, requireRole(canClinical), analyzeReportController);

export default router;
