import express from "express";
import {
  assignTravel,
  removeTravel,
  reassignTravel,
  getUnassignedTravels,
  getAssignSummary,
} from "../controllers/assignTravelController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Assign
router.post(
  "/event-admin/events/:eventId/assign-travel",
  protect,
  authorizeRoles("eventAdmin"),
  assignTravel
);

// Remove single travel
router.put(
  "/event-admin/assign/:assignId/remove",
  protect,
  authorizeRoles("eventAdmin"),
  removeTravel
);

// Reassign
router.put(
  "/event-admin/events/:eventId/reassign",
  protect,
  authorizeRoles("eventAdmin"),
  reassignTravel
);

// Unassigned
router.get(
  "/event-admin/events/:eventId/unassigned-travels",
  protect,
  authorizeRoles("eventAdmin"),
  getUnassignedTravels
);

// Summary
router.get(
  "/event-admin/events/:eventId/summary",
  protect,
  authorizeRoles("eventAdmin"),
  getAssignSummary
);

export default router;