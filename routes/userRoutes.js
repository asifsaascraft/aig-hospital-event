import express from "express";
import cookieParser from "cookie-parser";
import {
  registerUser,
  loginUser,
  refreshAccessTokenUser,
  logoutUser,
  forgotPasswordUser,
  resetPasswordUser,
} from "../controllers/userController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Middleware to parse cookies
router.use(cookieParser());

// =======================
// User Routes
// =======================

// Public signup
router.post("/register", registerUser);

// User login
router.post("/login", loginUser);

// Refresh access token (GET, using cookies)
router.get("/refresh-token", refreshAccessTokenUser);

// Logout user
router.post(
  "/logout",
  protect,
  authorizeRoles("user"),
  logoutUser
);

// Forgot password
router.post("/forgot-password", forgotPasswordUser);

// Reset password
router.post("/reset-password/:token", resetPasswordUser);

export default router;
