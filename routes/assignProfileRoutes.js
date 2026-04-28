import express from "express";
import {
  assignProfile,
  getAssignedProfilesByEvent,
  removeAssignedRegistration,
  reassignRegistrationProfile
} from "../controllers/assignProfileController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Assign / Append
router.post(
  "/event-admin/events/:eventId/assign-profile",
  protect,
  authorizeRoles("eventAdmin"),
  assignProfile
);

// Get
router.get(
  "/events/:eventId/assign-profile",
  getAssignedProfilesByEvent
);

// Remove one registration
router.put(
  "/event-admin/assign-profile/:id/remove",
  protect,
  authorizeRoles("eventAdmin"),
  removeAssignedRegistration
);

router.put(
  "/event-admin/events/:eventId/reassign-profile",
  protect,
  authorizeRoles("eventAdmin"),
  reassignRegistrationProfile
);

export default router;