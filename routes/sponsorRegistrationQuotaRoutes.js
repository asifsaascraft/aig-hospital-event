import express from "express";
import {
  createSponsorRegistrationQuota,
  getSponsorRegistrationQuotasByEvent,
  updateSponsorRegistrationQuota,
  deleteSponsorRegistrationQuota,
} from "../controllers/sponsorRegistrationQuotaController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Sponsor Registration Quota
// =======================
router.post(
  "/event-admin/events/:eventId/quotas",
  protect,
  authorizeRoles("eventAdmin"),
  createSponsorRegistrationQuota
);

// =======================
// Public/User: Get All Quotas by Event ID
// =======================
router.get("/events/:eventId/quotas", getSponsorRegistrationQuotasByEvent);

// =======================
// EventAdmin: Update Sponsor Registration Quota
// =======================
router.put(
  "/event-admin/quotas/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateSponsorRegistrationQuota
);

// =======================
// EventAdmin: Delete Sponsor Registration Quota
// =======================
router.delete(
  "/event-admin/quotas/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteSponsorRegistrationQuota
);

export default router;
