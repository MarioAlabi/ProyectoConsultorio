import express from "express";
import { createPreclinicalController, getPreclinicalController, updatePreclinicalStatusController, getPreclinicalByIdController  } from "../controllers/preclinicalController.js";
import { requireRole } from "../middleware/requireRole.js";


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
  
router.patch(
    "/:id/status",
    requireRole(["DOCTOR", "ADMIN"]),
    updatePreclinicalStatusController
);

router.get(
    "/:id",
    requireRole(["DOCTOR", "ADMIN"]),
    getPreclinicalByIdController
);

export default router;