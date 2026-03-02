import express from "express";
import { createPreclinicalController, getPreclinicalController, updatePreclinicalStatusController, getPreclinicalByIdController  } from "../controllers/preclinicalController.js";
import { requireRole } from "../middleware/requireRole.js";


const router = express.Router();

router.post(
  "/",
  requireRole(["assistant", "doctor", "admin"]),
  createPreclinicalController
);

router.get(
    "/",
    requireRole(["doctor", "assistant", "admin"]),
    getPreclinicalController
  );

router.patch(
    "/:id/status",
    requireRole(["doctor", "assistant", "admin"]),
    updatePreclinicalStatusController
  );

router.get(
    "/:id",
    requireRole(["doctor", "admin"]),
    getPreclinicalByIdController
);

export default router;