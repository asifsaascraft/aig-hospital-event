import express from "express";
import {
  createSponsor,
  getSponsorsByEvent,
  getActiveSponsorsByEvent,
  updateSponsor,
  deleteSponsor,
  getSponsorSummary,
} from "../controllers/sponsorController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Sponsor
// =======================
router.post(
  "/event-admin/events/:eventId/sponsors",
  protect,
  authorizeRoles("eventAdmin"),
  createSponsor
);

// =======================
// Public/User: Get All Sponsors by Event ID
// =======================
router.get(
  "/events/:eventId/sponsors",
  getSponsorsByEvent
);

// =======================
// Public/User: Get Active Sponsors by Event ID
// =======================
router.get(
  "/events/:eventId/sponsors/active",
  getActiveSponsorsByEvent
);


// =======================
// EventAdmin: Update Sponsor
// =======================
router.put(
  "/event-admin/sponsors/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateSponsor
);

// =======================
// EventAdmin: Delete Sponsor
// =======================
router.delete(
  "/event-admin/sponsors/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteSponsor
);

// =======================
// SUMMARY API
// =======================
router.get(
  "/event-admin/events/:eventId/sponsors/summary",
  protect,
  authorizeRoles("eventAdmin"),
  getSponsorSummary
);


export default router;
