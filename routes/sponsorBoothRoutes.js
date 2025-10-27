import express from "express";
import {
  createSponsorBooth,
  getSponsorBoothsByEvent,
  updateSponsorBooth,
  deleteSponsorBooth,
} from "../controllers/sponsorBoothController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { uploadBoothPDF } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Sponsor Booth
// =======================
router.post(
  "/event-admin/events/:eventId/booths",
  protect,
  authorizeRoles("eventAdmin"),
  uploadBoothPDF.single("boothImageUpload"),
  createSponsorBooth
);

// =======================
// Public/User: Get All Sponsor Booths by Event ID
// =======================
router.get("/events/:eventId/booths", getSponsorBoothsByEvent);

// =======================
// EventAdmin: Update Sponsor Booth
// =======================
router.put(
  "/event-admin/booths/:id",
  protect,
  authorizeRoles("eventAdmin"),
  uploadBoothPDF.single("boothImageUpload"),
  updateSponsorBooth
);

// =======================
// EventAdmin: Delete Sponsor Booth
// =======================
router.delete(
  "/event-admin/booths/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteSponsorBooth
);

export default router;
