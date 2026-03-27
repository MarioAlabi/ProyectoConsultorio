import express from "express";
import * as appointmentController from "../controllers/appointmentController.js";
import { isAuth } from "../middleware/isAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();
const canWrite = [ROLES.ASSISTANT, ROLES.DOCTOR, ROLES.ADMIN];
const canRead = [ROLES.ASSISTANT, ROLES.DOCTOR, ROLES.ADMIN];

router.post("/", isAuth, requireRole(canWrite), appointmentController.create);
router.get("/", isAuth, requireRole(canRead), appointmentController.getByDate);
router.put("/:id", isAuth, requireRole(canWrite), appointmentController.update);
router.patch("/:id/status", isAuth, requireRole(canWrite), appointmentController.changeStatus);

export default router;
