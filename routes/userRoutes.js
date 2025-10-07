import express from "express";
import cookieParser from "cookie-parser";
import {
  registerUser,
  loginUser,
  refreshAccessTokenUser,
  logoutUser,
  forgotPasswordUser,
  resetPasswordUser,
  getUserProfile,
  updateUserProfile,
} from "../controllers/userController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { uploadProfileImage } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Middleware to parse cookies
router.use(cookieParser());

// =======================
// User Routes
// =======================

// Public signup
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Refresh access token (GET, using cookies)
router.get("/refresh-token", refreshAccessTokenUser);

// Logout - User only
router.post(
  "/logout",
  protect, // ensures user is logged in
  authorizeRoles("user"), // user-only
  logoutUser
);

// Forgot Password
router.post("/forgot-password", forgotPasswordUser);

// Reset Password
router.post("/reset-password/:token", resetPasswordUser);

// Get User Profile - User only
router.get(
  "/profile",
  protect, // ensures user is logged in
  authorizeRoles("user"), // user-only
  getUserProfile
);

// Update User Profile - User only
router.put(
  "/profile",
  protect, // ensures user is logged in
  authorizeRoles("user"), // user-only
  uploadProfileImage.single("profilePicture"), // handles profile image upload
  updateUserProfile
);

export default router;
