import express from "express";

import {
  createSession,
  getSessionsByEvent,
  getActiveSessionsByEvent,
  getSessionById,
  updateSession,
  deleteSession,
} from "../controllers/sessionController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Session
// =======================
router.post(
  "/event-admin/events/:eventId/sessions",
  protect,
  authorizeRoles("eventAdmin"),
  createSession
);

// =======================
// Public/User: Get All Sessions
// =======================
router.get(
  "/events/:eventId/sessions",
  getSessionsByEvent
);

// =======================
// Public/User: Get Active Sessions
// =======================
router.get(
  "/events/:eventId/sessions/active",
  getActiveSessionsByEvent
);

// =======================
// Public/User: Get Session By Id
// =======================
router.get(
  "/sessions/:id",
  getSessionById
);

// =======================
// EventAdmin: Update Session
// =======================
router.put(
  "/event-admin/sessions/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateSession
);

// =======================
// EventAdmin: Delete Session
// =======================
router.delete(
  "/event-admin/sessions/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteSession
);

export default router;