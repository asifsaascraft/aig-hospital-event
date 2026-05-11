import express from "express";
import {
  assignAccomodationService,
  getAssignedAccomodationServicesByEvent,
  getMyAssignedAccomodationServices,
  removeAssignedAccomodationRegistration,
  reassignAccomodationService,
} from "../controllers/assignAccomodationServiceController.js";
import { protectSponsor } from "../middlewares/sponsorAuthMiddleware.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// Assign Accommodation Service
// =======================
router.post(
  "/event-admin/events/:eventId/assign-accomodation-services",
  protect,
  authorizeRoles("eventAdmin"),
  assignAccomodationService
);

// =======================
// Get Assigned Accommodation Services
// =======================
router.get(
  "/events/:eventId/assign-accomodation-services",
  getAssignedAccomodationServicesByEvent
);


// =======================
// Sponsor Get Own Assigned Accommodation Services
// =======================
router.get(
  "/sponsor/events/:eventId/my-assign-accomodation-services",
  protectSponsor,
  getMyAssignedAccomodationServices,
);

// =======================
// Remove registration
// =======================
router.put(
  "/event-admin/assign-accomodation-services/:id/remove",
  protect,
  authorizeRoles("eventAdmin"),
  removeAssignedAccomodationRegistration
);

// =======================
// Reassign
// =======================
router.put(
  "/event-admin/events/:eventId/reassign-accomodation-services",
  protect,
  authorizeRoles("eventAdmin"),
  reassignAccomodationService
);

export default router;