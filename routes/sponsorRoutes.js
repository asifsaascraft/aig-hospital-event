import express from "express";
import {
  createSponsor,
  getSponsorsByEvent,
  getActiveSponsorsByEvent,
  updateSponsor,
  deleteSponsor,
} from "../controllers/sponsorController.js";
import { uploadSponsorImage } from "../middlewares/uploadMiddleware.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Sponsor
// =======================
router.post(
  "/event-admin/events/:eventId/sponsors",
  protect,
  authorizeRoles("eventAdmin"),
  uploadSponsorImage.single("sponsorImage"),
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
  uploadSponsorImage.single("sponsorImage"),
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

export default router;
