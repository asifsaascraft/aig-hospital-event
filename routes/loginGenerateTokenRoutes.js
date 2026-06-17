import express from "express";

import {
  createLoginGenerateToken,
  getLoginGenerateTokensByEvent,
  updateLoginGenerateToken,
  deleteLoginGenerateToken,
} from "../controllers/loginGenerateTokenController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// Get All Tokens By Event
// =======================
router.get(
  "/events/:eventId/login-generate-token",
  getLoginGenerateTokensByEvent
);

// =======================
// Create Token
// =======================
router.post(
  "/event-admin/events/:eventId/login-generate-token",
  protect,
  authorizeRoles("eventAdmin"),
  createLoginGenerateToken
);

// =======================
// Update Token
// =======================
router.put(
  "/event-admin/login-generate-token/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateLoginGenerateToken
);

// =======================
// Delete Token
// =======================
router.delete(
  "/event-admin/login-generate-token/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteLoginGenerateToken
);

export default router;