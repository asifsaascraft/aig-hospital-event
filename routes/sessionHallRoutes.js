import express from "express";

import {
  createSessionHall,
  getSessionHallsByEvent,
  getActiveSessionHallsByEvent,
  updateSessionHall,
  deleteSessionHall,
} from "../controllers/sessionHallController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Session Hall
// =======================
router.post(
  "/event-admin/events/:eventId/session-halls",
  protect,
  authorizeRoles("eventAdmin"),
  createSessionHall
);

// =======================
// Public/User: Get All Session Halls
// =======================
router.get(
  "/events/:eventId/session-halls",
  getSessionHallsByEvent
);

// =======================
// Public/User: Get Active Session Halls
// =======================
router.get(
  "/events/:eventId/session-halls/active",
  getActiveSessionHallsByEvent
);

// =======================
// EventAdmin: Update Session Hall
// =======================
router.put(
  "/event-admin/session-halls/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateSessionHall
);

// =======================
// EventAdmin: Delete Session Hall
// =======================
router.delete(
  "/event-admin/session-halls/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteSessionHall
);

export default router;