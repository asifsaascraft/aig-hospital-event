import express from "express";
import {
  loginEventAdmin,
  logoutEventAdmin,
  refreshAccessTokenEventAdmin,
  forgotPasswordEventAdmin,
  resetPasswordEventAdmin,
} from "../controllers/eventAdminController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// Event Admin Routes
// =======================

// Public routes (login + password reset)
router.post("/login", loginEventAdmin);
router.post("/forgot-password", forgotPasswordEventAdmin);
router.post("/reset-password/:token", resetPasswordEventAdmin);

// Protected routes
router.post(
  "/logout",
  protect, // ensures user is logged in
  authorizeRoles("eventAdmin"), // eventAdmin-only
  logoutEventAdmin
);

router.get("/refresh-token", refreshAccessTokenEventAdmin);

export default router;
