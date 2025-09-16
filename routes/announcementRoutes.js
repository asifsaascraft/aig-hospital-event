import express from "express";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get announcements - only logged in users (any role)
router.get(
  "/announcements",
  protect, //  ensures user is logged in
  getAnnouncements
);

// Admin-only: Create, Update, Delete
router.post(
  "/admin/announcements",
  protect,
  authorizeRoles("admin"),
  createAnnouncement
);

router.put(
  "/admin/announcements/:id",
  protect,
  authorizeRoles("admin"),
  updateAnnouncement
);

router.delete(
  "/admin/announcements/:id",
  protect,
  authorizeRoles("admin"),
  deleteAnnouncement
);

export default router;
