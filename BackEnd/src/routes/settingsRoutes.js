import express from "express";
import * as settingsController from "../controllers/settingsController.js";
import { isAuth } from "../middleware/isAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();
const adminOnly = [ROLES.ADMIN];

router.get("/", isAuth, requireRole(adminOnly), settingsController.getClinicSettings);
router.post("/", isAuth, requireRole(adminOnly), settingsController.updateClinicSettings);

export default router;