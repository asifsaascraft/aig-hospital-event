import express from "express";
import { protectSponsor } from "../middlewares/sponsorAuthMiddleware.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import {
  createAccomodation,
  getAccomodationBySponsor,
  getMyBookedAssignedAccomodations,
  getAllAccomodationByEvent,
  updateAccomodation,
  deleteAccomodation,
  getAccomodationSummary,
} from "../controllers/sponsorAccomodationController.js";

const router = express.Router();

// Create
router.post(
  "/sponsor/events/:eventId/accomodation",
  protectSponsor,
  createAccomodation
);

// Get
router.get(
  "/sponsor/events/:eventId/accomodation",
  protectSponsor,
  getAccomodationBySponsor
);

// =======================
// Sponsor: Get Only Booked Assigned Delegates
// =======================
router.get(
  "/sponsor/events/:eventId/booked-assigned-accomodation",
  protectSponsor,
  getMyBookedAssignedAccomodations
);

// =======================
// Event Admin: Get All Accomodation By Event
// =======================
router.get(
  "/event-admin/events/:eventId/accomodation",
  protect,
  authorizeRoles("eventAdmin"),
  getAllAccomodationByEvent
);

// Summary
router.get(
  "/sponsor/events/:eventId/accomodation-summary",
  protectSponsor,
  getAccomodationSummary
);

// Update
router.put(
  "/sponsor/events/:eventId/accomodation/:id",
  protectSponsor,
  updateAccomodation
);

// Delete
router.delete(
  "/sponsor/accomodation/:id",
  protectSponsor,
  deleteAccomodation
);

export default router;