import express from "express";
import * as patientController from "../controllers/patientController.js";
import { isAuth } from "../middleware/isAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();
const canWrite = [ROLES.ASSISTANT, ROLES.ADMIN];
const canRead = [ROLES.ASSISTANT, ROLES.ADMIN, ROLES.DOCTOR];

router.post("/register", isAuth, requireRole(canWrite), patientController.createPatient);
router.get("/", isAuth, requireRole(canRead), patientController.getPatients);
router.get("/:id", isAuth, requireRole(canRead), patientController.getPatient);
router.put("/:id", isAuth, requireRole(canWrite), patientController.updatePatient);
router.patch("/:id/status", isAuth, requireRole(canWrite), patientController.changeStatus);

export default router;