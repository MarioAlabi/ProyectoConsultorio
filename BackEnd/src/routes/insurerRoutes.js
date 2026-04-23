import express from "express";
import { createInsurerController, getInsurerController, getInsurersController,updateInsurerController,toggleInsurerStatusController } from "../controllers/insurerController.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

const canRead = [ROLES.ASSISTANT, ROLES.DOCTOR, ROLES.ADMIN];
const canManage = [ROLES.DOCTOR, ROLES.ADMIN];

router.get("/", requireRole(canRead), getInsurersController);
router.get("/:id", requireRole(canRead), getInsurerController);
router.post("/", requireRole(canManage), createInsurerController);
router.put("/:id", requireRole(canManage), updateInsurerController);
router.patch("/:id/status", requireRole(canManage), toggleInsurerStatusController);

export default router;
