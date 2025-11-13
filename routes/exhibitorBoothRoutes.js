import express from "express";
import {
  createExhibitorBooth,
  getExhibitorBoothsByEvent,
  getActiveExhibitorBoothsByEvent,
  updateExhibitorBooth,
  deleteExhibitorBooth,
} from "../controllers/exhibitorBoothController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { uploadBoothPDF } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// =======================
// EventAdmin: Create Exhibitor Booth
// =======================
router.post(
  "/event-admin/events/:eventId/exhibitor-booths",
  protect,
  authorizeRoles("eventAdmin"),
  uploadBoothPDF.single("boothImageUpload"),
  createExhibitorBooth
);

// =======================
// Public/User: Get All Exhibitor Booths by Event ID
// =======================
router.get("/events/:eventId/exhibitor-booths", getExhibitorBoothsByEvent);

// =======================
// Public/User: Get Active Exhibitor Booths by Event ID
// =======================
router.get("/events/:eventId/exhibitor-booths/active", getActiveExhibitorBoothsByEvent);

// =======================
// EventAdmin: Update Exhibitor Booth
// =======================
router.put(
  "/event-admin/exhibitor-booths/:id",
  protect,
  authorizeRoles("eventAdmin"),
  uploadBoothPDF.single("boothImageUpload"),
  updateExhibitorBooth
);

// =======================
// EventAdmin: Delete Exhibitor Booth
// =======================
router.delete(
  "/event-admin/exhibitor-booths/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteExhibitorBooth
);

export default router;
