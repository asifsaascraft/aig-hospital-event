import express from "express";
import {
  getVenues,
  createVenue,
  updateVenue,
  deleteVenue,
} from "../controllers/venueController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { uploadVenueImage } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Public: anyone can view all venues
router.get("/venues", getVenues);

// Admin-only: Create a new venue (with image upload)
router.post(
  "/admin/venues",
  protect, // checks if user is logged in
  authorizeRoles("admin"), // only admins can access
  uploadVenueImage.single("venueImage"), // handles single image upload for "venueImage" field
  createVenue
);

// Admin-only: Update an existing venue (optionally update image)
router.put(
  "/admin/venues/:id",
  protect,
  authorizeRoles("admin"),
  uploadVenueImage.single("venueImage"), // optional new image
  updateVenue
);

// Admin-only: Delete a venue
router.delete(
  "/admin/venues/:id",
  protect,
  authorizeRoles("admin"),
  deleteVenue
);

export default router;
