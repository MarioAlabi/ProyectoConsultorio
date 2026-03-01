import express from "express";
import { createPreclinicalController } from "../controllers/preclinicalController.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

router.post(
  "/",
  requireRole(["ASSISTANT", "DOCTOR", "ADMIN"]),
  createPreclinicalController
);

export default router;