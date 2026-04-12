import express from "express";
import * as auditController from "../controllers/auditController.js";
import { isAuth } from "../middleware/isAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// Solo administradores pueden ver los registros de auditoría (read-only)
const adminOnly = [ROLES.ADMIN];

router.get("/", isAuth, requireRole(adminOnly), auditController.getAuditLogs);
router.get("/record/:recordId", isAuth, requireRole(adminOnly), auditController.getAuditLogsByRecord);
router.get("/patient/:patientId", isAuth, requireRole(adminOnly), auditController.getAuditLogsByPatient);

// No hay endpoints POST/PUT/PATCH/DELETE: los registros de auditoría NO pueden ser editados.

export default router;
