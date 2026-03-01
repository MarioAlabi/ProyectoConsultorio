import express from "express";
import { createPreclinicalController } from "../controllers/preclinicalController.js";
import { requireRole } from "../middleware/requireRole.js";
import { getPreclinicalController } from "../controllers/preclinicalController.js";

const router = express.Router();

router.post(
  "/",
  requireRole(["ASSISTANT", "DOCTOR", "ADMIN"]),
  createPreclinicalController
);
router.get(
    "/",
    requireRole(["DOCTOR", "ADMIN"]),
    getPreclinicalController
  );

export default router;