import { Router } from "express";
import {
    createTemplateController,
    deleteTemplateController,
    draftTemplateWithAIController,
    getTemplateController,
    listTemplatesController,
    toggleTemplateStatusController,
    updateTemplateController,
} from "../controllers/documentTemplateController.js";
import { isAuth } from "../middleware/isAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

const canRead = [ROLES.DOCTOR, ROLES.ADMIN, ROLES.ASSISTANT];
const canManage = [ROLES.ADMIN, ROLES.DOCTOR];

// Endpoint de redacción asistida por IA (debe ir antes que /:id por claridad).
router.post("/ai-draft", isAuth, requireRole(canManage), draftTemplateWithAIController);

router.get("/", isAuth, requireRole(canRead), listTemplatesController);
router.get("/:id", isAuth, requireRole(canRead), getTemplateController);
router.post("/", isAuth, requireRole(canManage), createTemplateController);
router.put("/:id", isAuth, requireRole(canManage), updateTemplateController);
router.patch("/:id/status", isAuth, requireRole(canManage), toggleTemplateStatusController);
router.delete("/:id", isAuth, requireRole(canManage), deleteTemplateController);

export default router;
