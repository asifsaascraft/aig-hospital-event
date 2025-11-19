// routes/exhibitorAuthRoutes.js
import express from "express";
import cookieParser from "cookie-parser";
import {
  loginExhibitor,
  logoutExhibitor,
  refreshAccessTokenExhibitor,
  forgotPasswordExhibitor,
  resetPasswordExhibitor,
  getMyEventExhibitor,
} from "../controllers/exhibitorAuthController.js";
import { protectExhibitor } from "../middlewares/exhibitorAuthMiddleware.js";

const router = express.Router();

router.use(cookieParser());

// Login
router.post("/login", loginExhibitor);

// Refresh Access Token
router.get("/refresh-token", refreshAccessTokenExhibitor);

// Logout
router.post("/logout", protectExhibitor, logoutExhibitor);

// Forgot Password
router.post("/forgot-password", forgotPasswordExhibitor);

// Reset Password
router.post("/reset-password/:token", resetPasswordExhibitor);

// Get My Event
router.get("/my-event", protectExhibitor, getMyEventExhibitor);

export default router;
