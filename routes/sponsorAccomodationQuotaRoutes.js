import express from "express";
import {
  createSponsorAccomodationQuota,
  getSponsorAccomodationQuotasByEvent,
  getMyAccomodationQuotas,
  updateSponsorAccomodationQuota,
  deleteSponsorAccomodationQuota,
} from "../controllers/sponsorAccomodationQuotaController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { protectSponsor } from "../middlewares/sponsorAuthMiddleware.js";


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
// Sponsor: Get Own Accomodation Quota
// =======================
router.get(
  "/sponsor/events/:eventId/accomodation-quotas",
  protectSponsor,
  getMyAccomodationQuotas
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
// EventAdmin: Delete Sponsor Accomodation Quota for a specific quota
// =======================
router.delete(
  "/event-admin/accomodation-quotas/:id/:quotaId",
  protect,
  authorizeRoles("eventAdmin"),
  deleteSponsorAccomodationQuota
);

export default router;
