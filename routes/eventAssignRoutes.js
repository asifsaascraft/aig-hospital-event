// routes/eventAssignRoutes.js
import express from "express";
import {
  getEventAssignments,
  assignEvent,
  updateAssignedEvent,
  removeAssignedEvent,
} from "../controllers/eventAssignController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// Admin-only: Get all event assignments
// =======================
router.get(
  "/admin/event-assignments",
  protect,
  authorizeRoles("admin"),
  getEventAssignments
);

// =======================
// Admin-only: Assign an event to eventAdmin
// =======================
router.post(
  "/admin/event-assign",
  protect,
  authorizeRoles("admin"),
  assignEvent
);

// =======================
// Admin-only: Update assigned event by eventAdmin ID
// =======================
router.put(
  "/admin/event-assign",
  protect,
  authorizeRoles("admin"),
  updateAssignedEvent
);

// =======================
// Admin-only: Remove assigned event by eventAdmin ID and event ID
// =======================
router.delete(
  "/admin/event-assign/:eventAdminId/:eventId",
  protect,
  authorizeRoles("admin"),
  removeAssignedEvent
);

export default router;
