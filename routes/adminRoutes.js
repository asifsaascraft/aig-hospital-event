// routes/adminRoutes.js
import express from "express";
import cookieParser from "cookie-parser";
import {
  registerAdmin,
  loginAdmin,
  refreshAccessToken,
  logoutAdmin,
  forgotPassword,
  resetPassword
} from "../controllers/adminController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Middleware to parse cookies
router.use(cookieParser());

// =======================
// Admin Routes
// =======================

// Signup - only via Postman
router.post("/register", registerAdmin);

// Login
router.post("/login", loginAdmin);

// Refresh access token
router.post("/refresh-token", refreshAccessToken);

// Logout
router.post("/logout", protect, authorizeRoles("admin"), logoutAdmin);

// Forgot Password
router.post("/forgot-password", forgotPassword);

// Reset Password
router.post("/reset-password/:token", resetPassword);

export default router;
