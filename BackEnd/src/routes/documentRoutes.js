import express from "express";
import { generateDraft, renderPdfOnly } from "../controllers/documentController.js";
import { isAuth } from "../middleware/isAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

router.post("/generate-draft", isAuth, requireRole(["doctor", "admin"]), generateDraft);
router.post("/render-pdf", isAuth, requireRole(["doctor", "admin"]), renderPdfOnly);

export default router;