import express from "express";
import {
  createSponsorTravelQuota,
  getSponsorTravelQuotasByEvent,
  updateSponsorTravelQuota,
  deleteSponsorTravelQuota,
} from "../controllers/sponsorTravelQuotaController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Sponsor Travel Quota
// =======================
router.post(
  "/event-admin/events/:eventId/travel-quotas",
  protect,
  authorizeRoles("eventAdmin"),
  createSponsorTravelQuota
);

// =======================
// Public/User: Get All Travel Quotas by Event ID
// =======================
router.get("/events/:eventId/travel-quotas", getSponsorTravelQuotasByEvent);

// =======================
// EventAdmin: Update Sponsor Travel Quota
// =======================
router.put(
  "/event-admin/travel-quotas/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateSponsorTravelQuota
);

// =======================
// EventAdmin: Delete Sponsor Travel Quota
// =======================
router.delete(
  "/event-admin/travel-quotas/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteSponsorTravelQuota
);

export default router;
