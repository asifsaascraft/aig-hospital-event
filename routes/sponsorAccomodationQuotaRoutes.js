import express from "express";
import {
  createSponsorAccomodationQuota,
  getSponsorAccomodationQuotasByEvent,
  updateSponsorAccomodationQuota,
  deleteSponsorAccomodationQuota,
} from "../controllers/sponsorAccomodationQuotaController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Sponsor Accomodation Quota
// =======================
router.post(
  "/event-admin/events/:eventId/accomodation-quotas",
  protect,
  authorizeRoles("eventAdmin"),
  createSponsorAccomodationQuota
);

// =======================
// Public/User: Get All Accomodation Quotas by Event ID
// =======================
router.get(
  "/events/:eventId/accomodation-quotas",
  getSponsorAccomodationQuotasByEvent
);

// =======================
// EventAdmin: Update Sponsor Accomodation Quota
// =======================
router.put(
  "/event-admin/accomodation-quotas/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateSponsorAccomodationQuota
);

// =======================
// EventAdmin: Delete Sponsor Accomodation Quota
// =======================
router.delete(
  "/event-admin/accomodation-quotas/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteSponsorAccomodationQuota
);

export default router;
