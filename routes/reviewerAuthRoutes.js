// routes/reviewerAuthRoutes.js
import express from "express";
import cookieParser from "cookie-parser";
import {
  loginReviewer,
  logoutReviewer,
  refreshAccessTokenReviewer,
  forgotPasswordReviewer,
  resetPasswordReviewer,
  getMyEventReviewer,
} from "../controllers/reviewerAuthController.js";
import { protectReviewer } from "../middlewares/reviewerAuthMiddleware.js";

const router = express.Router();

router.use(cookieParser());

// Login
router.post("/login", loginReviewer);

// Refresh Token
router.get("/refresh-token", refreshAccessTokenReviewer);

// Logout
router.post("/logout", protectReviewer, logoutReviewer);

// Forgot Password
router.post("/forgot-password", forgotPasswordReviewer);

// Reset Password
router.post("/reset-password/:token", resetPasswordReviewer);

// Get My Event & Categories
router.get("/my-event", protectReviewer, getMyEventReviewer);

export default router;
