import express from "express";
import {
  createBooth,
  getBoothsByEvent,
  updateBooth,
  deleteBooth,
} from "../controllers/boothController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { uploadBoothPDF } from "../middlewares/uploadMiddleware.js"; 

const router = express.Router();

// =======================
// EventAdmin: Create Booth
// =======================
router.post(
  "/event-admin/events/:eventId/booths",
  protect,
  authorizeRoles("eventAdmin"),
  uploadBoothPDF.single("boothImageUpload"), 
  createBooth
);

// =======================
// Public/User: Get All Booths by Event ID
// =======================
router.get("/events/:eventId/booths", getBoothsByEvent);

// =======================
// EventAdmin: Update Booth
// =======================
router.put(
  "/event-admin/booths/:id",
  protect,
  authorizeRoles("eventAdmin"),
  uploadBoothPDF.single("boothImageUpload"), 
  updateBooth
);

// =======================
// EventAdmin: Delete Booth
// =======================
router.delete(
  "/event-admin/booths/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteBooth
);

export default router;
