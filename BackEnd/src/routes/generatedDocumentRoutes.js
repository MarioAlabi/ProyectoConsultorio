import { Router } from "express";
import {
    generateDocumentController,
    getDocumentController,
    listPatientDocumentsController,
} from "../controllers/generatedDocumentController.js";
import { isAuth } from "../middleware/isAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

router.post("/", isAuth, requireRole([ROLES.DOCTOR]), generateDocumentController);

router.get("/patient/:patientId", isAuth, requireRole([ROLES.DOCTOR, ROLES.ADMIN, ROLES.ASSISTANT]), listPatientDocumentsController);
router.get("/:id", isAuth, requireRole([ROLES.DOCTOR, ROLES.ADMIN, ROLES.ASSISTANT]), getDocumentController);

export default router;
