import express from "express";
import {
  assignTravelService,
  getAssignedTravelServicesByEvent,
  getMyAssignedTravelServices,
  removeAssignedTravelRegistration,
  reassignTravelService,
} from "../controllers/assignTravelServiceController.js";
import { protectSponsor } from "../middlewares/sponsorAuthMiddleware.js";
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
// Sponsor Get Own Assigned Travel Services
// =======================
router.get(
  "/sponsor/events/:eventId/my-assign-travel-services",
  protectSponsor,
  getMyAssignedTravelServices
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