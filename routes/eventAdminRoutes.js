import express from "express";
import {
  loginEventAdmin,
  logoutEventAdmin,
  refreshAccessTokenEventAdmin,
  forgotPasswordEventAdmin,
  resetPasswordEventAdmin,
  myEvents,
  myEventById,
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

// Refresh access token (GET, using cookies)
router.get("/refresh-token", refreshAccessTokenEventAdmin);

// Protected route for eventAdmin to see their assigned events
router.get(
  "/my-events",
  protect, // ensures user is logged in
  authorizeRoles("eventAdmin"), // only eventAdmin
  myEvents
);

// Get single assigned event details with modules
router.get(
  "/my-events/:eventId",
  protect,
  authorizeRoles("eventAdmin"),
  myEventById
);


export default router;
