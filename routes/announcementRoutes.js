import express from "express";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public: Get all announcements
router.get("/announcements", getAnnouncements);

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
