// routes/sponsorAuthRoutes.js
import express from "express";
import cookieParser from "cookie-parser";
import {
  loginSponsor,
  logoutSponsor,
  refreshAccessTokenSponsor,
  forgotPasswordSponsor,
  resetPasswordSponsor,
} from "../controllers/sponsorAuthController.js";
import { protectSponsor } from "../middlewares/sponsorAuthMiddleware.js";

const router = express.Router();

router.use(cookieParser());

// Login
router.post("/login", loginSponsor);

// Refresh Access Token
router.get("/refresh-token", refreshAccessTokenSponsor);

// Logout
router.post("/logout", protectSponsor, logoutSponsor);

// Forgot Password
router.post("/forgot-password", forgotPasswordSponsor);

// Reset Password
router.post("/reset-password/:token", resetPasswordSponsor);

export default router;
