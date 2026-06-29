import express from "express";

import {
  createSessionTrack,
  getSessionTracksByEvent,
  getActiveSessionTracksByEvent,
  updateSessionTrack,
  deleteSessionTrack,
} from "../controllers/sessionTrackController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Session Track
// =======================
router.post(
  "/event-admin/events/:eventId/session-tracks",
  protect,
  authorizeRoles("eventAdmin"),
  createSessionTrack
);

// =======================
// Public/User: Get All Session Tracks
// =======================
router.get(
  "/events/:eventId/session-tracks",
  getSessionTracksByEvent
);

// =======================
// Public/User: Get Active Session Tracks
// =======================
router.get(
  "/events/:eventId/session-tracks/active",
  getActiveSessionTracksByEvent
);

// =======================
// EventAdmin: Update Session Track
// =======================
router.put(
  "/event-admin/session-tracks/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateSessionTrack
);

// =======================
// EventAdmin: Delete Session Track
// =======================
router.delete(
  "/event-admin/session-tracks/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteSessionTrack
);

export default router;