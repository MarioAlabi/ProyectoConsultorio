// src/routes/authRoutes.js
import express from "express";
import * as authController from "../controllers/authController.js";
import * as validations from "../middleware/validator.js";

const router = express.Router();

router.post("/login", validations.loginValidator, validations.validateRequest, authController.login);
router.post("/logout", authController.logoutUser);

export default router;