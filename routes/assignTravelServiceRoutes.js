import express from "express";
import {
  assignTravelService,
  getAssignedTravelServicesByEvent,
  removeAssignedTravelRegistration,
  reassignTravelService,
} from "../controllers/assignTravelServiceController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// Assign Travel Service
// =======================
router.post(
  "/event-admin/events/:eventId/assign-travel-services",
  protect,
  authorizeRoles("eventAdmin"),
  assignTravelService
);

// =======================
// Get Assigned Travel Services
// =======================
router.get(
  "/events/:eventId/assign-travel-services",
  getAssignedTravelServicesByEvent
);

// =======================
// Remove registration
// =======================
router.put(
  "/event-admin/assign-travel-services/:id/remove",
  protect,
  authorizeRoles("eventAdmin"),
  removeAssignedTravelRegistration
);

// =======================
// Reassign
// =======================
router.put(
  "/event-admin/events/:eventId/reassign-travel-services",
  protect,
  authorizeRoles("eventAdmin"),
  reassignTravelService
);

export default router;